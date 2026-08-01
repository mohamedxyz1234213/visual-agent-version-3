"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchDashboard, deleteLesson, type DashboardParams } from "@/lib/api";
import type { DashboardResponse, DashboardLesson } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

// ─── SVG Icon set ─────────────────────────────────────────────────────────────

function IconWhiteboard({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function IconSearch({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}
function IconTrash({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}
function IconFile({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconPlus({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" stroke="currentColor" className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconChevronLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBookOpen({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconAlert({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "title">("recent");
  const [page, setPage] = useState(1);
  const limit = 12;




  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: DashboardParams = { page, limit, sort };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const result = await fetchDashboard(params);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sort]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleDelete(lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    deleteLesson(lessonId).then(() => loadDashboard()).catch(() => {});
  }

  function handleLessonClick(lesson: DashboardLesson) {
    if (lesson.status !== "ready") return;
    const params = new URLSearchParams();
    if (lesson.series_id) params.set("series", lesson.series_id);
    if (lesson.total_lessons > 1) params.set("total", String(lesson.total_lessons));
    const qs = params.toString();
    router.push(`/lesson/${lesson.id}${qs ? `?${qs}` : ""}`);
  }

  const stats = data?.stats;
  const lessons = data?.lessons ?? [];
  const pagination = data?.pagination;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shrink-0 shadow-sm">
            <IconWhiteboard className="w-4 h-4" />
          </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Whiteboard Classroom</div>
              <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">Lesson library</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs">
                <span className="text-slate-400">AI lessons</span>
                <span className="font-semibold text-slate-800 tabular-nums">{user.ai_requests_used} / {user.max_ai_requests}</span>
              </div>
            )}
            <button
              onClick={() => router.push("/upload")}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 sm:px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <IconPlus />
              <span className="hidden sm:inline">New Lesson</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {user && user.max_ai_requests > 0 && user.ai_requests_used >= user.max_ai_requests && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            <IconAlert className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              You have used all {user.max_ai_requests} of your AI lesson generations. Contact the admin to raise your limit.
            </span>
          </div>
        )}
        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Lesson Library</p>
            <h1 className="app-display mt-2 text-4xl font-semibold text-slate-900 sm:text-5xl">Everything stays organized around the lesson.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Open ready lessons, keep an eye on processing, and return to any series without hunting through the interface.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Quick Start</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Ready lessons open immediately. Processing lessons stay visible here so it is easy to come back when the next one finishes.
            </p>
          </div>
        </div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <StatCard label="Total" value={stats.total} color="slate" />
            <StatCard label="Ready" value={stats.ready} color="green" />
            <StatCard label="Processing" value={stats.processing} color="amber" />
            <StatCard label="Errors" value={stats.error} color="red" />
            <StatCard label="Quiz Attempts" value={stats.totalAttempts} color="blue" />
            <StatCard label="Avg Score" value={stats.avgScore != null ? `${stats.avgScore}%` : "—"} color="purple" />
            <StatCard label="Pass Rate" value={stats.passRate != null ? `${stats.passRate}%` : "—"} color="teal" />
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="mb-6 rounded-[28px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Search by title, subject, or filename…"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="error">Error</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title</option>
          </select>
          </div>
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-200 border-t-blue-600" />
            <span className="ml-3 text-sm text-slate-500">Loading…</span>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
            <IconAlert className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={loadDashboard} className="font-semibold underline underline-offset-2 hover:text-red-900 transition">
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────────────────── */}
        {!loading && !error && lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <IconBookOpen className="w-7 h-7" />
            </div>
            <p className="text-slate-600 font-medium mb-1">
              {search || statusFilter ? "No lessons match your filters" : "No lessons yet"}
            </p>
            <p className="text-sm text-slate-400">
              {search || statusFilter
                ? "Try adjusting your search or filters."
                : "Upload a document or type a topic to generate your first lesson."}
            </p>
          </div>
        )}

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {!loading && !error && lessons.length > 0 && (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">Lessons</h2>
                <p className="text-sm text-slate-500">Browse what is ready, what is still processing, and what needs attention.</p>
              </div>
              {pagination && (
                <div className="text-sm text-slate-400">{pagination.total} total lessons</div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
              {lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => handleLessonClick(lesson)}
                  onDelete={() => handleDelete(lesson.id)}
                />
              ))}
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconChevronLeft />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[36px] h-9 text-sm font-medium rounded-lg border transition ${
                      p === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IconChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const statColors: Record<string, string> = {
  slate:  "bg-white border-slate-200 text-slate-700",
  green:  "bg-emerald-50 border-emerald-200 text-emerald-800",
  amber:  "bg-amber-50 border-amber-200 text-amber-800",
  red:    "bg-red-50 border-red-200 text-red-800",
  blue:   "bg-blue-50 border-blue-200 text-blue-800",
  purple: "bg-purple-50 border-purple-200 text-purple-800",
  teal:   "bg-teal-50 border-teal-200 text-teal-800",
};

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-[24px] border px-4 py-4 shadow-sm ${statColors[color] ?? statColors.slate}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1.5 leading-none">{label}</p>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
    </div>
  );
}

// ─── Lesson Card ───────────────────────────────────────────────────────────────

const statusCfg: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  ready:      { dot: "bg-emerald-400",            text: "text-emerald-700", bg: "bg-emerald-50", label: "Ready"      },
  processing: { dot: "bg-amber-400 animate-pulse", text: "text-amber-700",  bg: "bg-amber-50",  label: "Processing" },
  error:      { dot: "bg-red-400",                text: "text-red-700",    bg: "bg-red-50",    label: "Error"      },
};

function LessonCard({ lesson, onClick, onDelete }: {
  lesson: DashboardLesson; onClick: () => void; onDelete: () => void;
}) {
  const cfg = statusCfg[lesson.status] ?? statusCfg.error;
  const date = new Date(lesson.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      onClick={onClick}
      className={`relative rounded-[26px] border bg-white/95 group shadow-sm transition-all ${
        lesson.status === "ready"
          ? "border-slate-200 hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-[0_18px_42px_rgba(15,23,42,0.08)] cursor-pointer"
          : "border-slate-100 cursor-default"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete lesson"
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
      >
        <IconTrash />
      </button>

      <div className="p-5 pr-10">
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-[11px] text-slate-400">{date}</span>
        </div>

        <h3 className="font-semibold text-slate-900 text-[15px] leading-6 tracking-[-0.025em] mb-1.5 line-clamp-2">
          {lesson.title || "Untitled Lesson"}
        </h3>

        {lesson.subject && (
          <p className="text-xs text-slate-500 mb-2 truncate">{lesson.subject}</p>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
          <IconFile />
          <span className="truncate">{lesson.source_filename}</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {lesson.parts_count > 0 && <span>{lesson.parts_count} parts</span>}
          {lesson.total_lessons > 1 && (
            <span className="text-indigo-500 font-medium">
              {lesson.lesson_index + 1} / {lesson.total_lessons}
            </span>
          )}
        </div>

        {lesson.status === "error" && lesson.error_message && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg p-2 line-clamp-2 leading-relaxed">
            {lesson.error_message}
          </p>
        )}

        {lesson.status === "processing" && (
          <div className="mt-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-200 border-t-amber-500 shrink-0" />
            <span className="text-[11px] text-amber-600 capitalize">{lesson.processing_step}</span>
          </div>
        )}
      </div>
    </div>
  );
}