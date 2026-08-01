"use client";

import { useStudentDashboard } from "@/features/student/hooks";
import { StatsCard } from "@/components/shared";
import {
  IconZap,
  IconBook,
  IconFlame,
  IconTrending,
  IconCode,
  IconRobot,
  IconTrophy,
  IconCheck,
  IconX,
  IconClock,
  IconTarget,
  IconCrown,
  IconAward,
  IconSearch,
  IconMessage,
  IconTerminal,
  IconStar,
  IconCompass,
  IconPalette,
  IconChevronRight,
  IconUpload,
} from "@/components/shared/FluxIcons";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAdaptivePath } from "@/features/student/api";
import type { AdaptivePathResponse, AdaptiveRecommendation } from "@/features/student/types";
import { fetchDashboard } from "@/lib/api";
import type { DashboardLesson } from "@/lib/types";

interface ProgressBarItem { name: string; pct: number; color: string }
interface WeeklyEntry { day: number; count: number }

export default function StudentDashboard() {
  const { data, loading } = useStudentDashboard();

  // ── Hooks MUST be before any early return (React hook rule) ──────────────
  const [wbLessons, setWbLessons] = useState<DashboardLesson[]>([]);
  const [wbLoading, setWbLoading] = useState(true);

  useEffect(() => {
    fetchDashboard({ page: 1, limit: 4, sort: "recent", owner: "me" })
      .then((res) => setWbLessons(res.lessons))
      .catch(() => {})
      .finally(() => setWbLoading(false));
  }, []);

  const s = data?.student || {
    id: '',
    studentCode: '',
    xp: 0,
    level: 1,
    streak: 0,
    coins: 0,
    longestStreak: 0,
    totalLessonsCompleted: 0,
    averageScore: 0,
    totalExercisesCompleted: 0,
    totalTimeSpent: 0,
    status: 'active' as const,
    preferences: {
      language: 'en' as const,
      difficulty: 'beginner' as const,
      avatarVoice: false,
      avatarDialect: 'msa' as const,
    },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] bg-white rounded-[20px] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-[280px] bg-white rounded-[20px] animate-pulse" />
          <div className="lg:col-span-2 h-[280px] bg-white rounded-[20px] animate-pulse" />
        </div>
      </div>
    );
  }

  const progressBars: ProgressBarItem[] = (data?.progress || []).map((p: any, i: number) => ({
    name: p.subjectId?.name || `Subject ${i + 1}`,
    pct: p.completion || 0,
    color: p.subjectId?.color || ['#C4B5F5', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'][i % 6],
  }));

  // Weekly activity chart data from API
  const weeklyData: WeeklyEntry[] = data?.weeklyActivity || [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyHeights = days.map((_: string, i: number) => {
    const entry = weeklyData.find((w: WeeklyEntry) => w.day === i);
    return entry ? Math.min(entry.count * 10, 100) : 0;
  });
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  // ── Recent Whiteboard Lessons ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Student ID Banner */}
      <div className="flex flex-col gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#E5E5E5] sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D6F63E] flex items-center justify-center shrink-0">
            <IconTarget size={18} className="text-[#0F0F0F]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Student ID</p>
            <p className="text-lg font-bold text-[#0F0F0F] tracking-wider">{s.studentCode || '—'}</p>
          </div>
        </div>
        <div className="text-[11px] text-[#A0A0A0] sm:text-right">
          <p>Share this code with your teacher</p>
          <p className="text-[10px]">to connect to your class</p>
        </div>
      </div>

      {/* Row 1: 3 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatsCard
          title="XP Earned"
          value={s.xp.toLocaleString()}
          change={12}
          icon={<IconZap size={18} className="text-[#6B6B6B]" />}
        />
        <StatsCard
          title="Lessons Done"
          value={s.totalLessonsCompleted}
          icon={<IconBook size={18} className="text-[#6B6B6B]" />}
        />
        <StatsCard
          title="Current Streak"
          value={s.streak}
          unit="days"
          icon={<IconFlame size={18} className="text-[#6B6B6B]" />}
        />
      </div>

      {/* Row 2: Dark hero card + Supporting card */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Dark Hero Card — Learning Activity */}
        <div className="lg:col-span-3 flux-card-dark">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flux-icon-chip-dark">
                <IconTrending size={16} className="text-[#A0A0A0]" />
              </div>
              <span className="text-[15px] font-semibold">Learning Activity</span>
            </div>
            <button className="px-3 py-1.5 bg-[#2A2A2A] text-[#A0A0A0] text-[12px] font-medium rounded-pill flex items-center gap-1">
              Monthly
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div className="flex gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm bg-[#D6F63E]" />
                <span className="flux-stat-number-dark text-[28px]">
                  {s.totalLessonsCompleted}
                </span>
              </div>
              <span className="text-[13px] text-[#A0A0A0]">
                lessons completed
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm bg-[#C4B5F5]" />
                <span className="flux-stat-number-dark text-[28px]">
                  {s.averageScore}%
                </span>
              </div>
              <span className="text-[13px] text-[#A0A0A0]">average score</span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-2 h-[100px]">
            {days.map((day, i) => {
              const isToday = i === todayIdx;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full flex gap-0.5 items-end justify-center"
                    style={{ height: "80px" }}
                  >
                    <div
                      className={`w-[40%] rounded-t-[3px] transition-colors ${
                        isToday ? "bg-[#D6F63E]" : "bg-[#2A2A2A]"
                      }`}
                      style={{ height: `${weeklyHeights[i]}%` }}
                    />
                    <div
                      className={`w-[40%] rounded-t-[3px] transition-colors ${
                        isToday ? "bg-[#C4B5F5]" : "bg-[#2A2A2A]"
                      }`}
                      style={{ height: `${weeklyHeights[i] * 0.7}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      isToday ? "text-white" : "text-[#A0A0A0]"
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supporting card — Progress by Subject */}
        <div className="lg:col-span-2 flux-card">
          <h3 className="text-[15px] font-semibold text-[#0F0F0F] mb-5">
            Progress by Subject
          </h3>
          {progressBars.map((bar: ProgressBarItem, i: number) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[22px] font-bold text-[#0F0F0F]">
                  {bar.pct}%
                </span>
                <span className="text-[13px] font-medium text-[#6B6B6B]">
                  {bar.name}
                </span>
              </div>
              <div className="flux-progress-track">
                <div
                  style={{ width: `${bar.pct}%`, backgroundColor: bar.color, height: '100%', borderRadius: '6px', transition: 'all 0.4s ease' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Adaptive Learning Path */}
      <AdaptivePathSection />

      {/* Row 4: Quick Actions + Mini Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 flux-card">
          <h3 className="text-[15px] font-semibold text-[#0F0F0F] mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <IconCompass size={22} className="text-[#0F0F0F]" />,
                label: "Learn",
                href: "/student/learn",
              },
              {
                icon: <IconCode size={22} className="text-[#0F0F0F]" />,
                label: "Exercises",
                href: "/student/exercises",
              },
              {
                icon: <IconRobot size={22} className="text-[#0F0F0F]" />,
                label: "AI Teacher",
                href: "/student/avatar-teacher",
              },
              {
                icon: <IconTrophy size={22} className="text-[#0F0F0F]" />,
                label: "Leaderboard",
                href: "/student/leaderboard",
              },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex flex-col items-center gap-2 p-4 rounded-[16px] bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors"
              >
                {a.icon}
                <span className="text-[12px] font-semibold text-[#0F0F0F]">
                  {a.label}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flux-card">
          <h3 className="text-[15px] font-semibold text-[#0F0F0F] mb-4">
            Leaderboard Preview
          </h3>
          <LeaderboardPreview />
        </div>
      </div>

      {/* ── Row 5: Recent Whiteboard Lessons ───────────────────────────────── */}
      <div className="flux-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D6F63E] flex items-center justify-center">
              <IconPalette size={16} className="text-[#0F0F0F]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F0F0F]">My Whiteboard Lessons</h3>
          </div>
          <Link
            href="/student/whiteboard"
            className="text-xs font-semibold text-[#A78BFA] hover:text-[#7C3AED] transition-colors flex items-center gap-1"
          >
            View All <IconChevronRight size={14} />
          </Link>
        </div>

        {wbLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[120px] bg-[#F5F5F5] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : wbLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#A0A0A0] mb-3">
              <IconPalette size={24} />
            </div>
            <p className="text-sm font-medium text-[#0F0F0F] mb-1">No whiteboard lessons yet</p>
            <p className="text-xs text-[#6B6B6B] mb-3">Upload a document or type a topic to generate your first lesson.</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F0F0F] text-white rounded-xl text-xs font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              <IconUpload size={14} />
              Create Lesson
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {wbLessons.map((lesson) => (
              <DashboardLessonCard
                key={lesson.id}
                lesson={lesson}
                onDelete={async () => {
                  try {
                    const { deleteLesson } = await import("@/lib/api");
                    await deleteLesson(lesson.id);
                    setWbLessons((prev) => prev.filter((l) => l.id !== lesson.id));
                  } catch { /* ignore */ }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard Lesson Card ──────────────────────────────────────────────────────

const lessonStatusCfg: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  ready:      { dot: "bg-emerald-400",           text: "text-emerald-700", bg: "bg-emerald-50", label: "Ready"      },
  processing: { dot: "bg-amber-400 animate-pulse", text: "text-amber-700",  bg: "bg-amber-50",  label: "Processing" },
  error:      { dot: "bg-red-400",               text: "text-red-700",    bg: "bg-red-50",    label: "Error"      },
};

function DashboardLessonCard({ lesson, onDelete }: { lesson: DashboardLesson; onDelete: () => void }) {
  const router = useRouter();
  const cfg = lessonStatusCfg[lesson.status] ?? lessonStatusCfg.error;
  const date = new Date(lesson.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  function handleClick() {
    if (lesson.status !== "ready") return;
    const params = new URLSearchParams();
    if (lesson.series_id) params.set("series", lesson.series_id);
    if (lesson.total_lessons > 1) params.set("total", String(lesson.total_lessons));
    const qs = params.toString();
    router.push(`/lesson/${lesson.id}${qs ? `?${qs}` : ""}`);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this lesson?")) return;
    onDelete();
  }

  return (
    <div
      onClick={handleClick}
      className={`relative rounded-xl border p-3.5 transition-all group ${
        lesson.status === "ready"
          ? "border-[#E5E5E5] bg-white hover:border-[#A0A0A0] hover:shadow-sm cursor-pointer"
          : "border-[#E5E5E5] bg-white/80 cursor-default"
      }`}
    >
      <button
        onClick={handleDelete}
        title="Delete lesson"
        className="absolute top-2 right-2 p-1 rounded-md text-[#A0A0A0] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition z-10"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-3.5 h-3.5">
          <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 11v6M14 11v6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
          <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
        <span className="text-[10px] text-[#A0A0A0]">{date}</span>
      </div>
      <h4 className="text-xs font-semibold text-[#0F0F0F] leading-5 line-clamp-2 mb-1">
        {lesson.title || "Untitled Lesson"}
      </h4>
      {lesson.subject && (
        <p className="text-[10px] text-[#6B6B6B] truncate">{lesson.subject}</p>
      )}
      {lesson.status === "processing" && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="animate-spin rounded-full h-2 w-2 border-2 border-[#E5E5E5] border-t-amber-500" />
          <span className="text-[10px] text-amber-600 capitalize">{lesson.processing_step}</span>
        </div>
      )}
      {lesson.status === "error" && lesson.error_message && (
        <p className="mt-1.5 text-[10px] text-red-600 line-clamp-1">{lesson.error_message}</p>
      )}
    </div>
  );
}

// ── Adaptive Learning Path Section ────────────────────────────────────────────
function AdaptivePathSection() {
  const [adaptiveData, setAdaptiveData] = useState<AdaptivePathResponse | null>(null);
  const [adaptiveLoading, setAdaptiveLoading] = useState(true);

  useEffect(() => {
    getAdaptivePath()
      .then(setAdaptiveData)
      .catch(() => {})
      .finally(() => setAdaptiveLoading(false));
  }, []);

  if (adaptiveLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-5 h-[160px] bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!adaptiveData || !adaptiveData.profile?.completed) return null;

  const iconMap: Record<string, React.ReactNode> = {
    clock: <IconClock size={16} />,
    zap: <IconZap size={16} />,
    trending: <IconTrending size={16} />,
    eye: <IconCompass size={16} />,
    book: <IconBook size={16} />,
    code: <IconCode size={16} />,
    target: <IconTarget size={16} />,
    check: <IconCheck size={16} />,
    star: <IconStar size={16} />,
    search: <IconSearch size={16} />,
    message: <IconMessage size={16} />,
    terminal: <IconTerminal size={16} />,
  };

  return (
    <div className="flux-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <IconTarget size={18} className="text-[#0F0F0F]" />
            <h3 className="text-[15px] font-semibold text-[#0F0F0F]">My Adaptive Learning Path</h3>
          </div>
        </div>
        {adaptiveData.profile && (
          <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
            <span className="px-2 py-0.5 rounded-full bg-[#F5F5F5] capitalize">{adaptiveData.profile.learningStyle}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F5F5] capitalize">{adaptiveData.profile.pacing}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {adaptiveData.recommendations.slice(0, 4).map((rec: AdaptiveRecommendation, i: number) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors border border-[#E5E5E5]"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#6B6B6B]">
                {iconMap[rec.icon] || <IconStar size={16} />}
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-semibold text-[#0F0F0F]">{rec.title}</h4>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-relaxed">{rec.description}</p>
                <span className="text-[11px] font-semibold text-[#A78BFA] mt-1 block">
                  {rec.action} →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adaptiveData.weaknesses && adaptiveData.weaknesses.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E5E5E5]">
          <span className="text-[11px] text-[#6B6B6B]">Areas to improve:</span>
          {adaptiveData.weaknesses.slice(0, 3).map((w: string, i: number) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mini Leaderboard Preview ──────────────────────────────────────────────────
import { getLeaderboard } from "@/features/student/api";
import type { LeaderboardEntry } from "@/features/student/types";

function LeaderboardPreview() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard("xp", 5, "all-time")
      .then((res) => setEntries(res.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-[#F5F5F5] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <IconTrophy size={24} className="text-[#A0A0A0] mb-2" />
        <p className="text-xs text-[#6B6B6B]">No rankings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.slice(0, 5).map((entry, i) => (
        <a
          key={i}
          href="/student/leaderboard"
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F5F5F5] transition-colors group"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-[#D6F63E] text-[#0F0F0F]">
            {entry.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#0F0F0F] truncate">{entry.username}</span>
              {i === 0 && <IconCrown size={12} className="text-amber-500 shrink-0" />}
              {i === 1 && <IconAward size={12} className="text-slate-400 shrink-0" />}
              {i === 2 && <IconAward size={12} className="text-orange-600 shrink-0" />}
            </div>
          </div>
          <span className="text-xs font-bold text-[#6B6B6B]">
            {entry.xp.toLocaleString()} XP
          </span>
          <span className="text-[10px] text-[#A0A0A0] w-6 text-right">
            Lv.{entry.level}
          </span>
        </a>
      ))}
      <a
        href="/student/leaderboard"
        className="block text-center text-[11px] font-semibold text-[#A78BFA] hover:text-[#7C3AED] pt-2 transition-colors"
      >
        View full leaderboard →
      </a>
    </div>
  );
}
