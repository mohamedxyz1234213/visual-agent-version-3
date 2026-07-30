"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback, useId } from "react";
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

const LERP = 0.038;

// Flip to -1 if the elbow visually bends the wrong way for your art (it's a
// stylistic choice with no "correct" answer until you can see it rendered).
const ARM_BEND_DIR = 1;

function findTarget(scenes: StoryboardScene[], elapsed: number, zoom: number): Point | null {
  let best: Point | null = null;
  let bestTime = -1;
  for (const scene of scenes) {
    if (scene.action_type === "clear" || scene.action_type === "camera" || scene.action_type === "draw_caption") continue;
    if (scene.time_offset > elapsed) continue;
    if (scene.time_offset < bestTime) continue;
    const p = scene.payload as Record<string, unknown>;

    if (scene.action_type === "draw_text") {
      const d = p as { position?: [number, number] };
      if (d.position) { best = { x: d.position[0] * zoom, y: d.position[1] * zoom }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_rect") {
      const d = p as { x?: number; y?: number; width?: number; height?: number; label?: string };
      if (d.x != null && d.y != null && d.label) { best = { x: (d.x + (d.width ?? 100) / 2) * zoom, y: (d.y + (d.height ?? 50) / 2) * zoom }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_circle") {
      const d = p as { center?: [number, number]; label?: string };
      if (d.center && d.label) { best = { x: d.center[0] * zoom, y: d.center[1] * zoom }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_arrow") {
      const d = p as { to?: [number, number] };
      if (d.to) { best = { x: d.to[0] * zoom, y: d.to[1] * zoom }; bestTime = scene.time_offset; }
    } else if (scene.action_type === "draw_callout" || scene.action_type === "draw_badge") {
      const d = p as { position?: [number, number] };
      if (d.position) { best = { x: d.position[0] * zoom, y: d.position[1] * zoom }; bestTime = scene.time_offset; }
    }
  }
  return best;
}

/**
 * Anatomically-consistent two-bone IK (upper arm + forearm), solved with the
 * law of cosines. Unlike a naive "perpendicular offset" elbow, the two bone
 * lengths never stretch or compress — only the elbow angle changes as the
 * hand reaches toward the target. This is what makes the joint read as a
 * real elbow instead of an elastic line.
 */
function solveTwoBoneIK(
  shoulder: Point,
  targetX: number,
  targetY: number,
  upperLen: number,
  foreLen: number,
  bendDir: number
): { elbow: Point; hand: Point } {
  const dx = targetX - shoulder.x;
  const dy = targetY - shoulder.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

  const maxReach = upperLen + foreLen - 0.5;
  const minReach = Math.abs(upperLen - foreLen) + 0.5;
  const clampedDist = Math.max(minReach, Math.min(maxReach, dist));

  const baseAngle = Math.atan2(dy, dx);

  // Angle at the shoulder between the shoulder->hand line and the upper arm.
  const cosShoulder =
    (upperLen * upperLen + clampedDist * clampedDist - foreLen * foreLen) /
    (2 * upperLen * clampedDist);
  const shoulderAngleOffset = Math.acos(Math.max(-1, Math.min(1, cosShoulder)));

  const elbowAngle = baseAngle + shoulderAngleOffset * bendDir;
  const elbow: Point = {
    x: shoulder.x + Math.cos(elbowAngle) * upperLen,
    y: shoulder.y + Math.sin(elbowAngle) * upperLen,
  };

  const hand: Point = {
    x: shoulder.x + Math.cos(baseAngle) * clampedDist,
    y: shoulder.y + Math.sin(baseAngle) * clampedDist,
  };

  return { elbow, hand };
}

export default function AITeacherAvatar({ scenes, elapsed, viewWidth, viewHeight, zoom, isActive }: AITeacherAvatarProps) {
  const uid = useId();
  const gradId = `fg-${uid}`;
  const filtId = `filt-${uid}`;

  const pixW = viewWidth * zoom;
  const pixH = viewHeight * zoom;

  const rawTarget = useMemo(() => findTarget(scenes, elapsed, zoom), [scenes, elapsed, zoom]);
  const rawTargetRef = useRef(rawTarget);
  rawTargetRef.current = rawTarget;

  const avatarW = Math.round(pixW * 0.16);
  const avatarH = Math.round(avatarW * (1264 / 848));

  const shoulderRel = useMemo<Point>(() => ({ x: 580 / 848, y: 320 / 1264 }), []);
  const handRel = useMemo<Point>(() => ({ x: 595 / 848, y: 480 / 1264 }), []);

  const initialPos = useMemo<Point>(() => ({ x: pixW - avatarW - 24, y: pixH - avatarH - 24 }), [pixW, pixH, avatarW, avatarH]);
  const currentPos = useRef<Point>({ ...initialPos });
  const rafRef = useRef<number | null>(null);
  const mouthPhaseRef = useRef(0);
  const armPhaseRef = useRef(0);

  const [pos, setPos] = useState<Point>(initialPos);
  const [targetPx, setTargetPx] = useState<Point | null>(null);
  const [visible, setVisible] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [mouthWidth, setMouthWidth] = useState(0.5);
  const [armSway, setArmSway] = useState(0);

  useEffect(() => {
    if (!isActive) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, [isActive]);

  const desiredPos = useMemo(() => {
    if (!rawTarget) return null;
    const hx = avatarW * handRel.x;
    const hy = avatarH * handRel.y;
    const margin = 12;
    let ax = rawTarget.x - hx + 6;
    let ay = rawTarget.y - hy * 0.4;
    ax = Math.max(margin, Math.min(pixW - avatarW - margin, ax));
    ay = Math.max(8, Math.min(pixH - avatarH - 8, ay));
    return { x: ax, y: ay };
  }, [rawTarget, pixW, pixH, avatarW, avatarH, handRel]);
  const desiredPosRef = useRef(desiredPos);
  desiredPosRef.current = desiredPos;

  const tick = useCallback(() => {
    const dp = desiredPosRef.current;
    if (dp) {
      currentPos.current.x += (dp.x - currentPos.current.x) * LERP;
      currentPos.current.y += (dp.y - currentPos.current.y) * LERP;
    }
    setPos({ x: currentPos.current.x, y: currentPos.current.y });

    setTargetPx(rawTargetRef.current ? { x: rawTargetRef.current.x, y: rawTargetRef.current.y } : null);

    // --- Mouth: layered waveforms instead of one clean sine wave ---
    // A single sine reads as mechanical. Talking is closer to: a slow-ish
    // main open/close rhythm, a faster flutter for consonant-like motion,
    // fine jitter for texture, and occasional brief closures for pauses
    // between words/phrases.
    mouthPhaseRef.current += 0.12;
    const t = mouthPhaseRef.current;

    const primary = Math.sin(t * 1.7);
    const flutter = Math.sin(t * 4.3 + 1.1);
    const jitter = Math.sin(t * 11.0 + 3.7);
    let openRaw = primary * 0.55 + flutter * 0.3 + jitter * 0.15;
    openRaw = openRaw * 0.5 + 0.5; // normalize to 0..1

    // Slow phrase envelope occasionally gates the mouth toward closed,
    // simulating a breath/pause rather than continuous chatter.
    const phraseEnvelope = Math.sin(t * 0.35) * 0.5 + 0.5;
    const pauseGate = phraseEnvelope > 0.12 ? 1 : phraseEnvelope / 0.12;

    setMouthOpen(Math.max(0, Math.min(1, openRaw * pauseGate)));

    // Mouth width drifts on its own slower phase so open/close shapes vary
    // (rounder vs. wider) instead of scaling uniformly every time.
    const widthRaw = Math.sin(t * 2.3 + 2.0) * 0.5 + 0.5;
    setMouthWidth(0.35 + widthRaw * 0.5);

    armPhaseRef.current += 0.03;
    setArmSway(Math.sin(armPhaseRef.current) * 4);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (isActive && visible) rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive, visible, tick]);

  if (!isActive || !visible) return null;

  const shoulderX = pos.x + avatarW * shoulderRel.x;
  const shoulderY = pos.y + avatarH * shoulderRel.y;

  const headCX = pos.x + avatarW * (419 / 848);
  const headCY = pos.y + avatarH * (255 / 1264);

  const upperArmLen = avatarH * 0.135;
  const foreArmLen = avatarH * 0.125;

  let elbowP: Point | null = null;
  let handP: Point | null = null;
  let fingerTip: Point | null = null;
  let fingerAngleDeg = 0;

  if (targetPx) {
    const { elbow, hand } = solveTwoBoneIK(
      { x: shoulderX, y: shoulderY },
      targetPx.x,
      targetPx.y,
      upperArmLen,
      foreArmLen,
      ARM_BEND_DIR
    );
    elbowP = elbow;
    handP = hand;

    // Orient the finger along the true forearm direction (elbow -> hand),
    // not a fixed horizontal line — this is what makes it actually "point".
    const forearmAngle = Math.atan2(hand.y - elbow.y, hand.x - elbow.x);
    fingerAngleDeg = (forearmAngle * 180) / Math.PI;

    // Tiny tremor perpendicular to the pointing direction (a steady hand
    // still micro-shakes) rather than the old flat horizontal shift.
    const wobbleDx = Math.cos(forearmAngle + Math.PI / 2) * armSway * 0.6;
    const wobbleDy = Math.sin(forearmAngle + Math.PI / 2) * armSway * 0.6;
    fingerTip = { x: hand.x + wobbleDx, y: hand.y + wobbleDy };
  }

  return (
    <div className="absolute inset-0 z-30 pointer-events-none" style={{ width: pixW, height: pixH, overflow: "visible" }}>
      {/* Pointing arm + effects */}
      <svg className="absolute inset-0" style={{ width: pixW, height: pixH, overflow: "visible", zIndex: 1 }}>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </radialGradient>
          <filter id={filtId}>
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {targetPx && elbowP && handP && fingerTip && (
          <>
            {/* Target glow */}
            <circle cx={targetPx.x} cy={targetPx.y} r={14} fill={`url(#${gradId})`} className="wb-breathe" style={{ animationDuration: "1.8s" }} />

            {/* Upper arm: shoulder → elbow */}
            <line x1={shoulderX} y1={shoulderY} x2={elbowP.x} y2={elbowP.y}
              stroke="#3b82f6" strokeWidth={5} strokeLinecap="round" opacity={0.7}
              filter={`url(#${filtId})`} />

            {/* Forearm: elbow → hand */}
            <line x1={elbowP.x} y1={elbowP.y} x2={handP.x} y2={handP.y}
              stroke="#3b82f6" strokeWidth={4.5} strokeLinecap="round" opacity={0.7}
              filter={`url(#${filtId})`} />

            {/* Shoulder joint */}
            <circle cx={shoulderX} cy={shoulderY} r={5} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} opacity={0.85} />

            {/* Elbow joint */}
            <circle cx={elbowP.x} cy={elbowP.y} r={4} fill="#ffffff" stroke="#3b82f6" strokeWidth={2} opacity={0.85} />

            {/* Hand/finger pointer — now rotated to the real forearm direction */}
            <g transform={`translate(${fingerTip.x}, ${fingerTip.y}) rotate(${fingerAngleDeg})`}>
              <circle cx={0} cy={0} r={6} fill="#bfdbfe" stroke="#3b82f6" strokeWidth={1.5} opacity={0.9} />
              <line x1={4} y1={0} x2={12} y2={0} stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={14} cy={0} r={1.5} fill="#3b82f6" opacity={0.6} className="wb-breathe" style={{ animationDuration: "1.2s" }} />
            </g>

            {/* Dashed guide from hand to target */}
            <line x1={fingerTip.x + 12} y1={fingerTip.y} x2={targetPx.x} y2={targetPx.y}
              stroke="rgba(96,165,250,0.15)" strokeWidth={1.2} strokeDasharray="4 6" strokeLinecap="round" />
          </>
        )}
      </svg>

      {/* Avatar body */}
      <div className="absolute" style={{ zIndex: 2, left: pos.x, top: pos.y, width: avatarW, height: avatarH, filter: "drop-shadow(0 5px 18px rgba(15,23,42,0.14))" }}>
        <img src="/ai-avatar.svg" alt="AI Teacher" width={avatarW} height={avatarH} className="block select-none" style={{ width: avatarW, height: avatarH }} draggable={false} />

        {/* Mouth animation — layered motion (see tick()) instead of one sine wave */}
        <div className="absolute rounded-full" style={{
          left: headCX - pos.x - 1, top: headCY - pos.y + avatarH * (22 / 1264) - 1,
          width: Math.max(3, 2 + mouthOpen * 4 + mouthWidth * 2),
          height: Math.max(2, 1 + mouthOpen * 4),
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
