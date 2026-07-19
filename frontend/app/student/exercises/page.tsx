"use client";

import { useExercises } from "@/features/student/hooks";
import { ExerciseCard } from "@/features/student/components";
import { useState } from "react";

export default function ExercisesPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { exercises, loading } = useExercises(filter ? { difficulty: filter } : undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">Coding Exercises</h2>
          <p className="text-sm text-gray-500 mt-1">Practice and sharpen your coding skills</p>
        </div>
        <div className="flex gap-2">
          {[undefined, "easy", "medium", "hard"].map((d) => (
            <button key={d || "all"} onClick={() => setFilter(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === d || (!filter && !d) ? "bg-[#18181B] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}>
              {d === "all" || !d ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <span className="text-4xl block mb-4">💻</span>
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exercises available</h3>
          <p className="text-gray-500 text-sm">Check back later for new challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <ExerciseCard key={ex._id} exercise={ex} onStart={(id) => window.location.href = `/student/exercises/${id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
