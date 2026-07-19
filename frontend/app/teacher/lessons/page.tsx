"use client";

import { useTeacherLessons } from "@/features/teacher/hooks";

export default function TeacherLessonsPage() {
  const { lessons, loading } = useTeacherLessons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">My Lessons</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage your coding lessons</p>
        </div>
        <button className="px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors">
          + New Lesson
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <span className="text-4xl block mb-4">📝</span>
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No lessons yet</h3>
          <p className="text-gray-500 text-sm">Create your first lesson to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((l) => (
            <div key={l._id} className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${l.isPublished ? "bg-green-500" : "bg-gray-300"}`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#18181B] truncate">{l.title}</h3>
                <p className="text-xs text-gray-500">{l.subjectId?.name || "No subject"}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${l.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {l.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
