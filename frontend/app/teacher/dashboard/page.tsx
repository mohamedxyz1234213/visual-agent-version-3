"use client";

import { useTeacherDashboard } from "@/features/teacher/hooks";
import { StatsCard } from "@/components/shared";
import { Users, BookOpen, FileCheck, BarChart3 } from "lucide-react";

export default function TeacherDashboard() {
  const { data, loading } = useTeacherDashboard();
  const stats = data?.stats || { totalStudents: 0, totalLessons: 0, pendingSubmissions: 0, avgClassScore: 0 };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Students" value={stats.totalStudents} icon={Users} accentColor="#A78BFA" />
        <StatsCard title="My Lessons" value={stats.totalLessons} icon={BookOpen} accentColor="#A78BFA" />
        <StatsCard title="Pending Grading" value={stats.pendingSubmissions} icon={FileCheck} accentColor="#EF4444" />
        <StatsCard title="Avg Class Score" value={stats.avgClassScore} unit="/ 100" icon={BarChart3} accentColor="#A78BFA" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#18181B] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "📝", label: "Create Lesson", href: "/teacher/lessons" },
              { icon: "💻", label: "New Exercise", href: "/teacher/exercises" },
              { icon: "📋", label: "Create Exam", href: "/teacher/exams" },
              { icon: "👥", label: "My Classes", href: "/teacher/my-classes" },
            ].map((a) => (
              <a key={a.label} href={a.href}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-[#A78BFA]/10 transition-colors group">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#18181B]">{a.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#18181B] mb-4">Recent Lessons</h3>
          {data?.recentLessons?.length > 0 ? (
            <div className="space-y-2">
              {data.recentLessons.map((l) => (
                <div key={l._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${l.isPublished ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-sm text-[#18181B] truncate flex-1">{l.title}</span>
                  <span className="text-xs text-gray-500">{l.totalStudents || 0} students</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No lessons yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
