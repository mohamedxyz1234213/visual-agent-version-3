"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IconLock, IconCheck, IconX, IconTrophy } from "@/components/shared/FluxIcons";

export default function ChildDashboardPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("parentToken");
    if (!token) return setLoading(false);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://backend-teaching.vercel.app/api/v1"}/parent/child/${studentId}/progress?token=${token}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-[#22C55E] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm text-center max-w-lg mx-auto mt-12">
        <span className="block mb-4"><IconLock size={36} className="mx-auto text-gray-300" /></span>
        <h3 className="text-lg font-semibold text-[#18181B] mb-2">Access Required</h3>
        <p className="text-gray-500 text-sm">Please search for your child first using the parent portal.</p>
        <a href="/parent/search" className="inline-block mt-4 px-6 py-3 bg-[#22C55E] text-white rounded-xl font-semibold text-sm hover:bg-[#16a34a] transition-colors">
          Search Again
        </a>
      </div>
    );
  }

  const s = data.student || {};

  return (
    <div className="space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#22C55E] flex items-center justify-center text-xl font-bold text-white">
            {s.username?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#18181B]">{s.username}</h2>
            <p className="text-sm text-gray-500">Code: {s.code}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "XP Earned", value: s.xp || 0, color: "#D4F542" },
          { label: "Level", value: s.level || 1, color: "#A78BFA" },
          { label: "Streak", value: `${s.streak || 0} days`, color: "#EF4444" },
          { label: "Avg Score", value: `${s.averageScore || 0}%`, color: "#22C55E" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress by Subject */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#18181B] mb-4">Subject Progress</h3>
          {data.progress?.length > 0 ? (
            <div className="space-y-4">
              {data.progress.map((p: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{p.subjectId?.name || "Subject"}</span>
                    <span className="text-sm font-semibold text-[#18181B]">{p.overallCompletion}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.overallCompletion}%`, backgroundColor: p.subjectId?.color || "#D4F542" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No subject data yet</p>
          )}
        </div>

        {/* Consistency Score */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#18181B] mb-4">Consistency (30 days)</h3>
          <div className="flex items-center justify-center mb-4">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#22C55E" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40 * (data.consistencyScore || 0) / 100} ${2 * Math.PI * 40}`}
                strokeLinecap="round" transform="rotate(-90 50 50)" />
              <text x="50" y="45" textAnchor="middle" className="text-lg font-bold fill-[#18181B]">{data.consistencyScore || 0}%</text>
              <text x="50" y="60" textAnchor="middle" className="text-xs fill-gray-400">active days</text>
            </svg>
          </div>
          <div className="text-center text-sm text-gray-500">
            {Math.round((data.consistencyScore || 0) / 100 * 30)} out of 30 days
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-[#18181B] mb-4">Recent Activity</h3>
        {data.recentSubmissions?.length > 0 ? (
          <div className="space-y-2">
            {data.recentSubmissions.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.status === "passed" ? "bg-green-100" : "bg-red-100"}`}>
                  {s.status === "passed" ? <IconCheck size={16} className="text-green-600" /> : <IconX size={16} className="text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#18181B] truncate">{s.exerciseId?.title || "Exercise"}</p>
                  <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${s.status === "passed" ? "text-green-600" : "text-red-600"}`}>{s.score}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
        )}
      </div>

      {/* Achievements */}
      {data.achievements?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-[#18181B] mb-4">Recent Achievements</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.achievements.map((a: any, i: number) => (
              <div key={i} className="flex-shrink-0 bg-[#D4F542]/10 rounded-xl p-4 text-center w-28">
                <span className="block mb-1"><IconTrophy size={24} className="mx-auto text-[#18181B]" /></span>
                <p className="text-xs font-semibold text-[#18181B]">{a.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
