"use client";

import { useStudentDashboard } from "@/features/student/hooks";
import { StatsCard } from "@/components/shared";
import { Zap, BookOpen, Flame, Target } from "lucide-react";

export default function StudentDashboard() {
  const { data, loading } = useStudentDashboard();
  const stats = data?.student || { xp: 0, level: 1, streak: 0, totalLessonsCompleted: 0, averageScore: 0 };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl shadow-sm animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="XP Earned" value={stats.xp.toLocaleString()} change={12} icon={Zap} accentColor="#D4F542" />
        <StatsCard title="Lessons Done" value={stats.totalLessonsCompleted} icon={BookOpen} accentColor="#D4F542" />
        <StatsCard title="Current Streak" value={stats.streak} unit="days" icon={Flame} accentColor="#EF4444" />
        <StatsCard title="Learning Score" value={stats.averageScore || 0} unit="/ 100" icon={Target} accentColor="#A78BFA" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#18181B] mb-2">Welcome back! 🎉</h2>
          <p className="text-gray-500 text-sm mb-6">Continue your coding journey. You&apos;re doing great!</p>
          <div className="grid grid-cols-2 gap-4">
            <a href="/student/learn" className="block p-4 bg-[#D4F542]/10 rounded-xl hover:bg-[#D4F542]/20 transition-colors">
              <span className="text-lg">📚</span>
              <p className="text-sm font-semibold text-[#18181B] mt-1">Continue Learning</p>
              <p className="text-xs text-gray-500">Pick up where you left off</p>
            </a>
            <a href="/student/exercises" className="block p-4 bg-[#A78BFA]/10 rounded-xl hover:bg-[#A78BFA]/20 transition-colors">
              <span className="text-lg">💻</span>
              <p className="text-sm font-semibold text-[#18181B] mt-1">Practice Code</p>
              <p className="text-xs text-gray-500">Solve coding challenges</p>
            </a>
            <a href="/student/avatar-teacher" className="block p-4 bg-[#22C55E]/10 rounded-xl hover:bg-[#22C55E]/20 transition-colors">
              <span className="text-lg">🤖</span>
              <p className="text-sm font-semibold text-[#18181B] mt-1">Ask AI Teacher</p>
              <p className="text-xs text-gray-500">Get help from Nour</p>
            </a>
            <a href="/student/leaderboard" className="block p-4 bg-[#EF4444]/10 rounded-xl hover:bg-[#EF4444]/20 transition-colors">
              <span className="text-lg">🏆</span>
              <p className="text-sm font-semibold text-[#18181B] mt-1">Leaderboard</p>
              <p className="text-xs text-gray-500">See your ranking</p>
            </a>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#18181B] mb-4">Level Progress</h3>
          <div className="flex items-center justify-center mb-4">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#A78BFA" strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 50 * 0.35} ${2 * Math.PI * 50}`}
                strokeLinecap="round" transform="rotate(-90 60 60)" />
              <text x="60" y="55" textAnchor="middle" className="text-2xl font-bold fill-[#18181B]">{stats.level}</text>
              <text x="60" y="72" textAnchor="middle" className="text-xs fill-gray-400">Level</text>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">{stats.xp} / {stats.level * 100 + (stats.level - 1) * 50} XP</p>
            <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: "35%" }} />
            </div>
          </div>

          {/* Streak */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Streak</span>
              <span className="text-sm font-bold text-[#EF4444]">{stats.streak} days 🔥</span>
            </div>
            <div className="flex gap-1 mt-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                  i < stats.streak % 7 ? "bg-[#D4F542] text-[#18181B]" : "bg-gray-100 text-gray-400"
                }`}>{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-[#18181B] mb-4">Recent Activity</h3>
        {data?.recentSubmissions?.length > 0 ? (
          <div className="space-y-3">
            {data.recentSubmissions.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
                  s.status === "passed" ? "bg-green-100" : "bg-red-100"
                }`}>{s.status === "passed" ? "✅" : "❌"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#18181B] truncate">{s.exerciseId?.title || "Exercise"}</p>
                  <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${s.status === "passed" ? "text-green-600" : "text-red-600"}`}>
                  {s.score}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No activity yet. Start learning!</p>
        )}
      </div>
    </div>
  );
}
