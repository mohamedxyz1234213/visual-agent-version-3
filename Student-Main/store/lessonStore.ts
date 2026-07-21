import { create } from "zustand";
import type { Lesson, LessonPart, LessonExerciseBlock, Quiz, QuizAttemptResult } from "@/lib/types";

export type PlayerStatus = "idle" | "playing" | "paused" | "quiz" | "exercise" | "finished";

interface LessonStore {
  // ─── Lesson data ───────────────────────────────────────────────────────────
  lesson: Lesson | null;
  setLesson: (lesson: Lesson) => void;

  // ─── Exercise blocks (embedded in lesson) ──────────────────────────────────
  exerciseBlocks: LessonExerciseBlock[];
  setExerciseBlocks: (blocks: LessonExerciseBlock[]) => void;

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

  // ─── Active Exercise ──────────────────────────────────────────────────────
  activeExercise: LessonExerciseBlock | null;
  exerciseSubmitted: boolean;
  exercisePassed: boolean;
  setActiveExercise: (e: LessonExerciseBlock | null) => void;
  setExerciseSubmitted: (passed: boolean) => void;
  clearExercise: () => void;

  // ─── Student Code ─────────────────────────────────────────────────────────
  studentCode: string | null;
  setStudentCode: (code: string | null) => void;

  // ─── Helpers ───────────────────────────────────────────────────────────────
  currentPart: () => LessonPart | null;
}

export const useLessonStore = create<LessonStore>((set, get) => ({
  lesson: null,
  setLesson: (lesson) => set({ lesson, currentPartIndex: 0, status: "idle", elapsed: 0 }),

  exerciseBlocks: [],
  setExerciseBlocks: (blocks) => set({ exerciseBlocks: blocks }),

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
      set({ currentPartIndex: next, elapsed: 0, status: "idle", activeQuiz: null, quizResult: null, activeExercise: null, exerciseSubmitted: false, exercisePassed: false });
    } else {
      set({ status: "finished" });
    }
  },

  prevPart: () => {
    const { currentPartIndex } = get();
    if (currentPartIndex > 0) {
      set({ currentPartIndex: currentPartIndex - 1, elapsed: 0, status: "idle", activeQuiz: null, quizResult: null, activeExercise: null, exerciseSubmitted: false, exercisePassed: false });
    }
  },

  activeQuiz: null,
  quizResult: null,
  setActiveQuiz: (q) => set({ activeQuiz: q }),
  setQuizResult: (r) => set({ quizResult: r }),

  activeExercise: null,
  exerciseSubmitted: false,
  exercisePassed: false,
  setActiveExercise: (e) => set({ activeExercise: e, exerciseSubmitted: false, exercisePassed: false }),
  setExerciseSubmitted: (passed) => set({ exerciseSubmitted: true, exercisePassed: passed }),
  clearExercise: () => set({ activeExercise: null, exerciseSubmitted: false, exercisePassed: false }),

  studentCode: null,
  setStudentCode: (code) => set({ studentCode: code }),

  currentPart: () => {
    const { lesson, currentPartIndex } = get();
    return lesson?.parts[currentPartIndex] ?? null;
  },
}));
