"use client";

import { useEffect, useState } from "react";
import { IconUsers, IconFlame } from "@/components/shared/FluxIcons";

export default function MyClassesPage() {
  const [classes, setClasses] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/teacher/classes`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setClasses(d.classes || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalStudents = Object.values(classes).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">My Classes</h2>
        <p className="text-sm text-gray-500 mt-1">{totalStudents} students across {Object.keys(classes).length} classes</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="h-40 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : Object.keys(classes).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconUsers size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No classes assigned</h3>
          <p className="text-gray-500 text-sm">Ask an admin to assign students to your classes.</p>
        </div>
      ) : (
        Object.entries(classes).map(([yearName, students]) => (
          <div key={yearName} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-[#18181B]">{yearName}</h3>
              <span className="text-sm text-gray-500">{students.length} students</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-6 py-2 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-right px-6 py-2 text-xs font-semibold text-gray-500 uppercase">XP</th>
                  <th className="text-right px-6 py-2 text-xs font-semibold text-gray-500 uppercase">Level</th>
                  <th className="text-right px-6 py-2 text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="text-right px-6 py-2 text-xs font-semibold text-gray-500 uppercase">Streak</th>
                  <th className="text-right px-6 py-2 text-xs font-semibold text-gray-500 uppercase">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {students.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0)).map((s: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4F542] flex items-center justify-center text-xs font-bold text-[#18181B]">
                          {s.username?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#18181B]">{s.username}</p>
                          <p className="text-xs text-gray-400">{s.studentCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-[#18181B]">{(s.xp || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="px-2 py-0.5 bg-[#A78BFA]/20 text-xs font-semibold rounded-full">{s.level || 1}</span>
                    </td>
                    <td className="px-6 py-3 text-right text-sm">{s.averageScore || 0}%</td>
                    <td className="px-6 py-3 text-right text-sm">
                      <span className="inline-flex items-center gap-1">{s.streak || 0}<IconFlame size={14} className="text-orange-400" /></span>
                    </td>
                    <td className="px-6 py-3 text-right text-xs text-gray-500">
                      {s.lastActivityDate ? new Date(s.lastActivityDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
