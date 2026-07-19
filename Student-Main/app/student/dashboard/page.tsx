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
} from "@/components/shared/FluxIcons";

export default function StudentDashboard() {
  const { data, loading } = useStudentDashboard();
  const s = data?.student || {
    xp: 0,
    level: 1,
    streak: 0,
    totalLessonsCompleted: 0,
    averageScore: 0,
    totalExercisesCompleted: 0,
    totalTimeSpent: 0,
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

  const progressBars = [
    {
      name: "Python",
      pct: data?.progress?.[0]?.completion || 45,
      colorClass: "flux-progress-lavender",
    },
    {
      name: "JavaScript",
      pct: data?.progress?.[1]?.completion || 30,
      colorClass: "flux-progress-dark",
    },
    {
      name: "C++",
      pct: data?.progress?.[2]?.completion || 25,
      colorClass: "flux-progress-lime",
    },
  ];

  const weeklyHeights = [40, 65, 30, 80, 55, 70, 45];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="space-y-4">
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
          {progressBars.map((bar, i) => (
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
                  className={bar.colorClass}
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Quick Actions + Recent Activity */}
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
            Recent Activity
          </h3>
          {data?.recentSubmissions?.length > 0 ? (
            <div className="space-y-2.5">
              {data.recentSubmissions.slice(0, 4).map((sub: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#F5F5F5]"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      sub.status === "passed"
                        ? "bg-[#D6F63E]"
                        : "bg-[#E5E5E5]"
                    }`}
                  >
                    {sub.status === "passed" ? (
                      <IconCheck size={12} className="text-[#0F0F0F]" />
                    ) : (
                      <IconX size={12} className="text-[#6B6B6B]" />
                    )}
                  </div>
                  <span className="text-[13px] font-medium text-[#0F0F0F] truncate flex-1">
                    {sub.exerciseId?.title || "Exercise"}
                  </span>
                  <span className="text-[13px] font-bold text-[#0F0F0F]">
                    {sub.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-3">
                <IconTarget size={20} className="text-[#6B6B6B]" />
              </div>
              <p className="text-[13px] text-[#6B6B6B]">
                No activity yet. Start learning!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
