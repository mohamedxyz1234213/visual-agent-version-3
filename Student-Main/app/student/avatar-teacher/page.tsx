"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { IconRobot, IconMessage } from "@/components/shared/FluxIcons";

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" x2="12" y1="18" y2="22" />
      <line x1="8" x2="16" y1="22" y2="22" />
    </svg>
  );
}

function PhoneIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
import {
  startAvatarSession,
  sendAvatarMessage,
  endAvatarSession,
} from "@/features/student/api";
import type { AvatarSession, AvatarMessage } from "@/features/student/types";

interface ChatItem {
  role: "user" | "assistant";
  text: string;
  emotion?: string;
  codeSnippet?: { language: string; code: string } | null;
}

function AvatarTeacherInner() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lessonId") || undefined;
  const codingLessonId = searchParams.get("codingLessonId") || undefined;

  const [session, setSession] = useState<AvatarSession | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [usingBrowserSpeech, setUsingBrowserSpeech] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-start a session when arriving from the "Learn" page with a lesson context
    let cancelled = false;
    async function init() {
      if (lessonId || codingLessonId) {
        await handleBegin(lessonId, codingLessonId);
      } else {
        await handleBegin(undefined, undefined);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleBegin(topicId?: string, codingId?: string) {
    setLoading(true);
    try {
      const data = await startAvatarSession({
        topic: topicId ? undefined : "programming",
        lessonId: codingId || topicId,
      });
      setSession(data);
      setMessages([
        {
          role: "assistant",
          text: data.greetingText || "Hi! I'm Nour, your AI teacher. What would you like to learn today?",
          emotion: "happy",
        },
      ]);
      if (data.greetingAudio) {
        const g = new Audio(data.greetingAudio);
        setSpeaking(true);
        g.onended = () => setSpeaking(false);
        g.onerror = () => setSpeaking(false);
        g.play().catch(() => setSpeaking(false));
      } else {
        speak(data.greetingText || "");
      }
    } catch (e: any) {
      setSession({ sessionId: "", avatarUrl: "", greetingText: "", greetingAudio: null });
      setMessages([
        {
          role: "assistant",
          text: "Hi! I'm Nour, your AI teacher. What would you like to learn today?",
          emotion: "happy",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text?: string) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading || !session?.sessionId) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const res: AvatarMessage = await sendAvatarMessage({
        sessionId: session.sessionId,
        content: trimmed,
        type: "text",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.text, emotion: res.emotion, codeSnippet: res.codeSnippet },
      ]);
      if (res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        setSpeaking(true);
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => { setSpeaking(false); speak(res.text); };
        audio.play().catch(() => { setSpeaking(false); speak(res.text); });
      } else {
        speak(res.text);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I hit an error. Could you rephrase that?", emotion: "neutral" },
      ]);
    } finally {
      setLoading(false);
      setMicOn(false);
      if (recognition) stopRecognition();
    }
  }

  function supportedByBrowser() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  function speak(text: string) {
    if (!supportedByBrowser()) return;
    setUsingBrowserSpeech(true);
    const utter = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ""));
    utter.lang = "en-US";
    utter.rate = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function toggleMic() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported by this browser. Please type your question.");
      setMicOn(false);
      return;
    }
    if (micOn) {
      stopRecognition();
      setMicOn(false);
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
      handleSend(transcript);
    };
    rec.onend = () => setMicOn(false);
    rec.onerror = () => setMicOn(false);
    setRecognition(rec);
    setMicOn(true);
    rec.start();
  }

  function stopRecognition() {
    try { recognition?.stop(); } catch {}
    setRecognition(null);
  }

  async function handleEnd() {
    try {
      if (session?.sessionId) await endAvatarSession({ sessionId: session.sessionId });
    } catch {}
    setSession(null);
    setMessages([]);
    setInput("");
    await handleBegin();
  }

  const atLeastOneAssistant = messages.some(m => m.role === "assistant");

  return (
    <div className="bg-white rounded-[20px] shadow-card overflow-hidden flex flex-col" style={{ height: "calc(100vh - 140px)", minHeight: 540 }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-gradient-to-r from-[#0F0F0F] to-[#1e1e2f]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#D6F63E] flex items-center justify-center">
            <IconRobot size={22} className="text-[#0F0F0F]" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Nour · AI Teacher</p>
            <p className="text-[11px] text-[#A8A8B5] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              {loading ? "Thinking..." : "Online · Ask me anything"}
            </p>
          </div>
        </div>
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 text-[11px] text-[#A8A8B5] hover:text-white bg-white/10 px-3 py-1.5 rounded-full transition-colors"
        >
          <PhoneIcon size={13} />
          End session
        </button>
      </div>

      {/* ===== Combined Avatar Canvas + Chat ===== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Avatar stage */}
        <div className="lg:w-72 lg:border-r border-[#E5E5E5] flex items-center justify-center p-6 bg-[#0b0b16] relative overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 50% 30%, #312e81 0%, transparent 60%)" }} />
          <div className="relative" style={{ width: 150, height: 213 }}>
            <AvatarStage speaking={speaking || loading} />
          </div>
          {atLeastOneAssistant && (
            <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-[#A8A8B5]">
              {speaking ? "Nour is speaking…" : loading ? "Nour is thinking…" : "Voice enabled"}
            </div>
          )}
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAFAFB]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#0F0F0F] text-white rounded-br-sm"
                    : "bg-white border border-[#E5E5E5] rounded-bl-sm shadow-sm"
                }`}
              >
                {m.codeSnippet && (
                  <pre className="mt-1 mb-2 p-3 rounded-lg bg-[#0b0b16] text-[#D6F63E] text-xs overflow-x-auto font-mono">
                    {m.codeSnippet.code}
                  </pre>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E5E5E5] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-[#D6F63E] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#E5E5E5] p-4 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMic}
            className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              micOn ? "bg-red-500 text-white animate-pulse" : "bg-[#F5F5F5] text-[#0F0F0F] hover:bg-[#E5E5E5]"
            }`}
            title="Use microphone"
          >
            <MicIcon size={18} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Ask Nour anything or type your code question…"
            className="flex-1 px-4 py-3 border border-[#E5E5E5] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D6F63E]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-full bg-[#0F0F0F] text-[#D6F63E] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconMessage size={18} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-[#A0A0A0]">
          {usingBrowserSpeech && <span>Voice replies use your browser&apos;s built-in speech.</span>}
          {!usingBrowserSpeech && <span>Nour answers in Arabic or English — just ask.</span>}
        </div>
      </div>
    </div>
  );
}

function AvatarStage({ speaking }: { speaking: boolean }) {
  return (
    <div className="pointer-events-none relative h-full w-full" data-speaking={speaking ? "true" : "false"}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes t-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes t-jaw { 0%,100%{transform:translateY(0) scaleY(.18)} 50%{transform:translateY(2px) scaleY(.75)} }
        @keyframes t-arm { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-14deg)} }
        @keyframes t-blink { 0%,46%,50%,100%{transform:scaleY(1)} 48%{transform:scaleY(.1)} }
        .t-rig { animation:t-float 4s ease-in-out infinite; transform-origin:50% 100%; }
        .t-jaw { animation:t-jaw .9s ease-in-out infinite; transform-origin:center top; }
        [data-speaking="true"] .t-arm { animation:t-arm 1.2s ease-in-out infinite; transform-box:view-box; transform-origin:110px 220px; }
        .t-eye { animation:t-blink 4.5s linear infinite; transform-box:fill-box; transform-origin:center; }
        @media (prefers-reduced-motion:reduce){.t-rig,.t-jaw,.t-arm,.t-eye{animation:none!important}}
      ` }} />
      <svg className="t-rig h-full w-full" viewBox="0 0 220 310" role="presentation">
        <defs>
          <linearGradient id="tshell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff"/><stop offset=".5" stopColor="#cbd5e1"/><stop offset="1" stopColor="#7c8aa5"/></linearGradient>
          <radialGradient id="tface" cx="40%" cy="25%" r="85%"><stop stopColor="#1f2937"/><stop offset="1" stopColor="#030712"/></radialGradient>
          <linearGradient id="tsuit" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#312e81"/></linearGradient>
        </defs>
        <ellipse cx="110" cy="300" rx="62" ry="8" fill="#0f172a" opacity=".35" />
        <g className="t-arm">
          <rect x="10" y="196" width="24" height="72" rx="12" fill="url(#tshell)" stroke="#0f172a" strokeWidth="4" />
          <circle cx="26" cy="222" r="12" fill="#67e8f9" stroke="#0f172a" strokeWidth="4" />
        </g>
        <g>
          <path d="M84 184h58l10 26h-78Z" fill="#09090b" stroke="#0f172a" strokeWidth="4" />
          <path d="M76 196c14-16 58-16 72 0l12 18v52c0 16-9 26-21 26h-54c-12 0-21-10-21-26v-52Z" fill="url(#tshell)" stroke="#0f172a" strokeWidth="6" />
          <path d="M88 216c7 12 40 12 47 0" fill="none" stroke="#64748b" strokeWidth="4" />
          <rect x="86" y="252" width="47" height="34" rx="6" fill="url(#tsuit)" opacity=".9" />
          <circle cx="109" cy="240" r="9" fill="#67e8f9" stroke="#0f172a" strokeWidth="3" />
        </g>
        <g>
          <rect x="20" y="34" width="180" height="150" rx="64" fill="url(#tshell)" stroke="#0f172a" strokeWidth="7" />
          <rect x="34" y="56" width="152" height="106" rx="44" fill="url(#tface)" stroke="#334155" strokeWidth="5" />
          <circle cx="110" cy="22" r="11" fill="#67e8f9" stroke="#0f172a" strokeWidth="5" />
          <path d="M110 33v18" stroke="#0f172a" strokeWidth="6" />
          <g className="t-eye">
            <ellipse cx="82" cy="104" rx="16" ry="20" fill="#22d3ee" />
            <ellipse cx="138" cy="104" rx="16" ry="20" fill="#22d3ee" />
            <ellipse cx="86" cy="98" rx="5" ry="7" fill="#ecfeff" />
            <ellipse cx="142" cy="98" rx="5" ry="7" fill="#ecfeff" />
          </g>
          <g className="t-jaw">
            <path d="M92 143q18 5 36 0q0 22-18 22t-18-22Z" fill="#083344" stroke="#22d3ee" strokeWidth="4" />
            <ellipse cx="110" cy="159" rx="11" ry="5" fill="#f472b6" opacity=".7" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function AvatarTeacherPage() {
  return (
    <Suspense fallback={<div className="min-h-[540px] bg-white rounded-[20px] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#D6F63E] border-t-transparent rounded-full animate-spin" /></div>}>
      <AvatarTeacherInner />
    </Suspense>
  );
}