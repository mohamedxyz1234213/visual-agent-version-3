"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateAILesson } from "@/features/teacher/api";
import { fetchDashboard, pollUploadStatus } from "@/lib/api";
import type { DashboardLesson } from "@/lib/types";
import {
  IconRobot,
  IconBook,
  IconCode,
  IconCheck,
  IconX,
  IconFileText,
  IconStar,
  IconZap,
  IconClock,
  IconTarget,
  IconPalette,
  IconChevronRight,

} from "@/components/shared/FluxIcons";

// ── Generation progress steps ───────────────────────────────────────────────────
const PROGRESS_STEPS: Record<string, { label: string; pct: number }> = {
  queued:          { label: "Queued...",               pct: 5 },
  planning_outline:  { label: "Planning lesson structure...", pct: 25 },
  planning:        { label: "Planning lesson structure...", pct: 25 },
  extracting:      { label: "Planning lesson structure...", pct: 25 },
  uploading:       { label: "Planning lesson structure...", pct: 25 },
  saving:          { label: "Creating scenes and content...", pct: 50 },
  finalizing:      { label: "Adding narration and audio...",  pct: 80 },
  done:            { label: "✅ Lesson ready!",              pct: 100 },
};

// ── Subjects (same as before) ────────────────────────────────────────────────────
const SUBJECTS = [
  { _id: "js", name: "JavaScript", color: "#F7DF1E" },
  { _id: "python", name: "Python", color: "#3776AB" },
  { _id: "html", name: "HTML/CSS", color: "#E34F26" },
  { _id: "react", name: "React", color: "#61DAFB" },
  { _id: "node", name: "Node.js", color: "#339933" },
  { _id: "algo", name: "Algorithms", color: "#8B5CF6" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", desc: "No prior knowledge needed" },
  { value: "intermediate", label: "Intermediate", desc: "Basic concepts known" },
  { value: "advanced", label: "Advanced", desc: "Deep dive with complex topics" },
];

const STYLES = [
  { value: "explain", label: "Explain", desc: "Concept-focused with theory" },
  { value: "practical", label: "Practical", desc: "Hands-on coding exercises" },
  { value: "exam-prep", label: "Exam Prep", desc: "Test-focused with quizzes" },
  { value: "project", label: "Project-Based", desc: "Build a complete project" },
];

const DURATIONS = [15, 30, 45, 60, 90];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AILessonsPage() {
  const router = useRouter();

  // ── Generation form state ─────────────────────────────────────────────────────
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState("explain");

  // ── Generation progress state ─────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [genLessonId, setGenLessonId] = useState<string | null>(null);
  const [genStep, setGenStep] = useState<string>("queued");
  const [genError, setGenError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Lessons list state ────────────────────────────────────────────────────────
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [tab, setTab] = useState<"generate" | "mylessons">("generate");

  // Fetch teacher's whiteboard lessons
  const loadLessons = useCallback(async () => {
    setLessonsLoading(true);
    try {
      const data = await fetchDashboard({ limit: 50, sort: "recent" });
      setLessons(data.lessons || []);
    } catch { /* ignore */ } finally {
      setLessonsLoading(false);
    }
  }, []);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  // ── Generate handler ──────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenError(null);
    setGenLessonId(null);
    setGenStep("queued");

    try {
      const res = await generateAILesson(topic.trim(), subjectId || undefined, difficulty, duration, style);
      setGenLessonId(res.id);
    } catch (err: any) {
      setGenError(err.message || "Failed to start lesson generation");
      setGenerating(false);
    }
  }, [topic, subjectId, difficulty, duration, style]);

  // ── Poll for status when a lesson is being generated ──────────────────────────
  useEffect(() => {
    if (!genLessonId) return;

    pollRef.current = setInterval(async () => {
      try {
        const status = await pollUploadStatus(genLessonId);
        const step = status.processing_step || "queued";
        setGenStep(step);

        if (status.status === "ready" || step === "done") {
          setGenStep("done");
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          loadLessons(); // Refresh the lessons list
        } else if (status.status === "error") {
          setGenError(status.error_message || "Lesson generation failed");
          setGenerating(false);
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // Still starting up — keep polling
      }
    }, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [genLessonId, loadLessons]);

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const progressInfo = PROGRESS_STEPS[genStep] || PROGRESS_STEPS.queued;
  const progressPct = progressInfo.pct;

  function handleViewLesson(id: string) {
    router.push(`/lesson/${id}`);
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    try {
      const { deleteLesson } = await import("@/lib/api");
      await deleteLesson(id);
      loadLessons();
    } catch { /* ignore */ }
  }

  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F0F0F]">AI Lessons</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Generate animated whiteboard lessons for your students
          </p>
        </div>
      </div>

      {/* ── Tab bar: Generate / My Lessons ──────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F5F5F5] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("generate")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "generate"
              ? "bg-white text-[#0F0F0F] shadow-sm"
              : "text-[#6B6B6B] hover:text-[#0F0F0F]"
          }`}
        >
          <IconRobot size={16} className="inline mr-1.5" />
          Generate Lesson
        </button>
        <button
          onClick={() => setTab("mylessons")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "mylessons"
              ? "bg-white text-[#0F0F0F] shadow-sm"
              : "text-[#6B6B6B] hover:text-[#0F0F0F]"
          }`}
        >
          <IconBook size={16} className="inline mr-1.5" />
          My Lessons ({lessons.length})
        </button>
      </div>

      {tab === "generate" ? (
        /* ════════════════════════════════════════════════════════════════════
           GENERATE TAB
           ════════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-5 gap-6">
          {/* ── Left Panel: Form ────────────────────────────────────────── */}
          <div className="col-span-2 space-y-4">
            {/* Topic */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
                Lesson Topic
              </label>
              <div className="relative">
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="e.g., JavaScript Closures, Photosynthesis, World War II..."
                  className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm text-[#0F0F0F] placeholder-[#A0A0A0] focus:border-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#0F0F0F]/10 transition-all pr-10"
                />
                {topic && (
                  <button
                    onClick={() => setTopic("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#0F0F0F]"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
                Subject (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSubjectId("")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    !subjectId
                      ? "bg-[#0F0F0F] text-white"
                      : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                  }`}
                >
                  Any
                </button>
                {SUBJECTS.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => setSubjectId(s._id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      subjectId === s._id
                        ? "bg-[#0F0F0F] text-white"
                        : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty + Duration + Style (compact) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5] space-y-4">
              {/* Difficulty */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                        difficulty === d.value
                          ? "bg-[#D6F63E] text-[#0F0F0F]"
                          : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                      }`}
                    >
                      <span className="block">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Duration */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">Duration (min)</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        duration === d
                          ? "bg-[#0F0F0F] text-white"
                          : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              {/* Style */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">Teaching Style</label>
                <div className="flex gap-1.5 flex-wrap">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        style === s.value
                          ? "bg-[#D6F63E] text-[#0F0F0F]"
                          : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="w-full py-3.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <IconRobot size={18} />
                  Generate Lesson with AI
                </>
              )}
            </button>

            {/* Error */}
            {genError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-start gap-2.5">
                <IconX size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span>{genError}</span>
              </div>
            )}
          </div>

          {/* ── Right Panel: Progress / Empty state ───────────────────────── */}
          <div className="col-span-3">
            {generating || genLessonId ? (
              /* ── Progress Card ─────────────────────────────────────────── */
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-8 flex flex-col items-center text-center">
                <div className="w-full max-w-md">
                  <h3 className="text-lg font-semibold text-[#0F0F0F] mb-2">Generating Your Lesson</h3>
                  <p className="text-sm text-[#6B6B6B] mb-6">
                    This usually takes 30–90 seconds. We&apos;ll update you at every step.
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-[#F5F5F5] rounded-full h-3 mb-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F0F0F] transition-all duration-700 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Current step label */}
                  <p className="text-sm font-semibold text-[#0F0F0F] mb-6">
                    {progressInfo.label}
                  </p>

                  {/* Step indicators */}
                  <div className="flex items-center justify-between">
                    {["planning_outline", "saving", "finalizing", "done"].map((step, i) => {
                      const stepInfo = PROGRESS_STEPS[step];
                      const isActive = genStep === step || 
                        (step === "done" ? genStep === "done" : 
                         Object.keys(PROGRESS_STEPS).indexOf(genStep) >= Object.keys(PROGRESS_STEPS).indexOf(step));
                      const isCurrent = genStep === step;
                      return (
                        <div key={step} className="flex flex-col items-center gap-1.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isActive
                                ? isCurrent
                                  ? "bg-[#D6F63E] text-[#0F0F0F] ring-2 ring-[#D6F63E]/40"
                                  : "bg-[#D6F63E] text-[#0F0F0F]"
                                : "bg-[#F5F5F5] text-[#A0A0A0]"
                            }`}
                          >
                            {isActive && step !== "done" ? (
                              <IconCheck size={14} />
                            ) : step === "done" && isActive ? (
                              <IconCheck size={14} />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <span className={`text-[10px] font-medium ${
                            isActive ? "text-[#0F0F0F]" : "text-[#A0A0A0]"
                          }`}>
                            {step === "planning_outline" ? "Plan" :
                             step === "saving" ? "Content" :
                             step === "finalizing" ? "Audio" : "Ready"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Empty Placeholder ─────────────────────────────────────── */
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-12 flex flex-col items-center justify-center text-center min-h-[450px]">
                <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-4">
                  <IconRobot size={32} className="text-[#A0A0A0]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F0F0F] mb-2">Ready to Generate a Lesson</h3>
                <p className="text-sm text-[#6B6B6B] max-w-sm">
                  Fill in the topic and options on the left, then click{" "}
                  <span className="font-semibold text-[#0F0F0F]">Generate</span> to create your
                  AI-powered whiteboard lesson with animated scenes, narration, and audio.
                </p>
                <div className="flex items-center gap-6 mt-6 text-[11px] text-[#A0A0A0]">
                  <span className="flex items-center gap-1.5"><IconPalette size={14} /> Animated whiteboard</span>
                  <span className="flex items-center gap-1.5"><IconFileText size={14} /> Auto narration</span>
                  <span className="flex items-center gap-1.5"><IconStar size={14} /> Quiz included</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════
           MY LESSONS TAB
           ════════════════════════════════════════════════════════════════════ */
        <div>
          {lessonsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[88px] bg-white rounded-2xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-[#E5E5E5] text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                <IconFileText size={28} className="text-[#A0A0A0]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F0F0F] mb-2">No Lessons Yet</h3>
              <p className="text-sm text-[#6B6B6B] mb-4">
                Switch to the Generate tab and create your first AI-powered lesson.
              </p>
              <button
                onClick={() => setTab("generate")}
                className="px-5 py-2.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors inline-flex items-center gap-2"
              >
                <IconRobot size={16} />
                Generate a Lesson
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-[#E5E5E5] hover:border-[#A0A0A0] transition-all group cursor-pointer"
                  onClick={() => handleViewLesson(lesson.id)}
                >
                  {/* Status dot */}
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

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#0F0F0F] truncate">
                      {lesson.title || "Untitled Lesson"}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-[#6B6B6B]">
                      <span>{dateStr(lesson.created_at)}</span>
                      {lesson.subject && (
                        <>
                          <span>·</span>
                          <span>{lesson.subject}</span>
                        </>
                      )}
                      {lesson.parts_count > 0 && (
                        <>
                          <span>·</span>
                          <span>{lesson.parts_count} parts</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                    lesson.status === "ready"
                      ? "bg-emerald-100 text-emerald-700"
                      : lesson.status === "processing"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {lesson.status === "ready" ? "Ready" : lesson.status === "processing" ? "Processing" : "Error"}
                  </span>

                  {/* Processing step */}
                  {lesson.status === "processing" && lesson.processing_step && (
                    <span className="shrink-0 text-xs text-amber-600 italic">{lesson.processing_step.replace(/_/g, " ")}</span>
                  )}

                  {/* View arrow */}
                  <IconChevronRight size={16} className="shrink-0 text-[#A0A0A0] group-hover:text-[#0F0F0F] transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
