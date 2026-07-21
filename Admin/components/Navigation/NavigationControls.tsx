"use client";

import { useLessonStore } from "@/store/lessonStore";
import type { LessonPart } from "@/lib/types";

interface NavigationControlsProps {
  parts: LessonPart[];
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconSkipBack({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  );
}
function IconReplay({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlay({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function IconPause({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function IconSkipForward({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 6h2v12h-2zm-2.5 6L5 6v12z" />
    </svg>
  );
}
function IconMinus({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export default function NavigationControls({ parts }: NavigationControlsProps) {
  const {
    status,
    currentPartIndex,
    elapsed,
    speed,
    zoom,
    play,
    pause,
    replay,
    skipPart,
    prevPart,
    setSpeed,
    setZoom,
    setElapsed,
  } = useLessonStore();

  const currentPart = parts[currentPartIndex];
  const duration = currentPart?.duration_seconds ?? 1;
  const progress = Math.min((elapsed / duration) * 100, 100);
  const isPlaying = status === "playing";

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    setElapsed(Number(e.target.value));
  }

  return (
    <div className="app-surface rounded-[28px] px-4 py-4 md:px-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Playback</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-[-0.03em] text-slate-900">{currentPart?.title ?? "Current section"}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Section {currentPartIndex + 1} of {parts.length}
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            <span className="font-mono tabular-nums text-slate-700">{fmt(elapsed)}</span>
            <span className="text-slate-300">/</span>
            <span className="font-mono tabular-nums text-slate-700">{fmt(duration)}</span>
            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-10 text-right font-mono text-xs tabular-nums text-slate-500">{fmt(elapsed)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={elapsed}
            onChange={handleSeek}
            className="h-2 flex-1 cursor-pointer accent-slate-900"
          />
          <span className="w-10 font-mono text-xs tabular-nums text-slate-500">{fmt(duration)}</span>
        </div>

        <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={prevPart}
              disabled={currentPartIndex === 0}
              title="Previous section"
              aria-label="Previous section"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconSkipBack />
            </button>

            <button
              onClick={replay}
              title="Replay from start"
              aria-label="Replay from start"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <IconReplay />
            </button>

            <button
              onClick={isPlaying ? pause : play}
              className="inline-flex h-11 min-w-[88px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <IconPause className="w-4 h-4" /> : <IconPlay className="ml-0.5 w-4 h-4" />}
              {isPlaying ? "Pause" : "Play"}
            </button>

            <button
              onClick={skipPart}
              disabled={currentPartIndex >= parts.length - 1}
              title="Next section"
              aria-label="Next section"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconSkipForward />
            </button>
          </div>

          <div className="order-3 flex items-center justify-center gap-1.5 xl:order-none">
            {parts.map((p, i) => (
              <div
                key={p.id}
                title={p.title}
                className={`h-2 rounded-full transition-all ${
                  i === currentPartIndex
                    ? "w-8 bg-slate-900"
                    : i < currentPartIndex
                    ? "w-2 bg-slate-300"
                    : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em]">Speed</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}x
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-[0.18em]">Zoom</span>
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white"
                aria-label="Zoom out"
              >
                <IconMinus />
              </button>
              <span className="w-10 text-center font-mono tabular-nums text-slate-700">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white"
                aria-label="Zoom in"
              >
                <IconPlus />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
