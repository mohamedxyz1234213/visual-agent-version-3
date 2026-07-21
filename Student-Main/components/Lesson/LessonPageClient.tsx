"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLesson, getQuizForPart, getSeriesLessons } from "@/lib/api";
import type { Lesson, LessonPart, LessonExerciseBlock, SeriesLesson } from "@/lib/types";
import { useLessonStore } from "@/store/lessonStore";
import { Whiteboard, AnimationEngine } from "@/components/Whiteboard";
import { NavigationControls } from "@/components/Navigation";
import { QuizPanel } from "@/components/Quiz";
import { CodeEditor } from "@/components/CodeEditor/CodeEditor";
import { identifyStudent, getLessonExerciseBlocks, submitLessonExerciseBlock } from "@/features/student/api";

type LessonPageClientProps = {
  lessonId: string;
  initialLesson: Lesson | null;
  initialError?: string | null;
  seriesId: string | null;
  totalLessons: number;
};

export default function LessonPageClient({
  lessonId,
  initialLesson,
  initialError = null,
  seriesId,
  totalLessons,
}: LessonPageClientProps) {
  const router = useRouter();

  const {
    lesson,
    setLesson,
    currentPartIndex,
    elapsed,
    status,
    zoom,
    setStatus,
    skipPart,
    setActiveQuiz,
    activeQuiz,
    setQuizResult,
    setExerciseBlocks,
    exerciseBlocks,
    activeExercise,
    setActiveExercise,
    exerciseSubmitted,
    exercisePassed,
    setExerciseSubmitted,
    clearExercise,
    studentCode,
    setStudentCode,
  } = useLessonStore();

  const [loading, setLoading] = useState(!initialLesson && !initialError);
  const [error, setError] = useState<string | null>(initialError);
  const [seriesLessons, setSeriesLessons] = useState<SeriesLesson[]>([]);

  // Student code input state (for inline identification in lesson)
  const [codeInput, setCodeInput] = useState("");
  const [codeInputError, setCodeInputError] = useState<string | null>(null);
  const [codeIdentifying, setCodeIdentifying] = useState(false);

  // Exercise submission state
  const [exerciseCode, setExerciseCode] = useState("");
  const [exerciseLanguage, setExerciseLanguage] = useState("javascript");
  const [exerciseStatus, setExerciseStatus] = useState<"idle" | "running" | "passed" | "failed">("idle");
  const [exerciseResult, setExerciseResult] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;

    if (initialLesson?.id === lessonId) {
      setLesson(initialLesson);
      setError(initialError ?? null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getLesson(lessonId)
      .then((loadedLesson) => {
        setLesson(loadedLesson);
        setError(null);
        setLoading(false);
      })
      .catch((loadError) => {
        setError(String(loadError));
        setLoading(false);
      });
  }, [initialError, initialLesson, lessonId, setLesson]);

  // Load exercise blocks for this lesson
  useEffect(() => {
    if (!lessonId || !lesson) return;
    getLessonExerciseBlocks(lessonId)
      .then((res) => setExerciseBlocks(res.blocks || []))
      .catch(() => {});
  }, [lessonId, lesson, setExerciseBlocks]);

  useEffect(() => {
    if (!seriesId || totalLessons <= 1) return;
    const poll = () =>
      getSeriesLessons(seriesId)
        .then(setSeriesLessons)
        .catch(() => {});
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [seriesId, totalLessons]);

  // Restore student code from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("studentCode");
    if (saved && !studentCode) {
      setStudentCode(saved);
    }
  }, [studentCode, setStudentCode]);

  const currentPart: LessonPart | null = lesson?.parts[currentPartIndex] ?? null;
  const lessonProgress = lesson?.parts.length ? Math.round(((currentPartIndex + 1) / lesson.parts.length) * 100) : 0;

  // Handle quiz parts
  useEffect(() => {
    if (!currentPart) return;
    if (currentPart.part_type === "quiz" || currentPart.part_type === "final_quiz") {
      getQuizForPart(currentPart.id)
        .then((quiz) => {
          setActiveQuiz(quiz);
          setStatus("quiz");
        })
        .catch(() => {
          skipPart();
        });
    }
  }, [currentPart, skipPart, setActiveQuiz, setStatus]);

  // Handle exercise parts
  useEffect(() => {
    if (!currentPart || !exerciseBlocks.length) return;
    if (currentPart.part_type === "exercise") {
      const block = currentPart.exercise_block_id
        ? exerciseBlocks.find((b) => b._id === currentPart.exercise_block_id)
        : exerciseBlocks[0];
      if (block) {
        setActiveExercise(block);
        setExerciseCode(block.starterCode || "");
        setExerciseStatus("idle");
        setExerciseResult(null);
        setStatus("exercise");
      } else {
        skipPart();
      }
    }
  }, [currentPart, exerciseBlocks, skipPart, setActiveExercise, setStatus]);

  function handlePartComplete() {
    if (!currentPart) return;
    // After a content part, check if there's an exercise to show next
    if (exerciseBlocks.length > 0 && currentPart.part_type === "content") {
      const nextBlockIndex = currentPartIndex < exerciseBlocks.length ? currentPartIndex : -1;
      if (nextBlockIndex >= 0 && nextBlockIndex < exerciseBlocks.length) {
        const block = exerciseBlocks[nextBlockIndex];
        setActiveExercise(block);
        setExerciseCode(block.starterCode || "");
        setExerciseStatus("idle");
        setExerciseResult(null);
        setStatus("exercise");
        return;
      }
    }
    skipPart();
  }

  function handleQuizPass() {
    setActiveQuiz(null);
    setQuizResult(null);
    skipPart();
  }

  function handleQuizRepeat() {
    setActiveQuiz(null);
    setQuizResult(null);
    const { prevPart } = useLessonStore.getState();
    prevPart();
    useLessonStore.getState().play();
  }

  async function handleIdentifyStudent() {
    if (!codeInput.trim()) return;
    setCodeIdentifying(true);
    setCodeInputError(null);
    try {
      const res = await identifyStudent(codeInput.trim().toUpperCase());
      setStudentCode(res.student.code);
      localStorage.setItem("studentCode", codeInput.trim().toUpperCase());
    } catch (err: any) {
      setCodeInputError(err.message || "Student not found with that code");
    } finally {
      setCodeIdentifying(false);
    }
  }

  async function handleSubmitExercise() {
    if (!activeExercise) return { passed: false, output: "No active exercise" };
    if (!studentCode) {
      setCodeInputError("Please identify yourself with your student code first");
      return { passed: false, output: "Please identify yourself first" };
    }
    setExerciseStatus("running");
    setExerciseResult(null);
    try {
      const res = await submitLessonExerciseBlock(lessonId, activeExercise._id, {
        code: exerciseCode,
        language: exerciseLanguage,
        studentCode,
      });
      const passed = res.submission.status === "passed";
      const output = `Score: ${res.submission.score}/100 · Status: ${res.submission.status}`;
      setExerciseStatus(passed ? "passed" : "failed");
      setExerciseResult(output);
      setExerciseSubmitted(passed);
      if (passed) {
        setTimeout(() => {
          clearExercise();
          skipPart();
        }, 1500);
      }
      return { passed, output };
    } catch (err: any) {
      const output = `Error: ${err.message}`;
      setExerciseStatus("failed");
      setExerciseResult(output);
      return { passed: false, output };
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-slate-200 border-t-blue-600" />
          <p className="text-slate-500 text-sm">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson || !currentPart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error ?? "Lesson not found."}</p>
          <button onClick={() => router.push("/")} className="text-blue-600 underline">
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  if (status === "finished") {
    const currentIndex = seriesLessons.findIndex((seriesLesson) => seriesLesson.id === lessonId);
    const nextReady = seriesLessons.find(
      (seriesLesson, index) => index > currentIndex && seriesLesson.status === "ready"
    );
    const anyProcessing = seriesLessons.some((seriesLesson) => seriesLesson.status === "processing");

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] px-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 className="app-display text-4xl font-semibold text-slate-900">Lesson Complete</h1>
        <p className="text-slate-500 max-w-sm text-center text-sm leading-relaxed">
          You&apos;ve finished <strong>{lesson.title}</strong>. Great work!
        </p>

        {totalLessons > 1 && seriesLessons.length > 0 && (
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Course Progress ({seriesLessons.filter((seriesLesson) => seriesLesson.status === "ready").length} / {totalLessons} lessons ready)
            </p>
            <div className="flex flex-col gap-2">
              {seriesLessons.map((seriesLesson, index) => (
                <div
                  key={seriesLesson.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 border text-sm ${
                    seriesLesson.id === lessonId
                      ? "border-blue-300 bg-blue-50"
                      : seriesLesson.status === "ready"
                      ? "border-green-200 bg-green-50 cursor-pointer hover:border-green-400"
                      : "border-slate-100 bg-slate-50 opacity-60"
                  }`}
                  onClick={() =>
                    seriesLesson.status === "ready" && seriesLesson.id !== lessonId &&
                    router.push(`/lesson/${seriesLesson.id}?series=${seriesId}&total=${totalLessons}`)
                  }
                >
                  <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: seriesLesson.id === lessonId ? "#3b82f6" : seriesLesson.status === "ready" ? "#10b981" : seriesLesson.status === "processing" ? "#f59e0b" : "#cbd5e1" }} />
                  <span className={`flex-1 truncate font-medium ${seriesLesson.id === lessonId ? "text-blue-700" : seriesLesson.status === "ready" ? "text-green-700" : "text-slate-400"}`}>
                    Lesson {index + 1}: {seriesLesson.title ?? "..."}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextReady ? (
          <button
            onClick={() => router.push(`/lesson/${nextReady.id}?series=${seriesId}&total=${totalLessons}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white text-sm hover:bg-emerald-700 active:bg-emerald-800 transition"
          >
            Next Lesson: {nextReady.title}
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : anyProcessing ? (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            Next lesson is being prepared in the background...
          </p>
        ) : null}

        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white text-sm hover:bg-blue-700 active:bg-blue-800 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to Home
        </button>
      </div>
    );
  }

  // ── Exercise part view (video paused, showing programming question) ──────
  if (status === "exercise" && activeExercise) {
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
        <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/")} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-slate-700" aria-label="Back to dashboard">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">{lesson.title}</h1>
                <p className="text-xs text-slate-400">Part {currentPartIndex + 1} of {lesson.parts.length}</p>
              </div>
            </div>
            {studentCode && (
              <span className="px-3 py-1.5 rounded-lg bg-[#A78BFA]/10 text-xs font-mono font-semibold text-[#A78BFA]">
                ID: {studentCode}
              </span>
            )}
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 xl:px-6 xl:py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            Video paused — complete the coding exercise to continue
          </div>

          {/* Student code identification (if not already identified) */}
          {!studentCode && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 max-w-lg mx-auto text-center">
              <h3 className="text-lg font-bold text-[#18181B] mb-2">Identify Yourself</h3>
              <p className="text-sm text-gray-500 mb-4">Enter your student code to submit your answer</p>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Your student code (e.g. A3X8K2M1)"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#A78BFA] mb-3"
                onKeyDown={(e) => e.key === "Enter" && handleIdentifyStudent()}
              />
              {codeInputError && <p className="text-sm text-red-500 mb-3">{codeInputError}</p>}
              <button
                onClick={handleIdentifyStudent}
                disabled={codeIdentifying || !codeInput.trim()}
                className="px-6 py-2.5 bg-[#18181B] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
              >
                {codeIdentifying ? "Checking..." : "Identify"}
              </button>
            </div>
          )}

          {/* Exercise card */}
          <div className="my-6 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="flex items-start justify-between gap-4 px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A78BFA]">Code Exercise</span>
                  {activeExercise.isRequired && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Required</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeExercise.title || "Coding Exercise"}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                  activeExercise.difficulty === "easy" ? "text-green-600 bg-green-50" :
                  activeExercise.difficulty === "medium" ? "text-amber-600 bg-amber-50" :
                  "text-red-600 bg-red-50"
                }`}>{activeExercise.difficulty}</span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#D6F63E]/20 text-[#0F0F0F]">+{activeExercise.xpReward} XP</span>
              </div>
            </div>

            {activeExercise.instructions && (
              <div className="px-5 py-3 bg-blue-50/30 border-b border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{activeExercise.instructions}</p>
              </div>
            )}

            <CodeEditor
              initialCode={exerciseCode}
              language={exerciseLanguage}
              hints={activeExercise.hints || []}
              onRun={async (code) => {
                setExerciseCode(code);
                return handleSubmitExercise();
              }}
              showLanguageSelector={true}
              onLanguageChange={setExerciseLanguage}
            />

            {exerciseStatus !== "idle" && (
              <div className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 ${
                exerciseStatus === "running" ? "bg-blue-50 text-blue-700" :
                exerciseStatus === "passed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {exerciseStatus === "running" && (
                  <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Evaluating...</>
                )}
                {exerciseStatus === "passed" && (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Passed! Continuing...</>
                )}
                {exerciseStatus === "failed" && (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Not quite right. Try again!</>
                )}
              </div>
            )}

            {exerciseStatus === "failed" && !exerciseSubmitted && (
              <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => { clearExercise(); skipPart(); }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip this exercise
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal lesson view ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => router.push("/")} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-400 transition hover:text-slate-700" aria-label="Back to dashboard">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">{lesson.title}</h1>
              {lesson.subject && (
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{lesson.subject}</p>
              )}
            </div>
            {totalLessons > 1 && (
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                Lesson {(lesson.lesson_index ?? 0) + 1} of {totalLessons}
              </span>
            )}
            {studentCode && (
              <span className="rounded-full bg-[#A78BFA]/10 px-3 py-1 text-xs font-mono font-semibold text-[#A78BFA]">
                ID: {studentCode}
              </span>
            )}
          </div>

          <div className="hidden flex-wrap items-center gap-2 text-sm text-slate-500 md:flex lg:justify-end">
            {lesson.parts.map((part, index) => (
              <span
                key={part.id}
                className={`truncate max-w-[120px] ${
                  index === currentPartIndex ? "font-semibold text-slate-900" : index < currentPartIndex ? "text-slate-400 line-through" : "text-slate-400"
                }`}
                title={part.title}
              >
                {part.title}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 xl:flex-row xl:gap-6 xl:px-6 xl:py-6">
        <div className="flex flex-1 flex-col gap-4">
          <div className="app-surface rounded-[28px] px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Current Section</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-slate-900">{currentPart.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {status === "quiz"
                    ? "Answer the quiz to unlock the next section."
                    : `Part ${currentPartIndex + 1} of ${lesson.parts.length} · ${Math.max(1, Math.round(currentPart.duration_seconds / 60))} min estimated`}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                <span>{lessonProgress}% through lesson</span>
              </div>
            </div>
          </div>

          {currentPart.narration && status !== "quiz" && (
            <div className="app-surface flex max-h-36 items-start gap-3 overflow-y-auto rounded-[28px] px-5 py-4 text-sm text-slate-700">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-4 h-4 mt-1 shrink-0 text-slate-400"><path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" /></svg>
              <p className="leading-7 whitespace-pre-line">{currentPart.narration}</p>
            </div>
          )}

          {status !== "quiz" ? (
            <div className="app-surface flex flex-1 items-center justify-center rounded-[32px] p-4 md:p-5">
              <Whiteboard scenes={currentPart.scenes} elapsed={elapsed} zoom={zoom} />
            </div>
          ) : (
            activeQuiz && (
              <div className="flex flex-1 items-start justify-center pt-2 md:pt-4">
                <div className="app-surface max-h-[75vh] w-full max-w-2xl overflow-y-auto rounded-[28px]">
                  <QuizPanel quiz={activeQuiz} onPass={handleQuizPass} onRepeat={handleQuizRepeat} />
                </div>
              </div>
            )
          )}

          {status !== "quiz" && <NavigationControls parts={lesson.parts} />}

          {status === "idle" && (
            <div className="flex justify-center">
              <button
                onClick={() => useLessonStore.getState().play()}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-3 font-semibold text-white hover:bg-slate-800 transition shadow"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Start Section
              </button>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-6 border-t border-slate-200/80 bg-white/70 p-6 backdrop-blur xl:w-80 xl:self-start xl:rounded-[32px] xl:border xl:max-h-[calc(100vh-48px)] xl:overflow-y-auto">
          {lesson.summary && (
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Summary</h3>
              <p className="text-sm leading-7 text-slate-600">{lesson.summary}</p>
            </div>
          )}

          <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Lesson Outline</h3>
            <ul className="space-y-1.5">
              {lesson.parts.map((part, index) => (
                <li
                  key={part.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    index === currentPartIndex
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : index < currentPartIndex
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {index < currentPartIndex
                      ? <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-slate-400"><polyline points="20 6 9 17 4 12" /></svg>
                      : (part.part_type === "quiz" || part.part_type === "final_quiz")
                        ? <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-3.5 h-3.5 text-slate-500"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                        : part.part_type === "exercise"
                        ? <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-3.5 h-3.5 text-amber-500"><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></svg>
                        : <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-slate-400"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    }
                  </span>
                  <span className="truncate">{part.title}</span>
                  <span className="ml-auto text-xs text-slate-400 shrink-0">
                    {part.part_type === "exercise" ? "exercise" : `${Math.round(part.duration_seconds / 60)}m`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {status !== "quiz" && currentPart && (
        <AnimationEngine part={currentPart} onPartComplete={handlePartComplete} />
      )}
    </div>
  );
}