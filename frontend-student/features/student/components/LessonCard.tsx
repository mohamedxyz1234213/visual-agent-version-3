"use client";

import type { Lesson } from "../types";

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onComplete?: (id: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export function LessonCard({ lesson, index, onComplete }: LessonCardProps) {
  return (
    <a
      href={`/student/learn/${lesson._id}`}
      className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-[#D4F542]/10 flex items-center justify-center text-lg font-bold text-[#18181B] group-hover:bg-[#D4F542] transition-colors">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#18181B] truncate">{lesson.title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {lesson.duration} min · {lesson.totalExercises || 0} exercises
        </p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[lesson.difficulty] || "bg-gray-100 text-gray-600"}`}>
        {lesson.difficulty}
      </span>
      <span className="text-gray-300 group-hover:text-[#D4F542] transition-colors">→</span>
    </a>
  );
}
