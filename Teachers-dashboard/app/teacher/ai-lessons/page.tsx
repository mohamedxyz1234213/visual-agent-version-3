"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateAILesson, generateTemplateLesson } from "@/features/teacher/api";
import { fetchDashboard, pollUploadStatus, getLesson } from "@/lib/api";
import type { DashboardLesson, Lesson } from "@/lib/types";
import {
  IconRobot,
  IconBook,
  IconCheck,
  IconX,
  IconStar,
  IconClock,
  IconPalette,
  IconChevronRight,
  IconFileText,
  IconTrash,
  IconEye,
} from "@/components/shared/FluxIcons";

// ── Teaching presets (matches UploadZone style) ───────────────────────────────
type LessonIntent = "teach" | "practice" | "notes";

interface PresetOption {
  id: string;
  label: string;
  desc: string;
  useWhen: string;
  intent: LessonIntent;
  mode: string;
}

const LESSON_PRESETS: PresetOption[] = [
  {
    id: "explain_clearly",
    label: "Explain It Clearly",
    desc: "Best default. Balanced explanation, visuals, and recap.",
    useWhen: "Use this when the learner is seeing the topic for the first time.",
    intent: "teach",
    mode: "full_lesson",
  },
  {
    id: "show_visually",
    label: "Show It Visually",
    desc: "Leans on diagrams, graphs, movement, and board space.",
    useWhen: "Use this for diagrams, processes, and visual topics.",
    intent: "teach",
    mode: "visual_first",
  },
  {
    id: "go_step_by_step",
    label: "Go Step by Step",
    desc: "Slower pacing with one move at a time.",
    useWhen: "Use this for formulas, derivations, and harder multi-stage ideas.",
    intent: "teach",
    mode: "step_by_step",
  },
  {
    id: "practice_questions",
    label: "Practice With Questions",
    desc: "Adds more checks, worked answers, and quiz moments.",
    useWhen: "Use this when the learner already knows the basics and needs practice.",
    intent: "practice",
    mode: "qa_mode",
  },
  {
    id: "revision_notes",
    label: "Turn It Into Notes",
    desc: "Creates concise notes and selective supporting visuals.",
    useWhen: "Use this for revision, summaries, and cleaner study notes.",
    intent: "notes",
    mode: "text_focus",
  },
];

const SUBJECTS = [
  { _id: "js", name: "JavaScript", color: "#F7DF1E" },
  { _id: "python", name: "Python", color: "#3776AB" },
  { _id: "html", name: "HTML/CSS", color: "#E34F26" },
  { _id: "react", name: "React", color: "#61DAFB" },
  { _id: "node", name: "Node.js", color: "#339933" },
  { _id: "algo", name: "Algorithms", color: "#8B5CF6" },
];

// ── Pipeline stages ───────────────────────────────────────────────────────────
const STAGES = [
  { key: "queued",             label: "Queued",               desc: "Sending your topic to the server…" },
  { key: "analyzing_document", label: "Analyzing Topic",      desc: "AI is understanding the topic and prerequisites…" },
  { key: "deep_scanning",      label: "Deep Scan",            desc: "AI is checking for missed concepts and examples…" },
  { key: "planning_lessons",   label: "Splitting Into Lessons", desc: "AI is structuring the teaching sequence…" },
  { key: "planning_outline",   label: "Building Lesson Structure", desc: "AI is planning the lesson outline and key concepts…" },
  { key: "ai_generating",      label: "Generating Lesson",    desc: "AI is writing explanations, narration, and examples…" },
  { key: "ai_refining",        label: "Refining Lesson",      desc: "AI is improving clarity and accuracy…" },
  { key: "ai_visual_refining", label: "Composing Visuals",    desc: "AI is polishing whiteboard visuals and sequencing…" },
  { key: "planning",           label: "Planning",             desc: "Designing the lesson flow…" },
  { key: "saving",             label: "Creating Scenes",      desc: "Generating whiteboard scenes and narration…" },
  { key: "finalizing",         label: "Adding Audio",         desc: "Synthesizing TTS narration for each part…" },
  { key: "done",               label: "✅ Lesson Ready",      desc: "Your lesson is complete and ready to assign!" },
];

function getStageIdx(step: string): number {
  const aliases: Record<string, string> = {
    uploading: "queued",
    extracting: "analyzing_document",
    planning_visuals_1: "ai_visual_refining",
    planning_visuals_2: "ai_visual_refining",
    planning_visuals_3: "ai_visual_refining",
  };
  const normalized = aliases[step] || step;
  const idx = STAGES.findIndex((s) => s.key === normalized);
  return idx === -1 ? 0 : idx;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m === 0 ? `${s}s` : `${m}m ${s.toString().padStart(2, "0")}s`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
function IconSpinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className={`animate-spin ${className}`}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}
function IconAlert({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AILessonsPage() {
  const router = useRouter();

  // Form state
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>(LESSON_PRESETS[0]);

  // Lessons list state
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [tab, setTab] = useState<"generate" | "mylessons">("generate");

  // Preview modal state
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DashboardLesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genLessonId, setGenLessonId] = useState<string | null>(null);
  const [genStep, setGenStep] = useState<string>("queued");
  const [genError, setGenError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isError, setIsError] = useState(false);

  const elapsedRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollErrorCountRef = useRef(0);
  const prevStepRef = useRef("queued");
  const stepStartedAtRef = useRef<Record<string, number>>({ queued: 0 });

  // Fetch teacher's whiteboard lessons
  const loadLessons = useCallback(async () => {
    setLessonsLoading(true);
    try {
      const data = await fetchDashboard({ limit: 50, sort: "recent", owner: "me" });
      setLessons(data.lessons || []);
    } catch { /* ignore */ } finally {
      setLessonsLoading(false);
    }
  }, []);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  // Timer for elapsed counter
  useEffect(() => {
    if (generating) {
      timerRef.current = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [generating]);

  // Generate handler
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGenLessonId(null);
    setGenStep("queued");
    setIsError(false);
    setElapsed(0);
    elapsedRef.current = 0;
    prevStepRef.current = "queued";
    pollErrorCountRef.current = 0;
    stepStartedAtRef.current = { queued: 0 };

    try {
      // Try template-based generation first (no AI calls needed)
      const res = await generateTemplateLesson(topic.trim(), subjectId || undefined);
      setGenLessonId(res.id);
      setGenStep("done");
      setGenerating(false);
      loadLessons();
    } catch (templateErr: any) {
      // Fall back to AI generation
      try {
        const res = await generateAILesson(topic.trim(), subjectId || undefined);
        setGenLessonId(res.id);
      } catch (err: any) {
        setGenError(err.message || "Failed to start lesson generation");
        setIsError(true);
        setGenerating(false);
      }
    }
  }, [topic, subjectId, loadLessons]);

  // Poll for status
  useEffect(() => {
    if (!genLessonId) return;

    const interval = setInterval(async () => {
      try {
        const status = await pollUploadStatus(genLessonId);
        const step = status.processing_step || "queued";
        pollErrorCountRef.current = 0;
        setGenStep(step);

        // Track step durations
        if (step !== prevStepRef.current) {
          const startedAt = stepStartedAtRef.current[prevStepRef.current];
          prevStepRef.current = step;
          stepStartedAtRef.current[step] = elapsedRef.current;
        }

        if (status.status === "ready" || step === "done") {
          setGenStep("done");
          setGenerating(false);
          clearInterval(interval);
          loadLessons();
        } else if (status.status === "error") {
          setGenError(status.error_message || "Lesson generation failed");
          setIsError(true);
          setGenerating(false);
          clearInterval(interval);
        } else if (elapsedRef.current >= 720) {
          setGenError("Generation timed out on the server. Please retry; if it repeats, the backend job exceeded runtime limits.");
          setIsError(true);
          setGenerating(false);
          clearInterval(interval);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("401")) {
          setGenError("Your session expired. Sign in again, then retry generation.");
          setIsError(true);
          setGenerating(false);
          clearInterval(interval);
          return;
        }

        pollErrorCountRef.current += 1;
        if (pollErrorCountRef.current >= 4) {
          setGenError(`Status polling failed repeatedly: ${message}`);
          setIsError(true);
          setGenerating(false);
          clearInterval(interval);
        }
      }
    }, 2000);

    pollRef.current = interval;
    return () => clearInterval(interval);
  }, [genLessonId, loadLessons]);

  function resetGen() {
    setGenerating(false);
    setIsError(false);
    setGenLessonId(null);
    setGenStep("queued");
    setGenError(null);
    setElapsed(0);
    elapsedRef.current = 0;
  }

  function handleViewLesson(id: string) {
    router.push(`/lesson/${id}`);
  }

  async function handleOpenPreview(id: string) {
    setPreviewLessonId(id);
    setPreviewData(null);
    setPreviewLesson(null);
    setPreviewLoading(true);

    // Try to find existing data in the lessons list
    const existing = lessons.find((l) => l.id === id);
    if (existing) setPreviewData(existing);

    // Fetch full lesson with parts in the background
    try {
      const full = await getLesson(id);
      setPreviewLesson(full);
      if (!existing) setPreviewData({ id, title: full.title, status: full.status, created_at: full.created_at, subject: full.subject, parts_count: full.parts?.length ?? 0, series_id: full.series_id, lesson_index: full.lesson_index, total_lessons: full.total_lessons, source_filename: full.source_filename, summary: full.summary } as DashboardLesson);
    } catch {
      // Parts will remain a loading skeleton — user can still view
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewLesson(null);
    setPreviewLessonId(null);
    setPreviewData(null);
  }

  async function handleDeleteLesson(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    try {
      const { deleteLesson } = await import("@/lib/api");
      await deleteLesson(id);
      loadLessons();
    } catch (err: any) {
      console.error("Delete failed:", err);
    }
  }

  const currentStageIdx = getStageIdx(genStep);
  const isReady = genStep === "done";
  const progress = isError
    ? Math.round((Math.max(0, currentStageIdx) / (STAGES.length - 1)) * 100)
    : isReady
      ? 100
      : Math.min(99, Math.round(((currentStageIdx + 0.5) / (STAGES.length - 1)) * 100));

  // ── Processing screen ─────────────────────────────────────────────────────
  if (generating || genLessonId) {
    return (
      <div className="w-full rounded-[28px] border border-slate-200/90 bg-white/95 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
        <div className="w-full max-w-lg mx-auto py-6 px-2 flex flex-col items-center gap-6">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isError ? "bg-red-100 text-red-500" : isReady ? "bg-emerald-100 text-emerald-500" : "bg-blue-100 text-blue-600"}`}>
              {isError ? <IconAlert /> : isReady ? <IconCheck className="w-7 h-7" /> : <IconSpinner className="w-7 h-7" />}
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {isError ? "Generation Failed" : isReady ? "Lesson Ready!" : "Building Your Lesson"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              {topic}
              {!isError && !isReady && (
                <>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-blue-500 font-medium">{formatElapsed(elapsed)}</span>
                </>
              )}
            </p>
          </div>

          {!isError && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 truncate pr-2">
                  {isReady ? "Complete" : STAGES[Math.min(currentStageIdx, STAGES.length - 1)]?.desc}
                </span>
                <span className="text-sm font-bold text-blue-600 font-mono tabular-nums shrink-0">{progress}%</span>
              </div>
              <div className="relative w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="w-full flex flex-col gap-1.5">
            {STAGES.map((stage, idx) => {
              const isDone   = isReady || idx < currentStageIdx;
              const isActive = !isError && !isReady && idx === currentStageIdx;
              const isFailed = isError && idx === currentStageIdx;

              return (
                <div
                  key={stage.key}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all ${
                    isActive  ? "bg-blue-50 border-blue-200 shadow-sm"
                    : isFailed ? "bg-red-50 border-red-200"
                    : isDone   ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-100 opacity-40"
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    {isDone   ? <IconCheck className="w-4 h-4 text-emerald-500" />
                    : isActive ? <IconSpinner className="w-4 h-4 text-blue-500" />
                    : isFailed ? <span className="text-red-500 font-bold text-sm">×</span>
                    : <span className="w-3 h-3 rounded-full border-2 border-slate-300 inline-block" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${
                      isActive ? "text-blue-700" : isFailed ? "text-red-600" : isDone ? "text-emerald-700" : "text-slate-400"
                    }`}>{stage.label}</p>
                    <p className={`text-xs mt-0.5 leading-tight ${
                      isActive ? "text-blue-400" : isFailed ? "text-red-400" : "text-slate-400"
                    }`}>
                      {isActive ? stage.desc : isFailed ? genError : ""}
                    </p>
                  </div>
                  {isActive && <span className="text-xs text-blue-400 animate-pulse shrink-0">running…</span>}
                  {isDone && !isReady && (
                    <span className="text-xs text-emerald-500 shrink-0"><IconCheck className="w-4 h-4" /></span>
                  )}
                </div>
              );
            })}
          </div>

          {isError ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-red-500">{genError ?? "An error occurred."}</p>
              <button onClick={resetGen} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
                Try Again
              </button>
            </div>
          ) : isReady ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-xs text-slate-400">Your lesson was created successfully and is ready to assign.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { if (genLessonId) handleOpenPreview(genLessonId); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  <IconEye size={16} />
                  View Lesson
                </button>
                <button
                  onClick={resetGen}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  Generate Another
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center">
              AI lesson generation typically takes 30–90 seconds.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Idle form ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("generate")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "generate" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <IconRobot size={16} className="inline mr-1.5" />
          Generate
        </button>
        <button
          onClick={() => { setTab("mylessons"); setGenError(null); setIsError(false); }}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "mylessons" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <IconBook size={16} className="inline mr-1.5" />
          My Lessons ({lessons.length})
        </button>
      </div>

      {tab === "generate" ? (
        <div className="w-full rounded-[28px] border border-slate-200/90 bg-white/95 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
          {/* Header */}
          <div className="mb-5 border-b border-slate-200/80 pb-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              AI Lesson Generator
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-3xl">
              Create a whiteboard lesson
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Type a topic and the AI will build a complete animated whiteboard lesson with narration, scenes, and audio.
            </p>
          </div>

          {/* Teaching presets as pills */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-3">
              Teaching Style
            </p>
            <div className="flex flex-wrap gap-2">
              {LESSON_PRESETS.map((preset) => {
                const active = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{selectedPreset.useWhen}</p>
          </div>

          {/* Subject chips */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-3">
              Subject (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSubjectId("")}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  !subjectId
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Any
              </button>
              {SUBJECTS.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSubjectId(s._id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition flex items-center gap-1.5 ${
                    subjectId === s._id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input area */}
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-3 transition">
            <textarea
              placeholder="Describe the topic you want to teach — e.g., 'JavaScript closures with practical examples', 'Photosynthesis for grade 8 science'..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (topic.trim().length >= 2) handleGenerate();
                }
              }}
              rows={3}
              className="w-full bg-transparent text-sm leading-6 text-slate-700 placeholder-slate-400 outline-none resize-none"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                {topic.trim().length < 2 ? "Enter at least 2 characters to generate" : `${topic.trim().length} characters`}
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={topic.trim().length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error */}
          {genError && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <IconX size={16} className="shrink-0 text-red-500" />
              <span>{genError}</span>
              <button onClick={resetGen} className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-red-900 transition">
                Dismiss
              </button>
            </div>
          )}

          {/* Info cards */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: IconPalette, label: "Animated Whiteboard", desc: "Rich SVG scenes with draw animations" },
              { icon: IconFileText, label: "Auto Narration", desc: "TTS voiceover for every part" },
              { icon: IconStar, label: "Quiz Included", desc: "Auto-generated exercise blocks" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                  <item.icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           MY LESSONS TAB
           ════════════════════════════════════════════════════════════════════ */
        <div className="w-full rounded-[28px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-4 border-b border-slate-200/80 pb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Lesson Library
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
              My Lessons
            </h1>
          </div>

          {lessonsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[72px] bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <IconFileText size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No Lessons Yet</h3>
              <p className="text-sm text-slate-500 mb-4">Switch to the Generate tab and create your first AI-powered lesson.</p>
              <button onClick={() => setTab("generate")} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition">
                <IconRobot size={16} />
                Generate a Lesson
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => handleOpenPreview(lesson.id)}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group"
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {lesson.status === "ready" ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <IconCheck size={18} className="text-emerald-600" />
                      </div>
                    ) : lesson.status === "processing" ? (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <IconX size={18} className="text-red-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {lesson.title || "Untitled Lesson"}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{new Date(lesson.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {lesson.subject && <><span>·</span><span>{lesson.subject}</span></>}
                      {lesson.parts_count > 0 && <><span>·</span><span>{lesson.parts_count} parts</span></>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                    lesson.status === "ready" ? "bg-emerald-100 text-emerald-700"
                    : lesson.status === "processing" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {lesson.status === "ready" ? "Ready" : lesson.status === "processing" ? "Processing" : "Error"}
                  </span>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteLesson(lesson.id, e)}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete lesson"
                  >
                    <IconTrash size={15} />
                  </button>

                  <IconChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LESSON PREVIEW MODAL
          ════════════════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════════════════
          LESSON PREVIEW MODAL
          ════════════════════════════════════════════════════════════════════ */}
      {(previewData || previewLesson) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[28px] border border-slate-200/90 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)]"
          >
            {/* Close button */}
            <button
              onClick={closePreview}
              className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition z-10"
            >
              <IconX size={16} />
            </button>

            {/* Header — use full lesson data if available, fall back to DashboardLesson */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-200/80">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      (previewLesson?.status || previewData?.status) === "ready" ? "bg-emerald-100 text-emerald-700"
                      : (previewLesson?.status || previewData?.status) === "processing" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                    }`}>
                      {previewLesson?.status === "ready" || previewData?.status === "ready" ? "Ready"
                      : previewLesson?.status === "processing" || previewData?.status === "processing" ? "Processing"
                      : "Error"}
                    </span>
                    {(previewLesson?.subject || previewData?.subject) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
                        {previewLesson?.subject || previewData?.subject}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 leading-snug">
                    {previewLesson?.title || previewData?.title || "Untitled Lesson"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-6">
              {/* Metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Parts</p>
                  <p className="text-lg font-bold text-slate-800">
                    {previewLesson?.parts?.length ?? previewData?.parts_count ?? "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Created</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(previewLesson?.created_at || previewData?.created_at || "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Source</p>
                  <p className="text-sm font-semibold text-slate-800 truncate" title={previewLesson?.source_filename || previewData?.source_filename || ""}>
                    {previewLesson?.source_filename || previewData?.source_filename || "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Series</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {(previewLesson?.series_id || previewData?.series_id)
                      ? `Lesson ${(previewLesson?.lesson_index ?? previewData?.lesson_index ?? 0) + 1} of ${previewLesson?.total_lessons || previewData?.total_lessons || "?"}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Summary */}
              {(previewLesson?.summary || previewData?.summary) && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">Summary</p>
                  <p className="text-sm leading-6 text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
                    {previewLesson?.summary || previewData?.summary}
                  </p>
                </div>
              )}

              {/* Parts list — skeleton while loading, full list when ready */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
                  Lesson Parts
                </p>
                {previewLoading || !previewLesson ? (
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 animate-pulse">
                        <div className="w-6 h-6 rounded-lg bg-slate-200" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-3/5 bg-slate-200 rounded-full" />
                          <div className="h-3 w-2/5 bg-slate-100 rounded-full" />
                        </div>
                        <div className="h-5 w-14 bg-slate-200 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {previewLesson.parts.map((part, idx) => (
                      <div
                        key={part.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5"
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {part.title || `Part ${idx + 1}`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {part.narration
                              ? `${Math.ceil(part.narration.length / 100)}s read`
                              : "No narration"}
                            {part.duration_seconds > 0 && (
                              <>
                                <span className="mx-1.5">·</span>
                                {part.duration_seconds}s display
                              </>
                            )}
                            {part.audio_url && (
                              <>
                                <span className="mx-1.5">·</span>
                                <span className="text-emerald-500">🔊 Audio</span>
                              </>
                            )}
                          </p>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          part.part_type === "quiz" ? "bg-amber-50 text-amber-600"
                          : part.part_type === "final_quiz" ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                        }`}>
                          {part.part_type === "content" ? "Content" : part.part_type === "final_quiz" ? "Final Quiz" : "Quiz"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 flex items-center justify-end">
              <button
                onClick={closePreview}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
