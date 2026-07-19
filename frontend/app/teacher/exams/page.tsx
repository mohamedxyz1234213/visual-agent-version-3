"use client";

import { useTeacherExams } from "@/features/teacher/hooks";

export default function TeacherExamsPage() {
  const { exams, loading } = useTeacherExams();
  const typeColors: Record<string, string> = { quiz: "bg-blue-100 text-blue-700", midterm: "bg-amber-100 text-amber-700", final: "bg-red-100 text-red-700", practice: "bg-green-100 text-green-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">Exams</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage exams and quizzes</p>
        </div>
        <button className="px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors">+ New Exam</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <span className="text-4xl block mb-4">📋</span>
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exams yet</h3>
          <p className="text-gray-500 text-sm">Create your first exam to assess student learning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam._id} className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#18181B] truncate">{exam.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[exam.type] || "bg-gray-100 text-gray-600"}`}>{exam.type}</span>
                </div>
                <p className="text-xs text-gray-500">{exam.questions?.length || 0} questions · {exam.duration} min · {exam.totalPoints} pts</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${exam.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {exam.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
