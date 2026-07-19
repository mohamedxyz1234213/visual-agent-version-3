"use client";

import { useEffect, useState } from "react";
import { IconCheck } from "@/components/shared/FluxIcons";

export default function TeacherSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/teacher/submissions`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setSubmissions(d.submissions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    passed: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700",
    partial: "bg-amber-100 text-amber-700", pending: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Submissions</h2>
        <p className="text-sm text-gray-500 mt-1">Review and grade student submissions</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconCheck size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No submissions yet</h3>
          <p className="text-gray-500 text-sm">Submissions will appear here when students complete exercises.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Exercise</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s: any) => (
                <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-[#18181B]">{s.studentId?.studentCode || "—"}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{s.exerciseId?.title || "—"}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-[#18181B]">{s.score}%</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[s.status] || ""}`}>{s.status}</span>
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
