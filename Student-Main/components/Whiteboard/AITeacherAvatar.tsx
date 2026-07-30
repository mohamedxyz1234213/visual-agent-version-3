"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { StoryboardScene } from "@/lib/types";

interface AITeacherAvatarProps {
  scenes: StoryboardScene[];
  elapsed: number;
  viewWidth: number;
  viewHeight: number;
  zoom: number;
  isActive: boolean;
}

interface Point { x: number; y: number }

function findTarget(scenes: StoryboardScene[], elapsed: number): Point | null {
  let best: Point | null = null;
  let bestTime = -1;
  for (const scene of scenes) {
    if (scene.action_type === "clear" || scene.action_type === "camera" || scene.action_type === "draw_caption") continue;
    if (scene.time_offset > elapsed) continue;
    if (scene.time_offset < bestTime) continue;
    const p = scene.payload as Record<string, unknown>;

    if (scene.action_type === "draw_text") {
      const d = p as { position?: [number, number] };
      if (d.position) { best = { x: d.position[0], y: d.position[1] }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_rect") {
      const d = p as { x?: number; y?: number; width?: number; height?: number; label?: string };
      if (d.x != null && d.y != null && d.label) { best = { x: d.x + (d.width ?? 100) / 2, y: d.y + (d.height ?? 50) / 2 }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_circle") {
      const d = p as { center?: [number, number]; label?: string };
      if (d.center && d.label) { best = { x: d.center[0], y: d.center[1] }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_arrow") {
      const d = p as { to?: [number, number] };
      if (d.to) { best = { x: d.to[0], y: d.to[1] }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_callout" || scene.action_type === "draw_badge") {
      const d = p as { position?: [number, number] };
      if (d.position) { best = { x: d.position[0], y: d.position[1] }; bestTime = scene.time_offset; }
    }
  }
  return best;
}

// ─── Right arm SVG paths (extracted from ai-avatar.svg) ───────────────────────
const ARM_PATHS = (
  <g>
    <path fill="#FEFEFD" d="M601.083 404.222C613.059 404.47 625.67 406.217 637.595 407.678C637.647 430.277 634.073 457.54 631.608 480.287C628.641 517.988 590.732 543.054 559.132 556.505C560.308 548.007 559.988 542.475 559.025 533.99C557.277 525.845 555.28 521.175 551.984 513.606C559.112 509.839 565.775 506.232 571.817 500.764C598.043 477.033 599.063 436.993 601.083 404.222Z"/>
    <path fill="#D5D4D4" d="M631.608 480.287C628.641 517.988 590.732 543.054 559.132 556.505C560.308 548.007 559.988 542.475 559.025 533.99C580.131 523.809 596.05 518.105 613.258 500.356C619.502 493.915 625.223 486.301 631.608 480.287Z"/>
    <path fill="#D5D4D4" d="M639.399 309.329C645.349 311.182 653.299 314.149 658.349 317.618C661.372 339.904 660.594 370.453 659.718 392.961C659.214 409.397 658.398 425.822 657.271 442.227C649.688 444.145 645.193 446.125 637.887 443.065C641.059 398.556 641.564 353.898 639.399 309.329Z"/>
    <path fill="#93EDEC" d="M661.654 323.718C664.449 325.137 667.185 328.974 669.003 331.429C671.784 359.712 671.878 454.63 660.633 478.104C659.343 479.303 656.677 481.163 655.177 482.281C659.269 450.185 661.64 417.894 662.28 385.545C662.582 364.604 661.513 344.384 661.654 323.718Z"/>
    <path fill="#8D8C8C" d="M637.887 443.065C645.193 446.125 649.688 444.145 657.271 442.227C656.221 453.482 654.809 476.82 651.384 486.547C645.602 490.213 638.833 492.055 632.094 493.094C634.226 477.17 635.465 458.241 637.887 443.065Z"/>
    <path fill="#D5D4D4" d="M670.802 428.785C671.666 401.748 673.135 374.856 672.815 347.781C672.798 346.338 673.175 345.005 674.106 343.904C684.643 345.845 680.662 418.008 679.583 429.346C676.47 430.901 673.983 434.122 671.718 434.369C670.511 432.486 670.898 431.323 670.802 428.785Z"/>
    <path fill="#9C9B9B" d="M670.802 428.785C670.898 431.323 670.511 432.486 671.718 434.369C673.983 434.122 676.47 430.901 679.583 429.346C678.217 440.217 677.024 449.449 673.149 459.705C671.366 461.125 668.867 462.778 666.954 464.124C668.863 451.221 669.383 441.099 670.802 428.785Z"/>
    <path fill="#8D8C8C" d="M646.753 250.952C648.972 251.306 648.54 250.919 650.062 252.167C652.473 256.887 652.048 276.722 652.171 283.385C650.614 283.382 649.924 283.552 648.674 282.644C645.7 277.824 646.696 257.592 646.753 250.952Z"/>
    <path fill="#8D8C8C" d="M647.543 294.056C656.816 294.727 654.471 305.525 654.214 312.529L648.126 309.504C647.656 303.907 647.55 299.679 647.543 294.056Z"/>
    <path fill="#9C9B9B" d="M644.26 285.805C651.096 285.376 654.56 284.136 655.179 291.977C648.101 291.938 646.246 292.807 644.26 285.805Z"/>
  </g>
);

// Shoulder pivot in SVG viewBox coords (848x1264)
const SHOULDER_X = 580;
const SHOULDER_Y = 320;
// Default hand position in viewBox coords (arm at rest)
const HAND_X = 595;
const HAND_Y = 480;
// Default arm angle (shoulder → hand at rest)
const DEFAULT_ARM_ANGLE = Math.atan2(HAND_Y - SHOULDER_Y, HAND_X - SHOULDER_X);

export default function AITeacherAvatar({ scenes, elapsed, viewWidth, viewHeight, zoom, isActive }: AITeacherAvatarProps) {
  const pixW = viewWidth * zoom;
  const pixH = viewHeight * zoom;

  const target = useMemo(() => findTarget(scenes, elapsed), [scenes, elapsed]);
  const targetRef = useRef(target);
  targetRef.current = target;

  const avatarW = Math.round(pixW * 0.16);
  const avatarH = Math.round(avatarW * (1264 / 848));
  const scale = avatarW / 848;

  const pos = useMemo<Point>(() => ({ x: pixW - avatarW - 24, y: pixH - avatarH - 24 }), [pixW, pixH, avatarW, avatarH]);

  const rafRef = useRef<number | null>(null);
  const mouthPhaseRef = useRef(0);
  const desiredAngleRef = useRef(0);

  const [visible, setVisible] = useState(false);
  const [armAngle, setArmAngle] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);

  useEffect(() => {
    if (!isActive) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, [isActive]);

  const tick = useCallback(() => {
    const tgt = targetRef.current;
    if (tgt) {
      const shoulderPxX = pos.x + SHOULDER_X * scale;
      const shoulderPxY = pos.y + SHOULDER_Y * scale;
      const targetAngle = Math.atan2(tgt.y * zoom - shoulderPxY, tgt.x * zoom - shoulderPxX);
      desiredAngleRef.current += (targetAngle - DEFAULT_ARM_ANGLE - desiredAngleRef.current) * 0.08;
    } else {
      desiredAngleRef.current += (0 - desiredAngleRef.current) * 0.08;
    }
    setArmAngle(desiredAngleRef.current);

    mouthPhaseRef.current += 0.12;
    const t = mouthPhaseRef.current;
    const primary = Math.sin(t * 1.7);
    const flutter = Math.sin(t * 4.3 + 1.1);
    const jitter = Math.sin(t * 11.0 + 3.7);
    let openRaw = primary * 0.55 + flutter * 0.3 + jitter * 0.15;
    openRaw = openRaw * 0.5 + 0.5;
    const phraseEnvelope = Math.sin(t * 0.35) * 0.5 + 0.5;
    const pauseGate = phraseEnvelope > 0.12 ? 1 : phraseEnvelope / 0.12;
    setMouthOpen(Math.max(0, Math.min(1, openRaw * pauseGate)));

    rafRef.current = requestAnimationFrame(tick);
  }, [pos, scale, zoom]);

  useEffect(() => {
    if (isActive && visible) rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive, visible, tick]);

  if (!isActive || !visible) return null;

  const headCX = pos.x + avatarW * (419 / 848);
  const headCY = pos.y + avatarH * (255 / 1264);
  const angleDeg = (armAngle * 180) / Math.PI;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none" style={{ width: pixW, height: pixH, overflow: "visible" }}>
      <div className="absolute" style={{ zIndex: 2, left: pos.x, top: pos.y, width: avatarW, height: avatarH, filter: "drop-shadow(0 5px 18px rgba(15,23,42,0.14))" }}>
        <img src="/ai-avatar-body.svg" alt="AI Teacher" width={avatarW} height={avatarH} className="block select-none" style={{ width: avatarW, height: avatarH }} draggable={false} />

        <svg
          width={avatarW}
          height={avatarH}
          viewBox="0 0 848 1264"
          className="absolute inset-0"
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <g transform={`rotate(${angleDeg}, ${SHOULDER_X}, ${SHOULDER_Y})`} style={{ transition: "transform 0.08s ease-out" }}>
            {ARM_PATHS}
          </g>
        </svg>

        <div className="absolute rounded-full" style={{
          left: headCX - pos.x - 1, top: headCY - pos.y + avatarH * (22 / 1264) - 1,
          width: Math.max(3, 2 + mouthOpen * 6),
          height: Math.max(2, 1 + mouthOpen * 5),
          borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
          background: mouthOpen > 0.3 ? "#1a1a1a" : "#333",
          opacity: 0.92,
          transition: "all 0.05s linear",
          transform: `scaleY(${1 + mouthOpen * 0.6})`,
        }} />
      </div>
    </div>
  );
}
