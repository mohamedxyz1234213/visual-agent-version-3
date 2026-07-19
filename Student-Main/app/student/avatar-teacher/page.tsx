"use client";

import { useState, useRef, useEffect } from "react";
import { startAvatarSession, sendAvatarMessage, endAvatarSession } from "@/features/student/api";
import { IconStar, IconCompass, IconBook, IconTrophy, IconAlertCircle, IconRobot } from "@/components/shared/FluxIcons";

export default function AvatarTeacherPage() {
  const [messages, setMessages] = useState<{ role: string; text: string; emotion?: string }[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleStart() {
    try {
      const data = await startAvatarSession({ topic: "General Programming", dialect: "msa" });
      setSessionId(data.sessionId);
      setMessages([{ role: "assistant", text: data.greetingText, emotion: "happy" }]);
    } catch {
      setMessages([{ role: "assistant", text: "مرحباً! أنا نور، معلمة البرمجة. كيف أستطيع مساعدتك اليوم؟", emotion: "happy" }]);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const data = await sendAvatarMessage({ sessionId: sessionId!, content: userMsg });
      setMessages((prev) => [...prev, { role: "assistant", text: data.text, emotion: data.emotion }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "أعتذر، حدث خطأ. حاول مرة أخرى.", emotion: "concerned" }]);
    } finally { setLoading(false); }
  }

  const emotionIcon: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
    happy: IconStar, thinking: IconCompass, explaining: IconBook, celebrating: IconTrophy, concerned: IconAlertCircle, neutral: IconRobot,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">AI Avatar Teacher</h2>
        <p className="text-sm text-gray-500 mt-1">Chat with Nour, your AI coding teacher</p>
      </div>

      {!sessionId ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <div className="w-20 h-20 bg-[#D4F542]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><IconRobot size={36} className="text-[#18181B]" /></div>
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">Meet Nour</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Nour is your AI coding teacher. She can explain concepts, help with exercises, and guide you through your coding journey.</p>
          <button onClick={handleStart} className="px-6 py-3 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors">Start Session</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: "calc(100% - 60px)" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (() => { const EmotionIcon = emotionIcon[msg.emotion || "neutral"]; return (
                  <div className="w-8 h-8 rounded-full bg-[#D4F542] flex items-center justify-center flex-shrink-0"><EmotionIcon size={16} className="text-[#18181B]" /></div>
                ); })()}
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-[#18181B] text-white rounded-br-sm" : "bg-gray-100 text-[#18181B] rounded-bl-sm"}`}>{msg.text}</div>
              </div>
            ))}
            {loading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-[#D4F542] flex items-center justify-center"><IconRobot size={16} className="text-[#18181B]" /></div><div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm text-sm text-gray-500">Typing...</div></div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-100 p-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Nour about coding..." className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4F542]" />
              <button type="submit" disabled={loading || !input.trim()} className="px-5 py-3 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors disabled:opacity-50">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
