"use client";
/**
 * AnimationEngine — drives the elapsed timer that the Whiteboard uses
 * to decide which scenes to show.
 *
 * It also manages audio playback for TTS narration if an audio_url is provided.
 */

import { useEffect, useRef } from "react";
import { useLessonStore } from "@/store/lessonStore";
import type { LessonPart } from "@/lib/types";

interface AnimationEngineProps {
  part: LessonPart;
  onPartComplete: () => void;
}

export default function AnimationEngine({ part, onPartComplete }: AnimationEngineProps) {
  const { status, speed, setElapsed, setStatus } = useLessonStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Use a ref so the setInterval callback always reads the latest elapsed value
  const elapsedRef = useRef<number>(0);

  // Keep elapsedRef in sync with the store
  const storeElapsed = useLessonStore((s) => s.elapsed);
  useEffect(() => {
    elapsedRef.current = storeElapsed;
  }, [storeElapsed]);

  // Sync audio with play/pause
  useEffect(() => {
    if (part.audio_url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(part.audio_url);
      }
      audioRef.current.src = part.audio_url;
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [part.audio_url]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
  }, [speed]);

  // Drive elapsed timer
  useEffect(() => {
    if (status === "playing") {
      audioRef.current?.play().catch(() => {});
      timerRef.current = setInterval(() => {
        const next = elapsedRef.current + 0.1 * speed;
        elapsedRef.current = next;
        setElapsed(next);
        if (next >= part.duration_seconds) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setStatus("idle");
          onPartComplete();
        }
      }, 100);
    } else {
      audioRef.current?.pause();
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

  return null; // headless driver
}
