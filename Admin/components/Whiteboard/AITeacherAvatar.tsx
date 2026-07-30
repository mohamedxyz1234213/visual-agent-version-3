"use client";

import React, { useMemo } from "react";
import type { StoryboardScene } from "@/lib/types";

interface AITeacherAvatarProps {
  scenes: StoryboardScene[];
  elapsed: number;
  viewWidth: number;
  viewHeight: number;
  zoom: number;
  isActive: boolean;
}

export default function AITeacherAvatar({ viewWidth, viewHeight, zoom, isActive }: AITeacherAvatarProps) {
  const pixW = viewWidth * zoom;
  const pixH = viewHeight * zoom;
  const avatarW = Math.round(pixW * 0.16);
  const avatarH = avatarW;
  const pos = useMemo(() => ({ x: pixW - avatarW - 24, y: pixH - avatarH - 24 }), [pixW, pixH, avatarW, avatarH]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none" style={{ width: pixW, height: pixH, overflow: "visible" }}>
      <div className="absolute" style={{ zIndex: 2, left: pos.x, top: pos.y, width: avatarW, height: avatarH, filter: "drop-shadow(0 5px 18px rgba(15,23,42,0.14))" }}>
        <img src="/ai-avatar-full.svg" alt="AI Teacher" width={avatarW} height={avatarH} className="block select-none" style={{ width: avatarW, height: avatarH }} draggable={false} />
      </div>
    </div>
  );
}
