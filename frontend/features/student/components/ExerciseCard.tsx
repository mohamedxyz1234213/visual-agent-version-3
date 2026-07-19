"use client";

import type { Exercise } from "../types";

interface ExerciseCardProps {
  exercise: Exercise;
  onStart?: (id: string) => void;
}

const diffColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export function ExerciseCard({ exercise, onStart }: ExerciseCardProps) {
  const icon = exercise.type === "free-code" ? "💻" : exercise.type === "find-bug" ? "🐛" : "📝";

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onStart?.(exercise._id)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffColors[exercise.difficulty] || ""}`}>
          {exercise.difficulty}
        </span>
      </div>
      <h3 className="font-semibold text-[#18181B] mb-1 group-hover:text-[#D4F542] transition-colors">
        {exercise.title}
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        {exercise.estimatedTime} min · {exercise.type}
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{exercise.totalAttempts} attempts</span>
        <span className="text-xs font-semibold text-[#D4F542]">+{exercise.xpReward} XP</span>
      </div>
    </div>
  );
}
