"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchDashboard, deleteLesson, type DashboardParams } from "@/lib/api";
import type { DashboardResponse, DashboardLesson } from "@/lib/types";

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
function IconSend({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
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
    <main className="min-h-screen bg-white">

      {/* ── Compact Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-slate-100 px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <IconWhiteboard className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Visual Teaching AI</span>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <IconPlus className="w-3.5 h-3.5" />
            New Lesson
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ── "Ask me anything" input ──────────────────────────────────────── */}
        <div
          onClick={() => router.push("/upload")}
          className="mb-6 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition hover:border-blue-300 hover:bg-white hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <IconSend className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400">Ask me anything and I&apos;ll teach it to you visually...</p>
            </div>
            <span className="text-xs text-slate-300 hidden sm:block">Type a topic or upload a file</span>
          </div>
        </div>

        {/* ── Stats Row (compact) ─────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-5">
            <MiniStat label="Total" value={stats.total} />
            <MiniStat label="Ready" value={stats.ready} color="emerald" />
            <MiniStat label="Processing" value={stats.processing} color="amber" />
            <MiniStat label="Errors" value={stats.error} color="red" />
            <MiniStat label="Attempts" value={stats.totalAttempts} color="blue" className="hidden sm:block" />
            <MiniStat label="Avg Score" value={stats.avgScore != null ? `${stats.avgScore}%` : "\u2014"} color="purple" className="hidden sm:block" />
            <MiniStat label="Pass Rate" value={stats.passRate != null ? `${stats.passRate}%` : "\u2014"} color="teal" className="hidden sm:block" />
          </div>
        )}

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="error">Error</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-600" />
            <span className="ml-3 text-sm text-slate-500">Loading&hellip;</span>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-5">
            <IconAlert className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={loadDashboard} className="font-semibold underline underline-offset-2 hover:text-red-900 transition">
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────────────────── */}
        {!loading && !error && lessons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <IconBookOpen className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-medium mb-1 text-sm">
              {search || statusFilter ? "No lessons match your filters" : "No lessons yet"}
            </p>
            <p className="text-xs text-slate-400">
              {search || statusFilter
                ? "Try adjusting your search or filters."
                : "Type a topic above to generate your first lesson."}
            </p>
          </div>
        )}

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {!loading && !error && lessons.length > 0 && (
          <>
            {pagination && (
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">{pagination.total} lessons</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <div className="flex items-center justify-center gap-1.5 mt-6">
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
                    className={`min-w-[32px] h-8 text-xs font-medium rounded-lg border transition ${
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

// ─── Mini Stat ─────────────────────────────────────────────────────────────────

const miniStatColors: Record<string, string> = {
  slate: "text-slate-700",
  emerald: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  teal: "text-teal-600",
};

function MiniStat({ label, value, color = "slate", className = "" }: { label: string; value: string | number; color?: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 leading-none mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums leading-none ${miniStatColors[color] ?? miniStatColors.slate}`}>{value}</p>
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
      className={`relative rounded-xl border bg-white group transition-all ${
        lesson.status === "ready"
          ? "border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
          : "border-slate-100 cursor-default"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete lesson"
        className="absolute top-2 right-2 p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
      >
        <IconTrash />
      </button>

      <div className="p-4 pr-9">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-400">{date}</span>
        </div>

        <h3 className="font-medium text-slate-900 text-sm leading-5 mb-1 line-clamp-2">
          {lesson.title || "Untitled Lesson"}
        </h3>

        {lesson.subject && (
          <p className="text-[11px] text-slate-500 mb-1.5 truncate">{lesson.subject}</p>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5">
          <IconFile />
          <span className="truncate">{lesson.source_filename}</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {lesson.parts_count > 0 && <span>{lesson.parts_count} parts</span>}
          {lesson.total_lessons > 1 && (
            <span className="text-blue-500 font-medium">
              {lesson.lesson_index + 1} / {lesson.total_lessons}
            </span>
          )}
        </div>

        {lesson.status === "error" && lesson.error_message && (
          <p className="mt-2 text-[11px] text-red-600 bg-red-50 rounded-md p-1.5 line-clamp-2 leading-relaxed">
            {lesson.error_message}
          </p>
        )}

        {lesson.status === "processing" && (
          <div className="mt-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-200 border-t-amber-500 shrink-0" />
            <span className="text-[10px] text-amber-600 capitalize">{lesson.processing_step}</span>
          </div>
        )}
      </div>
    </div>
  );
}
