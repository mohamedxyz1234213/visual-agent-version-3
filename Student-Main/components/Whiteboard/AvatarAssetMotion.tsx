"use client";

import { useMemo } from "react";
import type { StoryboardScene } from "@/lib/types";

interface AvatarAssetMotionProps {
  scenes: StoryboardScene[];
  elapsed: number;
  viewWidth: number;
  viewHeight: number;
  zoom: number;
  isActive: boolean;
  isSpeaking?: boolean;
}

function currentBeat(scenes: StoryboardScene[], elapsed: number) {
  return scenes
    .filter((scene) => scene.time_offset <= elapsed && scene.action_type === "draw_caption")
    .sort((a, b) => b.time_offset - a.time_offset)[0] ?? null;
}

export default function AvatarAssetMotion({ scenes, elapsed, viewWidth, viewHeight, zoom, isActive, isSpeaking = false }: AvatarAssetMotionProps) {
  const boardWidth = viewWidth * zoom;
  const boardHeight = viewHeight * zoom;
  const avatarWidth = Math.max(92, Math.min(208, Math.round(boardWidth * 0.2)));
  const avatarHeight = Math.round(avatarWidth * 1.42);
  const position = useMemo(
    () => ({ x: Math.max(8, boardWidth - avatarWidth - 12), y: Math.max(8, boardHeight - avatarHeight - 4) }),
    [boardWidth, boardHeight, avatarWidth, avatarHeight],
  );
  const beat = currentBeat(scenes, elapsed);
  const beatIndex = Number((beat?.payload as Record<string, unknown> | undefined)?.sequenceIndex ?? 0);

  if (!isActive) return null;

  return (
    <div
      className="pointer-events-none absolute z-30 overflow-visible"
      style={{ left: position.x, top: position.y, width: avatarWidth, height: avatarHeight }}
      aria-hidden="true"
      data-speaking={isSpeaking ? "true" : "false"}
      data-gesture={beatIndex % 3}
    >
      <style>{`
        @keyframes avatar-float { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-4px) rotate(-.4deg)} }
        @keyframes avatar-blink { 0%,46%,49%,100%{transform:scaleY(1)} 47.5%{transform:scaleY(.08)} }
        @keyframes avatar-talk { 0%,100%{transform:translateY(-1px) scaleY(.28) scaleX(1.04)} 16%{transform:translateY(1px) scaleY(.62) scaleX(.98)} 34%{transform:translateY(2px) scaleY(1.02) scaleX(.9)} 52%{transform:translateY(0) scaleY(.48) scaleX(1.08)} 70%{transform:translateY(3px) scaleY(1.12) scaleX(.88)} 86%{transform:translateY(1px) scaleY(.58) scaleX(1)} }
        @keyframes avatar-upper-left { 0%,100%{transform:rotate(-8deg)} 30%{transform:rotate(12deg)} 62%{transform:rotate(-17deg)} 82%{transform:rotate(5deg)} }
        @keyframes avatar-upper-right { 0%,100%{transform:rotate(7deg)} 42%{transform:rotate(-15deg)} 72%{transform:rotate(-7deg)} }
        @keyframes avatar-elbow-left { 0%,100%{transform:rotate(-8deg)} 48%{transform:rotate(-31deg)} }
        @keyframes avatar-elbow-right { 0%,100%{transform:rotate(7deg)} 52%{transform:rotate(29deg)} }
        @keyframes avatar-wrist-left { 0%,100%{transform:rotate(-7deg)} 35%{transform:rotate(16deg)} 68%{transform:rotate(-13deg)} }
        @keyframes avatar-wrist-right { 0%,100%{transform:rotate(5deg)} 50%{transform:rotate(-15deg)} }
        @keyframes avatar-pulse { 0%,100%{opacity:.42;transform:scale(.92)} 50%{opacity:.8;transform:scale(1.08)} }
        .avatar-rig { animation:avatar-float 5s cubic-bezier(.22,.61,.36,1) infinite; transform-origin:50% 100%; filter:drop-shadow(0 12px 15px rgba(15,23,42,.2)); }
        .avatar-eye { animation:avatar-blink 6.4s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
        .avatar-mouth { transform-box:fill-box; transform-origin:center; transform:translateY(-1px) scaleY(.28) scaleX(1.04); will-change:transform; }
        [data-speaking="true"] .avatar-mouth { animation:avatar-talk .58s linear infinite; }
        .avatar-upper-arm,.avatar-forearm,.avatar-hand { transform-box:view-box; will-change:transform; }
        .avatar-upper-left { transform-origin:67px 231px; animation:avatar-upper-left 3.5s cubic-bezier(.45,.05,.25,1) infinite; }
        .avatar-upper-right { transform-origin:181px 231px; animation:avatar-upper-right 3.2s cubic-bezier(.45,.05,.25,1) infinite; }
        .avatar-forearm-left { transform-origin:35px 251px; animation:avatar-elbow-left 2.9s cubic-bezier(.4,0,.2,1) infinite; }
        .avatar-forearm-right { transform-origin:213px 251px; animation:avatar-elbow-right 3.05s cubic-bezier(.4,0,.2,1) infinite; }
        .avatar-hand-left { transform-origin:24px 301px; animation:avatar-wrist-left 2.15s ease-in-out infinite; }
        .avatar-hand-right { transform-origin:225px 301px; animation:avatar-wrist-right 2.35s ease-in-out infinite; }
        [data-speaking="true"] .avatar-upper-left,[data-speaking="true"] .avatar-upper-right { animation-duration:2.25s; }
        [data-gesture="1"] .avatar-upper-left { animation-direction:reverse; }
        [data-gesture="2"] .avatar-upper-right { animation-direction:reverse; animation-duration:1.95s; }
        .avatar-joint { animation:avatar-pulse 2.2s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
        @media (prefers-reduced-motion:reduce) { .avatar-rig,.avatar-eye,.avatar-mouth,.avatar-upper-arm,.avatar-forearm,.avatar-hand,.avatar-joint { animation:none!important; } }
      `}</style>
      <svg className="avatar-rig h-full w-full overflow-visible" viewBox="0 0 240 340" role="presentation">
        <defs>
          <linearGradient id="avatar-shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#cbd5e1"/></linearGradient>
          <linearGradient id="avatar-suit" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#2563eb"/><stop offset="1" stopColor="#4338ca"/></linearGradient>
          <radialGradient id="avatar-face" cx="42%" cy="28%" r="78%"><stop stopColor="#334155"/><stop offset="1" stopColor="#0f172a"/></radialGradient>
        </defs>
        <ellipse cx="124" cy="326" rx="70" ry="10" fill="#2563eb" opacity=".16" />

        <g className="avatar-upper-arm avatar-upper-left">
          <circle className="avatar-joint" cx="67" cy="231" r="12" fill="#67e8f9" stroke="#0f172a" strokeWidth="5" />
          <rect x="32" y="226" width="48" height="22" rx="11" fill="url(#avatar-suit)" transform="rotate(-18 68 237)" />
          <g className="avatar-forearm avatar-forearm-left">
            <circle className="avatar-joint" cx="35" cy="251" r="9" fill="#a5f3fc" stroke="#0f172a" strokeWidth="4" />
            <rect x="18" y="247" width="22" height="55" rx="11" fill="#3b82f6" transform="rotate(22 29 253)" />
            <g className="avatar-hand avatar-hand-left">
              <rect x="8" y="292" width="31" height="22" rx="11" fill="url(#avatar-shell)" stroke="#334155" strokeWidth="3" />
              <path d="M12 298 2 286M19 295 13 279M27 295 27 278" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            </g>
          </g>
        </g>

        <g className="avatar-upper-arm avatar-upper-right">
          <circle className="avatar-joint" cx="181" cy="231" r="12" fill="#67e8f9" stroke="#0f172a" strokeWidth="5" />
          <rect x="176" y="225" width="48" height="22" rx="11" fill="url(#avatar-suit)" transform="rotate(18 181 237)" />
          <g className="avatar-forearm avatar-forearm-right">
            <circle className="avatar-joint" cx="213" cy="251" r="9" fill="#a5f3fc" stroke="#0f172a" strokeWidth="4" />
            <rect x="208" y="246" width="22" height="55" rx="11" fill="#3b82f6" transform="rotate(-25 219 253)" />
            <g className="avatar-hand avatar-hand-right">
              <rect x="210" y="292" width="31" height="22" rx="11" fill="url(#avatar-shell)" stroke="#334155" strokeWidth="3" />
              <path d="M235 300 252 288" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
              <circle cx="252" cy="288" r="4" fill="#67e8f9" />
            </g>
          </g>
        </g>

        <path d="M72 216Q124 187 176 216l13 104H59Z" fill="url(#avatar-suit)" stroke="#0f172a" strokeWidth="6" />
        <path d="m105 220 19 24 19-24 10 100H95Z" fill="#f8fafc" opacity=".95" />
        <circle cx="124" cy="275" r="7" fill="#67e8f9" stroke="#0f172a" strokeWidth="3" />

        <rect x="42" y="37" width="164" height="185" rx="72" fill="url(#avatar-shell)" stroke="#0f172a" strokeWidth="7" />
        <rect x="57" y="65" width="134" height="125" rx="49" fill="url(#avatar-face)" stroke="#64748b" strokeWidth="6" />
        <path d="M72 54Q124 18 176 54" fill="none" stroke="#67e8f9" strokeWidth="8" strokeLinecap="round" opacity=".8" />
        <circle cx="124" cy="25" r="10" fill="#67e8f9" stroke="#0f172a" strokeWidth="5" />
        <path d="M124 37V25" stroke="#0f172a" strokeWidth="6" />
        <g className="avatar-eye">
          <ellipse cx="93" cy="118" rx="17" ry="22" fill="#67e8f9" />
          <ellipse cx="155" cy="118" rx="17" ry="22" fill="#67e8f9" />
          <circle cx="98" cy="111" r="5" fill="#ecfeff" />
          <circle cx="160" cy="111" r="5" fill="#ecfeff" />
        </g>
        <g className="avatar-mouth">
          <path d="M95 151Q124 180 153 151Q148 194 124 197Q100 194 95 151Z" fill="#67e8f9" stroke="#164e63" strokeWidth="4" />
          <path d="M106 160Q124 170 142 160" fill="none" stroke="#ecfeff" strokeWidth="5" strokeLinecap="round" />
        </g>
        <circle cx="51" cy="131" r="10" fill="#22d3ee" stroke="#0f172a" strokeWidth="5" />
        <circle cx="197" cy="131" r="10" fill="#22d3ee" stroke="#0f172a" strokeWidth="5" />
      </svg>
    </div>
  );
}