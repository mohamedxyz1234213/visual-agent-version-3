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
  const idPrefix = "teacher-avatar";
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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes avatar-float { 0%,100%{transform:translate3d(0,0,0) rotate(0deg)} 50%{transform:translate3d(0,-4px,0) rotate(-.35deg)} }
        @keyframes avatar-shadow { 0%,100%{transform:scaleX(1);opacity:.18} 50%{transform:scaleX(.88);opacity:.11} }
        @keyframes avatar-torso { 0%,100%{transform:rotate(-.5deg) scaleX(1)} 50%{transform:rotate(.7deg) scaleX(.992)} }
        @keyframes avatar-head { 0%,100%{transform:translate(0,0) rotate(-1deg)} 35%{transform:translate(1px,-1px) rotate(1.2deg)} 70%{transform:translate(-1px,0) rotate(.2deg)} }
        @keyframes avatar-blink { 0%,44%,47%,78%,81%,100%{transform:scaleY(1)} 45.5%,79.5%{transform:scaleY(.08)} }
        @keyframes avatar-jaw-talk { 0%,7%,100%{transform:translateY(0) scaleY(.2) scaleX(1.08)} 13%{transform:translateY(2px) scaleY(.72) scaleX(.96)} 20%{transform:translateY(3px) scaleY(1.02) scaleX(.88)} 28%{transform:translateY(1px) scaleY(.38) scaleX(1.1)} 34%{transform:translateY(2px) scaleY(.64) scaleX(1)} 41%{transform:translateY(.5px) scaleY(.28) scaleX(1.12)} 50%{transform:translateY(4px) scaleY(1.12) scaleX(.86)} 59%{transform:translateY(2px) scaleY(.55) scaleX(1.02)} 67%{transform:translateY(3px) scaleY(.88) scaleX(.92)} 76%{transform:translateY(.5px) scaleY(.3) scaleX(1.1)} 84%{transform:translateY(2px) scaleY(.74) scaleX(.97)} 92%{transform:translateY(1px) scaleY(.42) scaleX(1.05)} }
        @keyframes avatar-lip-talk { 0%,7%,41%,76%,100%{transform:translateY(0) scaleX(1)} 20%{transform:translateY(-1px) scaleX(.84)} 28%{transform:translateY(1px) scaleX(1.08)} 50%{transform:translateY(-2px) scaleX(.8)} 67%{transform:translateY(-1px) scaleX(.88)} 84%{transform:translateY(-1px) scaleX(.9)} }
        @keyframes avatar-mouth-corners { 0%,7%,41%,76%,100%{transform:scaleX(1) translateY(0)} 20%,50%{transform:scaleX(.9) translateY(1px)} 28%,67%{transform:scaleX(1.08) translateY(-.5px)} }
        @keyframes avatar-upper-left { 0%,10%,100%{transform:rotate(-10deg)} 25%{transform:rotate(18deg)} 38%{transform:rotate(24deg)} 49%{transform:rotate(17deg)} 66%{transform:rotate(-24deg)} 78%{transform:rotate(-27deg)} 91%{transform:rotate(-8deg)} }
        @keyframes avatar-upper-right { 0%,14%,100%{transform:rotate(10deg)} 31%{transform:rotate(-23deg)} 45%{transform:rotate(-27deg)} 58%{transform:rotate(-18deg)} 74%{transform:rotate(24deg)} 86%{transform:rotate(27deg)} 95%{transform:rotate(11deg)} }
        @keyframes avatar-elbow-left { 0%,12%,100%{transform:rotate(20deg)} 28%,44%{transform:rotate(34deg)} 53%{transform:rotate(29deg)} 69%,81%{transform:rotate(24deg)} 93%{transform:rotate(21deg)} }
        @keyframes avatar-elbow-right { 0%,16%,100%{transform:rotate(-20deg)} 34%,49%{transform:rotate(-34deg)} 61%{transform:rotate(-29deg)} 77%,89%{transform:rotate(-24deg)} 96%{transform:rotate(-21deg)} }
        @keyframes avatar-wrist-left { 0%,15%,100%{transform:rotate(-4deg)} 32%{transform:rotate(11deg)} 43%{transform:rotate(15deg)} 57%{transform:rotate(4deg)} 72%{transform:rotate(-12deg)} 84%{transform:rotate(-8deg)} }
        @keyframes avatar-wrist-right { 0%,18%,100%{transform:rotate(3deg)} 36%{transform:rotate(-13deg)} 49%{transform:rotate(-16deg)} 63%{transform:rotate(-4deg)} 79%{transform:rotate(12deg)} 90%{transform:rotate(8deg)} }
        @keyframes avatar-fingers-left { 0%,20%,100%{transform:rotate(0deg) scaleY(1)} 38%,48%{transform:rotate(3deg) scaleY(.94)} 72%,82%{transform:rotate(-2deg) scaleY(1.03)} }
        @keyframes avatar-fingers-right { 0%,24%,100%{transform:rotate(0deg) scaleY(1)} 42%,53%{transform:rotate(-4deg) scaleY(.94)} 76%,87%{transform:rotate(2deg) scaleY(1.03)} }
        @keyframes avatar-joint-glow { 0%,100%{opacity:.45} 50%{opacity:.86} }
        .avatar-rig { animation:avatar-float 5.2s cubic-bezier(.4,0,.2,1) infinite; transform-origin:50% 100%; filter:drop-shadow(0 14px 15px rgba(15,23,42,.18)); shape-rendering:geometricPrecision; }
        .avatar-ground-shadow { animation:avatar-shadow 5.2s cubic-bezier(.4,0,.2,1) infinite; transform-box:fill-box; transform-origin:center; }
        .avatar-torso { animation:avatar-torso 5.2s cubic-bezier(.4,0,.2,1) infinite; transform-box:view-box; transform-origin:124px 318px; }
        .avatar-head { animation:avatar-head 4.8s cubic-bezier(.4,0,.2,1) infinite; transform-box:view-box; transform-origin:124px 205px; will-change:transform; }
        .avatar-eye { animation:avatar-blink 6.8s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
        .avatar-jaw,.avatar-upper-lip,.avatar-mouth-corners { transform-box:fill-box; transform-origin:center top; will-change:transform; }
        .avatar-jaw { transform:scaleY(.24) scaleX(1.08); }
        [data-speaking="true"] .avatar-jaw { animation:avatar-jaw-talk 1.18s cubic-bezier(.4,0,.2,1) infinite; }
        [data-speaking="true"] .avatar-upper-lip { animation:avatar-lip-talk 1.18s cubic-bezier(.4,0,.2,1) infinite; }
        [data-speaking="true"] .avatar-mouth-corners { animation:avatar-mouth-corners 1.18s cubic-bezier(.4,0,.2,1) infinite; }
        .avatar-upper-arm,.avatar-forearm,.avatar-hand,.avatar-fingers { transform-box:view-box; will-change:transform; }
        .avatar-upper-left { transform-origin:70px 224px; animation:avatar-upper-left 5.4s cubic-bezier(.4,0,.2,1) infinite; }
        .avatar-upper-right { transform-origin:178px 224px; animation:avatar-upper-right 5.9s cubic-bezier(.4,0,.2,1) -.8s infinite; }
        .avatar-forearm-left { transform-origin:39px 255px; animation:avatar-elbow-left 5.4s cubic-bezier(.4,0,.2,1) -.16s infinite; }
        .avatar-forearm-right { transform-origin:209px 255px; animation:avatar-elbow-right 5.9s cubic-bezier(.4,0,.2,1) -.98s infinite; }
        .avatar-hand-left { transform-origin:31px 297px; animation:avatar-wrist-left 5.4s cubic-bezier(.4,0,.2,1) -.3s infinite; }
        .avatar-hand-right { transform-origin:217px 297px; animation:avatar-wrist-right 5.9s cubic-bezier(.4,0,.2,1) -1.12s infinite; }
        .avatar-fingers-left { transform-origin:27px 318px; animation:avatar-fingers-left 5.4s ease-in-out -.38s infinite; }
        .avatar-fingers-right { transform-origin:221px 318px; animation:avatar-fingers-right 5.9s ease-in-out -1.2s infinite; }
        [data-speaking="true"] .avatar-upper-left { animation-duration:4.45s; }
        [data-speaking="true"] .avatar-upper-right { animation-duration:4.8s; }
        [data-speaking="true"] .avatar-forearm-left { animation-duration:4.45s; }
        [data-speaking="true"] .avatar-forearm-right { animation-duration:4.8s; }
        [data-gesture="1"] .avatar-upper-left { animation-direction:reverse; }
        [data-gesture="2"] .avatar-upper-right { animation-direction:reverse; }
        .avatar-joint-light { animation:avatar-joint-glow 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion:reduce) { .avatar-rig,.avatar-ground-shadow,.avatar-torso,.avatar-head,.avatar-eye,.avatar-jaw,.avatar-upper-lip,.avatar-mouth-corners,.avatar-upper-arm,.avatar-forearm,.avatar-hand,.avatar-fingers,.avatar-joint-light { animation:none!important; } }
      ` }} />
      <svg className="avatar-rig h-full w-full overflow-visible" viewBox="0 0 240 340" role="presentation">
        <defs>
          <linearGradient id={`${idPrefix}-shell`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff"/><stop offset=".48" stopColor="#e2e8f0"/><stop offset="1" stopColor="#94a3b8"/></linearGradient>
          <linearGradient id={`${idPrefix}-shell-edge`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f8fafc"/><stop offset=".55" stopColor="#cbd5e1"/><stop offset="1" stopColor="#64748b"/></linearGradient>
          <linearGradient id={`${idPrefix}-suit`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8"/><stop offset=".42" stopColor="#2563eb"/><stop offset="1" stopColor="#312e81"/></linearGradient>
          <linearGradient id={`${idPrefix}-arm`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60a5fa"/><stop offset=".55" stopColor="#2563eb"/><stop offset="1" stopColor="#1e3a8a"/></linearGradient>
          <radialGradient id={`${idPrefix}-face`} cx="38%" cy="24%" r="84%"><stop stopColor="#475569"/><stop offset=".5" stopColor="#1e293b"/><stop offset="1" stopColor="#020617"/></radialGradient>
          <radialGradient id={`${idPrefix}-joint`} cx="35%" cy="30%" r="70%"><stop stopColor="#ecfeff"/><stop offset=".35" stopColor="#67e8f9"/><stop offset="1" stopColor="#0891b2"/></radialGradient>
          <filter id={`${idPrefix}-inner-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <ellipse className="avatar-ground-shadow" cx="124" cy="329" rx="70" ry="9" fill="#1e3a8a" opacity=".18" />

        <g className="avatar-upper-arm avatar-upper-left">
          <path d="M70 217C57 217 42 226 31 238l13 17c11-8 22-14 32-15Z" fill={`url(#${idPrefix}-shell)`} stroke="#172554" strokeWidth="5" strokeLinejoin="round" />
          <circle cx="70" cy="224" r="13" fill={`url(#${idPrefix}-joint)`} stroke="#172554" strokeWidth="5" />
          <circle className="avatar-joint-light" cx="66" cy="220" r="3.5" fill="#ecfeff" />
          <g className="avatar-forearm avatar-forearm-left">
            <circle cx="39" cy="255" r="10" fill="#0f172a" stroke="#172554" strokeWidth="4" />
            <path d="M39 245c-9 0-16 6-18 14l8 7c1-6 5-10 11-11Z" fill={`url(#${idPrefix}-joint)`} stroke="#172554" strokeWidth="3" strokeLinejoin="round" />
            <circle className="avatar-joint-light" cx="27" cy="256" r="3" fill="#ecfeff" />
            <path d="M33 257c-6 13-10 27-11 42l20 4c4-14 8-27 9-40Z" fill={`url(#${idPrefix}-arm)`} stroke="#172554" strokeWidth="4" strokeLinejoin="round" />
            <path d="m30 269 17 5m-20 7 17 5m-20 7 17 5" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <g className="avatar-hand avatar-hand-left">
              <rect x="20" y="291" width="22" height="14" rx="7" fill={`url(#${idPrefix}-joint)`} stroke="#334155" strokeWidth="3" />
              <path d="m12 302 9-5h14l9 7-4 17-9 5H17l-9-7Z" fill={`url(#${idPrefix}-shell)`} stroke="#334155" strokeWidth="3.5" strokeLinejoin="round" />
              <circle cx="26" cy="311" r="5" fill={`url(#${idPrefix}-joint)`} stroke="#334155" strokeWidth="2.5" />
              <g className="avatar-fingers avatar-fingers-left" fill={`url(#${idPrefix}-shell-edge)`} stroke="#334155" strokeWidth="3" strokeLinejoin="round">
                <path d="m15 316-10 8 2 11h7l-1-7 7-6Z" />
                <path d="m37 317 8 8-3 10h-7l2-7-6-6Z" />
                <path d="m23 323 3 13 5-13Z" />
              </g>
            </g>
          </g>
        </g>

        <g className="avatar-upper-arm avatar-upper-right">
          <path d="M178 217c13 0 28 9 39 21l-13 17c-11-8-22-14-32-15Z" fill={`url(#${idPrefix}-shell)`} stroke="#172554" strokeWidth="5" strokeLinejoin="round" />
          <circle cx="178" cy="224" r="13" fill={`url(#${idPrefix}-joint)`} stroke="#172554" strokeWidth="5" />
          <circle className="avatar-joint-light" cx="174" cy="220" r="3.5" fill="#ecfeff" />
          <g className="avatar-forearm avatar-forearm-right">
            <circle cx="209" cy="255" r="10" fill="#0f172a" stroke="#172554" strokeWidth="4" />
            <path d="M209 245c9 0 16 6 18 14l-8 7c-1-6-5-10-11-11Z" fill={`url(#${idPrefix}-joint)`} stroke="#172554" strokeWidth="3" strokeLinejoin="round" />
            <circle className="avatar-joint-light" cx="221" cy="256" r="3" fill="#ecfeff" />
            <path d="M215 257c6 13 10 27 11 42l-20 4c-4-14-8-27-9-40Z" fill={`url(#${idPrefix}-arm)`} stroke="#172554" strokeWidth="4" strokeLinejoin="round" />
            <path d="m218 269-17 5m20 7-17 5m20 7-17 5" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <g className="avatar-hand avatar-hand-right">
              <rect x="206" y="291" width="22" height="14" rx="7" fill={`url(#${idPrefix}-joint)`} stroke="#334155" strokeWidth="3" />
              <path d="m236 302-9-5h-14l-9 7 4 17 9 5h14l9-7Z" fill={`url(#${idPrefix}-shell)`} stroke="#334155" strokeWidth="3.5" strokeLinejoin="round" />
              <circle cx="222" cy="311" r="5" fill={`url(#${idPrefix}-joint)`} stroke="#334155" strokeWidth="2.5" />
              <g className="avatar-fingers avatar-fingers-right" fill={`url(#${idPrefix}-shell-edge)`} stroke="#334155" strokeWidth="3" strokeLinejoin="round">
                <path d="m233 316 10 8-2 11h-7l1-7-7-6Z" />
                <path d="m211 317-8 8 3 10h7l-2-7 6-6Z" />
                <path d="m225 323-3 13-5-13Z" />
              </g>
            </g>
          </g>
        </g>

        <g className="avatar-torso">
          <path d="M105 205h38l7 24h-52Z" fill="#09090b" stroke="#0f172a" strokeWidth="4" />
          <path d="M101 211h46M99 218h50M98 225h52" stroke="#475569" strokeWidth="3" />
          <path d="M81 215c12-8 25-11 43-11s31 3 43 11l13 16v53c0 14-8 22-19 22h-15l-9-18h-26l-9 18H87c-11 0-19-8-19-22v-53Z" fill={`url(#${idPrefix}-shell)`} stroke="#0f172a" strokeWidth="6" strokeLinejoin="round" />
          <path d="M81 220c12 17 74 17 86 0" fill="none" stroke="#94a3b8" strokeWidth="4" />
          <path d="M68 239c10-7 18-8 25-7l-5 58c-8 3-14 1-20-6Zm112 0c-10-7-18-8-25-7l5 58c8 3 14 1 20-6Z" fill={`url(#${idPrefix}-suit)`} opacity=".9" />
          <path d="M108 289h32l11 32H97Z" fill="#09090b" stroke="#0f172a" strokeWidth="5" />
          <path d="M105 297h38m-36 7h34m-31 7h28" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <circle cx="124" cy="256" r="9" fill={`url(#${idPrefix}-joint)`} stroke="#0f172a" strokeWidth="3" filter={`url(#${idPrefix}-inner-glow)`} />
        </g>

        <g className="avatar-head">
          <rect x="20" y="48" width="208" height="166" rx="70" fill={`url(#${idPrefix}-shell)`} stroke="#0f172a" strokeWidth="7" />
          <path d="M45 73c25-27 127-34 159 5" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" opacity=".72" />
          <path d="M72 52 66 84m104-32 7 32" stroke="#64748b" strokeWidth="3" />
          <rect x="36" y="72" width="176" height="119" rx="48" fill={`url(#${idPrefix}-face)`} stroke="#64748b" strokeWidth="6" />
          <path d="M50 91c25-16 108-20 146-2" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity=".36" />
          <path d="M48 64Q124 22 200 64" fill="none" stroke="#67e8f9" strokeWidth="7" strokeLinecap="round" opacity=".82" />
          <circle cx="124" cy="25" r="10" fill={`url(#${idPrefix}-joint)`} stroke="#0f172a" strokeWidth="5" />
          <path d="M124 48V25" stroke="#0f172a" strokeWidth="6" />
          <g className="avatar-eye">
            <ellipse cx="93" cy="118" rx="17" ry="22" fill="#22d3ee" filter={`url(#${idPrefix}-inner-glow)`} />
            <ellipse cx="155" cy="118" rx="17" ry="22" fill="#22d3ee" filter={`url(#${idPrefix}-inner-glow)`} />
            <ellipse cx="98" cy="111" rx="5" ry="7" fill="#ecfeff" />
            <ellipse cx="160" cy="111" rx="5" ry="7" fill="#ecfeff" />
          </g>
          <g className="avatar-jaw">
            <path d="M96 153Q124 174 152 153Q149 193 124 197Q99 193 96 153Z" fill="#083344" stroke="#22d3ee" strokeWidth="4" />
            <ellipse cx="124" cy="181" rx="15" ry="7" fill="#f472b6" opacity=".85" />
            <path d="M108 187q16 8 32 0" fill="none" stroke="#f9a8d4" strokeWidth="3" strokeLinecap="round" opacity=".85" />
          </g>
          <g className="avatar-upper-lip">
            <path d="M101 154Q124 166 147 154" fill="none" stroke="#ecfeff" strokeWidth="5" strokeLinecap="round" />
          </g>
          <g className="avatar-mouth-corners" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round">
            <path d="m101 154-5-3" /><path d="m147 154 5-3" />
          </g>
          <path d="M20 111c-12 4-14 51 0 59" fill={`url(#${idPrefix}-shell-edge)`} stroke="#0f172a" strokeWidth="5" />
          <path d="M228 111c12 4 14 51 0 59" fill={`url(#${idPrefix}-shell-edge)`} stroke="#0f172a" strokeWidth="5" />
          <circle cx="21" cy="139" r="10" fill={`url(#${idPrefix}-joint)`} stroke="#0f172a" strokeWidth="5" />
          <circle cx="227" cy="139" r="10" fill={`url(#${idPrefix}-joint)`} stroke="#0f172a" strokeWidth="5" />
        </g>
      </svg>
    </div>
  );
}