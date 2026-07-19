"use client";

import { useLessons } from "@/features/student/hooks";
import { LessonCard } from "@/features/student/components";
import { IconBook } from "@/components/shared/FluxIcons";

export default function LearnPage() {
  const { lessons, loading } = useLessons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">Learning Path</h2>
          <p className="text-sm text-gray-500 mt-1">Follow the roadmap and master coding step by step</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Progress:</span>
          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4F542] rounded-full" style={{ width: "20%" }} />
          </div>
          <span className="text-sm font-semibold text-[#18181B]">20%</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconBook size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No lessons yet</h3>
          <p className="text-gray-500 text-sm">Lessons will appear here once your teacher publishes them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, i) => (
            <LessonCard key={lesson._id} lesson={lesson} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
