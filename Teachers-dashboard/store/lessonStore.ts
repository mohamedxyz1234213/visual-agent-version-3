import { create } from "zustand";
import type { Lesson, LessonPart, Quiz, QuizAttemptResult } from "@/lib/types";

export type PlayerStatus = "idle" | "playing" | "paused" | "quiz" | "finished";

interface LessonStore {
  // ─── Lesson data ───────────────────────────────────────────────────────────
  lesson: Lesson | null;
  setLesson: (lesson: Lesson) => void;

  // ─── Playback ──────────────────────────────────────────────────────────────
  currentPartIndex: number;
  status: PlayerStatus;
  elapsed: number;           // seconds elapsed in current part
  speed: number;             // playback speed multiplier
  zoom: number;

  setCurrentPartIndex: (i: number) => void;
  setStatus: (s: PlayerStatus) => void;
  setElapsed: (t: number) => void;
  setSpeed: (s: number) => void;
  setZoom: (z: number) => void;

  play: () => void;
  pause: () => void;
  replay: () => void;
  skipPart: () => void;
  prevPart: () => void;

  // ─── Quiz ──────────────────────────────────────────────────────────────────
  activeQuiz: Quiz | null;
  quizResult: QuizAttemptResult | null;
  setActiveQuiz: (q: Quiz | null) => void;
  setQuizResult: (r: QuizAttemptResult | null) => void;

  // ─── Helpers ───────────────────────────────────────────────────────────────
  currentPart: () => LessonPart | null;
}

export const useLessonStore = create<LessonStore>((set, get) => ({
  lesson: null,
  setLesson: (lesson) => set({ lesson, currentPartIndex: 0, status: "idle", elapsed: 0 }),

  currentPartIndex: 0,
  status: "idle",
  elapsed: 0,
  speed: 1,
  zoom: 1,

  setCurrentPartIndex: (i) => set({ currentPartIndex: i, elapsed: 0, status: "idle" }),
  setStatus: (s) => set({ status: s }),
  setElapsed: (t) => set({ elapsed: t }),
  setSpeed: (s) => set({ speed: s }),
  setZoom: (z) => set({ zoom: z }),

  play: () => set({ status: "playing" }),
  pause: () => set({ status: "paused" }),
  replay: () => set({ elapsed: 0, status: "playing" }),

  skipPart: () => {
    const { lesson, currentPartIndex } = get();
    if (!lesson) return;
    const next = currentPartIndex + 1;
    if (next < lesson.parts.length) {
      set({ currentPartIndex: next, elapsed: 0, status: "idle", activeQuiz: null, quizResult: null });
    } else {
      set({ status: "finished" });
    }
  },

  prevPart: () => {
    const { currentPartIndex } = get();
    if (currentPartIndex > 0) {
      set({ currentPartIndex: currentPartIndex - 1, elapsed: 0, status: "idle", activeQuiz: null, quizResult: null });
    }
  },

  activeQuiz: null,
  quizResult: null,
  setActiveQuiz: (q) => set({ activeQuiz: q }),
  setQuizResult: (r) => set({ quizResult: r }),

  currentPart: () => {
    const { lesson, currentPartIndex } = get();
    return lesson?.parts[currentPartIndex] ?? null;
  },
}));
