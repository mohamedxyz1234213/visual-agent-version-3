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
} from "@/components/shared/FluxIcons";
import { useState, useEffect } from "react";
import { getAdaptivePath } from "@/features/student/api";
import type { AdaptivePathResponse, AdaptiveRecommendation } from "@/features/student/types";

export default function StudentDashboard() {
  const { data, loading } = useStudentDashboard();
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
      theme: 'light' as const,
    },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] bg-white rounded-[20px] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 h-[280px] bg-white rounded-[20px] animate-pulse" />
          <div className="col-span-2 h-[280px] bg-white rounded-[20px] animate-pulse" />
        </div>
      </div>
    );
  }

  interface ProgressBarItem { name: string; pct: number; color: string }
  interface WeeklyEntry { day: number; count: number }

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

  return (
    <div className="space-y-4">
      {/* Student ID Banner */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 shadow-sm border border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D6F63E] flex items-center justify-center">
            <IconTarget size={18} className="text-[#0F0F0F]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Student ID</p>
            <p className="text-lg font-bold text-[#0F0F0F] tracking-wider">{s.studentCode || '—'}</p>
          </div>
        </div>
        <div className="text-[11px] text-[#A0A0A0] text-right">
          <p>Share this code with your teacher</p>
          <p className="text-[10px]">to connect to your class</p>
        </div>
      </div>

      {/* Row 1: 3 stat cards */}
      <div className="grid grid-cols-3 gap-4">
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
      <div className="grid grid-cols-5 gap-4">
        {/* Dark Hero Card — Learning Activity */}
        <div className="col-span-3 flux-card-dark">
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
        <div className="col-span-2 flux-card">
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
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 flux-card">
          <h3 className="text-[15px] font-semibold text-[#0F0F0F] mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                icon: <IconBook size={22} className="text-[#0F0F0F]" />,
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

        <div className="col-span-2 flux-card">
          <h3 className="text-[15px] font-semibold text-[#0F0F0F] mb-4">
            Leaderboard Preview
          </h3>
          <LeaderboardPreview />
        </div>
      </div>
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
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-5 h-[160px] bg-white rounded-2xl animate-pulse" />
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
