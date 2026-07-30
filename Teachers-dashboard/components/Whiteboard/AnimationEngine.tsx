"use client";
/**
 * AnimationEngine — drives the elapsed timer that the Whiteboard uses
 * to decide which scenes to show.
 *
 * Also manages audio playback. When a caption scene has its own audioUrl
 * in the payload, that short clip is played so the voice reads exactly
 * what appears under the board. Falls back to the full part audio_url.
 */

import { useEffect, useRef } from "react";
import { useLessonStore } from "@/store/lessonStore";
import type { LessonPart, StoryboardScene } from "@/lib/types";

interface AnimationEngineProps {
  part: LessonPart;
  onPartComplete: () => void;
}

function getActiveCaption(scenes: StoryboardScene[], elapsed: number, lastClear: number): StoryboardScene | null {
  let latest: StoryboardScene | null = null;
  for (const s of scenes) {
    if (s.action_type !== "draw_caption") continue;
    if (s.time_offset > elapsed || s.time_offset <= lastClear) continue;
    if (!latest || s.time_offset > latest.time_offset) latest = s;
  }
  return latest;
}

export default function AnimationEngine({ part, onPartComplete }: AnimationEngineProps) {
  const { status, speed, setElapsed, setStatus } = useLessonStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const captionAudioRef = useRef<HTMLAudioElement | null>(null);
  const elapsedRef = useRef<number>(0);
  const tickRef = useRef<number>(100);
  const lastCaptionIdRef = useRef<string | null>(null);

  const storeElapsed = useLessonStore((s) => s.elapsed);
  useEffect(() => {
    elapsedRef.current = storeElapsed;
  }, [storeElapsed]);

  // Main part audio — used as fallback when per-caption audio isn't available
  useEffect(() => {
    if (part.audio_url) {
      if (!audioRef.current) audioRef.current = new Audio(part.audio_url);
      audioRef.current.src = part.audio_url;
    }
    return () => {
      audioRef.current?.pause();
      captionAudioRef.current?.pause();
    };
  }, [part.audio_url]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
    if (captionAudioRef.current) captionAudioRef.current.playbackRate = speed;
    tickRef.current = speed >= 2 ? 50 : speed <= 0.5 ? 200 : 100;
  }, [speed]);

  // Detect if this part uses per-caption audio (any caption scene has audioUrl)
  const hasCaptionAudio = part.scenes.some(
    (s) => s.action_type === "draw_caption" && !!(s.payload as Record<string, unknown>)?.audioUrl
  );

  // Main playback loop — timer + caption audio switching
  useEffect(() => {
    if (status === "playing") {
      const tick = tickRef.current;
      timerRef.current = setInterval(() => {
        const delta = (tick / 1000) * speed;
        const next = elapsedRef.current + delta;
        elapsedRef.current = next;
        setElapsed(next);

        // Check for caption change → play per-caption audio
        if (hasCaptionAudio) {
          const active = getActiveCaption(part.scenes, next, 0);
          const activeId = active ? `${active.id}-${active.time_offset}` : null;
          if (activeId && activeId !== lastCaptionIdRef.current) {
            lastCaptionIdRef.current = activeId;
            const capUrl = (active!.payload as Record<string, unknown>)?.audioUrl as string | undefined;
            if (capUrl) {
              if (!captionAudioRef.current) captionAudioRef.current = new Audio();
              captionAudioRef.current.src = capUrl;
              captionAudioRef.current.playbackRate = speed;
              captionAudioRef.current.play().catch(() => {});
            }
          }
        }

        if (next >= part.duration_seconds) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setStatus("idle");
          onPartComplete();
        }
      }, tick);

      // Start main audio as fallback (only if no per-caption audio)
      if (!hasCaptionAudio) {
        audioRef.current?.play().catch(() => {});
      }
    } else {
      audioRef.current?.pause();
      captionAudioRef.current?.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, speed, part.duration_seconds]);

  return null;
}
