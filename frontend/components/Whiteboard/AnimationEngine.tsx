"use client";
/**
 * AnimationEngine — drives the elapsed timer that the Whiteboard uses
 * to decide which scenes to show.
 *
 * Uses requestAnimationFrame + time delta for precise timing.
 * Syncs audio playback for TTS narration if an audio_url is provided.
 */

import { useEffect, useRef, useCallback } from "react";
import { useLessonStore } from "@/store/lessonStore";
import type { LessonPart } from "@/lib/types";

interface AnimationEngineProps {
  part: LessonPart;
  onPartComplete: () => void;
}

export default function AnimationEngine({ part, onPartComplete }: AnimationEngineProps) {
  const { status, speed, setElapsed, setStatus } = useLessonStore();
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);

  // Keep elapsedRef in sync with the store
  const storeElapsed = useLessonStore((s) => s.elapsed);
  useEffect(() => {
    elapsedRef.current = storeElapsed;
  }, [storeElapsed]);

  // Audio management
  useEffect(() => {
    if (part.audio_url) {
      if (!audioRef.current || audioRef.current.src !== part.audio_url) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        audioRef.current = new Audio(part.audio_url);
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [part.audio_url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Animation frame callback using time delta for precision
  const tick = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current === null) {
      lastFrameTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const deltaMs = timestamp - lastFrameTimeRef.current;
    lastFrameTimeRef.current = timestamp;

    // Convert to seconds and apply speed multiplier
    const deltaSeconds = (deltaMs / 1000) * speed;
    const next = elapsedRef.current + deltaSeconds;
    elapsedRef.current = next;
    setElapsed(next);

    if (next >= part.duration_seconds) {
      rafRef.current = null;
      lastFrameTimeRef.current = null;
      setStatus("idle");
      onPartComplete();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [speed, part.duration_seconds, setElapsed, setStatus, onPartComplete]);

  // Drive animation based on status
  useEffect(() => {
    if (status === "playing") {
      // Start audio
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(elapsedRef.current, audioRef.current.duration || 0);
        audioRef.current.play().catch(() => {});
      }
      // Start animation loop
      lastFrameTimeRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // Pause
      audioRef.current?.pause();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameTimeRef.current = null;
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status, tick]);

  return null; // headless driver
}
