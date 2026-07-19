"use client";

import { useEffect, useState } from "react";
import { IconChart, IconFlame } from "@/components/shared/FluxIcons";

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use first available class for demo
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/teacher/classes`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const classes = d.classes || {};
        const firstClassKey = Object.keys(classes)[0];
        if (firstClassKey && classes[firstClassKey]?.length > 0) {
          setData({ students: classes[firstClassKey], className: firstClassKey });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Track class performance and student progress</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />)}
          </div>
        </div>
      ) : !data?.students?.length ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconChart size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No class data</h3>
          <p className="text-gray-500 text-sm">Assign students to your classes to see analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-[#A78BFA]">{data.students.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">Avg XP</p>
              <p className="text-2xl font-bold text-[#D4F542]">
                {Math.round(data.students.reduce((sum: number, s: any) => sum + (s.xp || 0), 0) / data.students.length)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-[#22C55E]">
                {Math.round(data.students.reduce((sum: number, s: any) => sum + (s.averageScore || 0), 0) / data.students.length)}%
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <p className="text-xs text-gray-500 mb-1">Active Streaks</p>
              <p className="text-2xl font-bold text-[#EF4444]">
                {data.students.filter((s: any) => (s.streak || 0) > 0).length}
              </p>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">XP</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Level</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Score</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Streak</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Lessons</th>
                </tr>
              </thead>
              <tbody>
                {data.students.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0)).map((s: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#A78BFA] flex items-center justify-center text-xs font-bold text-white">
                          {s.username?.[0]?.toUpperCase() || "S"}
                        </div>
                        <span className="text-sm font-medium text-[#18181B]">{s.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#18181B]">{(s.xp || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="px-2 py-0.5 bg-[#A78BFA]/20 text-xs font-semibold rounded-full text-[#18181B]">Lv.{s.level || 1}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-[#18181B]">{s.averageScore || 0}%</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600"><span className="inline-flex items-center gap-1">{s.streak || 0}<IconFlame size={14} className="text-orange-400" /></span></td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600">{s.totalLessonsCompleted || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
