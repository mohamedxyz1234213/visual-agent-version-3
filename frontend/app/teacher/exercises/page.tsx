"use client";

import { useTeacherExercises } from "@/features/teacher/hooks";

export default function TeacherExercisesPage() {
  const { exercises, loading } = useTeacherExercises();
  const diffColors: Record<string, string> = { easy: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", hard: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">My Exercises</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage coding exercises</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-200 text-[#18181B] rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">🤖 AI Generate</button>
          <button className="px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors">+ New Exercise</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : exercises.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <span className="text-4xl block mb-4">💻</span>
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exercises yet</h3>
          <p className="text-gray-500 text-sm">Create your first exercise or use AI to generate one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div key={ex._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">💻</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffColors[ex.difficulty] || ""}`}>{ex.difficulty}</span>
              </div>
              <h3 className="font-semibold text-[#18181B] mb-1">{ex.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{ex.type} · {ex.estimatedTime} min</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{ex.totalAttempts} attempts</span>
                <button className="text-xs text-[#A78BFA] font-semibold hover:underline">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
