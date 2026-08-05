"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Whiteboard } from "@/components/Whiteboard";
import type { StoryboardScene } from "@/lib/types";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface DemoScene {
  at: number;
  type: StoryboardScene["action_type"];
  payload: Record<string, unknown>;
}

const DEMO_SCENES: DemoScene[] = [
  { at: 0.2, type: "draw_text", payload: { content: "Intro to Loops", position: [400, 70], style: { fontSize: 28, color: "#0f172a", fontWeight: "bold", textAnchor: "middle" } } },
  { at: 0.6, type: "draw_text", payload: { content: "Repeat code without writing it twice", position: [400, 108], style: { fontSize: 15, color: "#64748b", textAnchor: "middle" } } },
  { at: 2.2, type: "draw_rect", payload: { x: 120, y: 190, width: 260, height: 120, rx: 14, label: "for loop", style: { fill: "#eef2ff", stroke: "#6366f1", strokeWidth: 2.5 } } },
  { at: 2.6, type: "draw_text", payload: { content: "Runs the same block many times", position: [250, 258], style: { fontSize: 17, color: "#312e81", textAnchor: "middle" } } },
  { at: 4.4, type: "draw_code_block", payload: {
    code: "for i in range(5):\n    print(i)",
    language: "python",
    position: [460, 200],
    width: 300,
    height: 150,
    filename: "loops.py",
    execution_status: "success",
  } },
  { at: 6.6, type: "draw_circle", payload: { center: [575, 320], radius: 40, style: { fill: "#d1fae5", stroke: "#10b981", strokeWidth: 2 } } },
  { at: 6.8, type: "draw_text", payload: { content: "i = 0 → 1 → 2 … 4", position: [575, 327], style: { fontSize: 16, color: "#065f46", textAnchor: "middle" } } },
  { at: 8.6, type: "draw_caption", payload: { content: "For this lesson, this is the narration track you hear.", index: 0, total: 3, estimatedDurationSeconds: 3, narrationText: "For this lesson, this is the narration track you hear." } },
  { at: 11.6, type: "draw_caption", payload: { content: "range(5) gives us 0, 1, 2, 3, and 4.", index: 1, total: 3, estimatedDurationSeconds: 3, narrationText: "range five gives us zero, one, two, three, and four." } },
  { at: 14.6, type: "draw_caption", payload: { content: "Each pass, the body runs and i moves to the next number.", index: 2, total: 3, estimatedDurationSeconds: 3, narrationText: "Each pass, the body runs and i moves to the next number." } },
  { at: 18.2, type: "clear", payload: {} },
  { at: 18.6, type: "draw_text", payload: { content: "And just like that — a loop!", position: [400, 140], style: { fontSize: 34, color: "#0f172a", fontWeight: "bold", textAnchor: "middle" } } },
  { at: 18.8, type: "draw_text", payload: { content: "Try the live lesson to practice your own loops", position: [400, 185], style: { fontSize: 16, color: "#64748b", textAnchor: "middle" } } },
];

const LOOP_START = 18.6;
const LOOP_END = 20.5;
const DURATION = LOOP_END;
const NARRATION_AUDIO = "/intro-loops-demo.mp3";
const NARRATION_SECONDS = 14.66;

function buildScenes(): StoryboardScene[] {
  return DEMO_SCENES.map((s, i) => ({
    id: `home-demo-${i}`,
    time_offset: s.at,
    action_type: s.type,
    payload: s.payload,
  }));
}

export function HomeWhiteboardDemo() {
  const scenes = useMemo(() => buildScenes(), []);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const unlockedRef = useRef(false);

  // Create a single shared narration element the same way a real lesson part
  // does — one continuous Speechify track played against the board timeline.
  const getAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      audioRef.current = new Audio(NARRATION_AUDIO);
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  // Play the narration, catching browser autoplay blocks (music/media must be
  // triggered by a user gesture). Returns true if audio actually started.
  const tryPlay = useCallback(async () => {
    const audio = getAudio();
    if (!audio) return false;
    try {
      await audio.play();
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setAudioBlocked(true);
      } else {
        setAudioBlocked(false);
      }
      return false;
    }
  }, [getAudio]);

  // Once the user interacts anywhere on the page, the browser unlocks audible
  // autoplay — so we can start the voice immediately.
  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      setAudioBlocked(false);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  // Auto-play the demo when it scrolls into view (pauses when it leaves).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Stop cleanly when tab hides
  useEffect(() => {
    const onHide = () => setPlaying(false);
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // Sync narration audio to the board timeline while playing. The track only
  // lasts NARRATION_SECONDS; after that the board keeps drawing silently and
  // the whole thing loops back cleanly (mirroring a lesson part).
  useEffect(() => {
    if (!playing) return;
    const audio = getAudio();
    if (!audio) return;
    if (Math.abs(audio.currentTime - elapsed) > 0.4) {
      audio.currentTime = Math.min(elapsed, audio.duration || NARRATION_SECONDS);
    }
    tryPlay();
  }, [playing, elapsed, getAudio, tryPlay]);

  // When paused, stop audio and clear the muted flag.
  useEffect(() => {
    if (playing) return;
    getAudio()?.pause();
  }, [playing, getAudio]);

  // Loop driver — requestAnimationFrame keeps the board perfectly smooth.
  useEffect(() => {
    if (!playing) return;
    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setElapsed((prev) => {
        if (prev + dt >= DURATION) return 0;
        return prev + dt;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  const speakingNow = playing && elapsed < NARRATION_SECONDS;

  function handlePlayPause() {
    // Any click is a user gesture — the global listener already unlocked audio.
    if (!playing) {
      if (elapsed >= LOOP_END - 0.05) setElapsed(0);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }

  function handleRestart() {
    setPlaying(false);
    setElapsed(0);
    const audio = getAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function handleUnlockClick() {
    unlockedRef.current = true;
    setAudioBlocked(false);
    if (elapsed >= LOOP_END - 0.05) setElapsed(0);
    setPlaying(true);
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* the real whiteboard */}
      <div className="relative bg-[#0F172A] rounded-3xl p-3 sm:p-4 border border-white/10 shadow-2xl shadow-[#171717]/20">
        {/* window bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-white/5 rounded-full px-3 py-1 border border-white/10">
            Live · Intro to Loops
          </span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* the real whiteboard */}
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.03]">
          <Whiteboard
            scenes={scenes}
            elapsed={elapsed}
            width={800}
            height={460}
            showAvatar={playing}
            isSpeaking={speakingNow}
          />
          {audioBlocked && (
            <button
              type="button"
              onClick={handleUnlockClick}
              className="absolute inset-0 flex items-center justify-center"
              aria-label="Enable sound"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0F0F0F]/85 border border-white/20 px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg">
                <VolumeX className="w-4 h-4 text-[#D6F63E]" />
                Tap to unmute the teacher
              </span>
            </button>
          )}
        </div>

        {/* controls */}
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={handlePlayPause}
                aria-label={playing ? "Pause demo" : "Play demo"}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-full bg-[#D6F63E] text-[#0F0F0F] font-semibold text-[12.5px] sm:text-[13px] hover:bg-[#c5e535] transition-colors active:scale-95 shrink-0"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                {playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={handleRestart}
                aria-label="Restart demo"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-full bg-white/10 text-white font-semibold text-[12.5px] sm:text-[13px] hover:bg-white/20 transition-colors active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 min-w-0">
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {audioBlocked
                  ? "Tap to unmute"
                  : playing
                  ? "Teacher is explaining…"
                  : "Press play to start"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}