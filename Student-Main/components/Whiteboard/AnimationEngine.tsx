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

function captionSlotSeconds(scenes: StoryboardScene[], active: StoryboardScene): number {
  const next = scenes
    .filter((scene) => scene.action_type === "draw_caption" && scene.time_offset > active.time_offset)
    .sort((a, b) => a.time_offset - b.time_offset)[0];
  if (next) return Math.max(0.25, next.time_offset - active.time_offset);
  const payload = active.payload as Record<string, unknown>;
  return Math.max(0.25, Number(payload.estimatedDurationSeconds) || 1.2);
}

export default function AnimationEngine({ part, onPartComplete }: AnimationEngineProps) {
  const { status, speed, setElapsed, setStatus } = useLessonStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const captionAudioRef = useRef<HTMLAudioElement | null>(null);
  const elapsedRef = useRef<number>(0);
  const tickRef = useRef<number>(100);
  const lastCaptionIdRef = useRef<string | null>(null);
  const onPartCompleteRef = useRef(onPartComplete);

  useEffect(() => {
    onPartCompleteRef.current = onPartComplete;
  }, [onPartComplete]);

  const storeElapsed = useLessonStore((s) => s.elapsed);
  useEffect(() => {
    const jumped = Math.abs(storeElapsed - elapsedRef.current) > 0.35;
    if (jumped) {
      lastCaptionIdRef.current = null;
      captionAudioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) audioRef.current.currentTime = Math.max(0, storeElapsed);
    }
    elapsedRef.current = storeElapsed;
  }, [storeElapsed]);

  // Full-part audio is legacy-only. Caption timelines always narrate the exact
  // visible caption, using their generated clip or browser speech as fallback.
  useEffect(() => {
    lastCaptionIdRef.current = null;
    captionAudioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (part.audio_url) {
      if (!audioRef.current) audioRef.current = new Audio(part.audio_url);
      audioRef.current.src = part.audio_url;
    } else {
      audioRef.current = null;
    }
    return () => {
      audioRef.current?.pause();
      captionAudioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [part.id, part.audio_url]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
    if (captionAudioRef.current) captionAudioRef.current.playbackRate = speed;
    tickRef.current = speed >= 2 ? 50 : speed <= 0.5 ? 200 : 100;
  }, [speed]);

  const hasCaptionTimeline = part.scenes.some((s) => s.action_type === "draw_caption");

  // Main playback loop — timer + caption audio switching
  useEffect(() => {
    if (status === "playing") {
      const speakCaption = (text: string) => {
        if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = Math.min(2, Math.max(0.5, speed));
        window.speechSynthesis.speak(utterance);
      };
      const playCaptionAt = (at: number) => {
        const active = getActiveCaption(part.scenes, at, 0);
        const activeId = active ? `${active.id}-${active.time_offset}` : null;
        if (!activeId) return;

        if (activeId === lastCaptionIdRef.current) {
          if (captionAudioRef.current?.paused) captionAudioRef.current.play().catch(() => {});
          if (typeof window !== "undefined" && window.speechSynthesis?.paused) window.speechSynthesis.resume();
          return;
        }

        lastCaptionIdRef.current = activeId;
        captionAudioRef.current?.pause();
        if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();

        const payload = active!.payload as Record<string, unknown>;
        const text = String(payload.narrationText || payload.content || "").trim();
        const capUrl = typeof payload.audioUrl === "string" ? payload.audioUrl : "";
        if (capUrl) {
          if (!captionAudioRef.current) captionAudioRef.current = new Audio();
          const audio = captionAudioRef.current;
          audio.src = capUrl;
          audio.onerror = () => speakCaption(text);
          audio.onloadedmetadata = () => {
            if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
            const exactRate = (audio.duration * speed) / captionSlotSeconds(part.scenes, active!);
            audio.playbackRate = Math.min(2, Math.max(0.5, exactRate));
          };
          audio.playbackRate = speed;
          audio.play().catch(() => speakCaption(text));
        } else {
          speakCaption(text);
        }
      };

      if (hasCaptionTimeline) {
        playCaptionAt(elapsedRef.current);
      } else if (audioRef.current) {
        if (Math.abs(audioRef.current.currentTime - elapsedRef.current) > 0.35) {
          audioRef.current.currentTime = Math.max(0, elapsedRef.current);
        }
        audioRef.current.playbackRate = speed;
        audioRef.current.play().catch(() => {});
      }

      const tick = tickRef.current;
      timerRef.current = setInterval(() => {
        const delta = (tick / 1000) * speed;
        const next = elapsedRef.current + delta;
        elapsedRef.current = next;
        setElapsed(next);

        if (hasCaptionTimeline) playCaptionAt(next);

        if (next >= part.duration_seconds) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          audioRef.current?.pause();
          captionAudioRef.current?.pause();
          if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
          setStatus("idle");
          onPartCompleteRef.current();
        }
      }, tick);
    } else {
      audioRef.current?.pause();
      captionAudioRef.current?.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (status === "paused") window.speechSynthesis.pause();
        else window.speechSynthesis.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, speed, part.id, part.scenes, part.duration_seconds, hasCaptionTimeline, setElapsed, setStatus]);

  return null;
}
