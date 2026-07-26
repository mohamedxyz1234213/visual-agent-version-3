"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLessons } from "@/features/student/api";
import type { Lesson } from "@/features/student/types";
import {
  IconBook,
  IconCode,
  IconStar,
  IconClock,
  IconZap,
  IconTarget,
  IconRobot,
  IconChevronRight,
} from "@/components/shared/FluxIcons";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function LearnPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState("");

  useEffect(() => {
    getLessons(filterDifficulty ? { difficulty: filterDifficulty } : undefined)
      .then((res) => setLessons(res.lessons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterDifficulty]);

  function handleStartLesson(lesson: Lesson) {
    // Open the avatar teacher with this lesson's context
    const params = new URLSearchParams();
    if (lesson.avatarLessonId) params.set("lessonId", lesson.avatarLessonId);
    if (lesson._id) params.set("codingLessonId", lesson._id);
    router.push(`/student/avatar-teacher?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F0F0F]">Learn</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Explore lessons created by your teachers
          </p>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterDifficulty("")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !filterDifficulty
              ? "bg-[#0F0F0F] text-white"
              : "bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] border border-[#E5E5E5]"
          }`}
        >
          All
        </button>
        {["beginner", "intermediate", "advanced"].map((d) => (
          <button
            key={d}
            onClick={() => setFilterDifficulty(d)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filterDifficulty === d
                ? "bg-[#0F0F0F] text-white"
                : "bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] border border-[#E5E5E5]"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Lesson grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[200px] bg-white rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-[#E5E5E5] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
            <IconBook size={28} className="text-[#A0A0A0]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F0F0F] mb-2">No Lessons Available</h3>
          <p className="text-sm text-[#6B6B6B]">
            Your teachers haven&apos;t created any lessons yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <div
              key={lesson._id}
              onClick={() => handleStartLesson(lesson)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5] hover:border-[#D6F63E] hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  <IconCode size={20} className="text-[#6B6B6B]" />
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                    DIFFICULTY_COLORS[lesson.difficulty] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {lesson.difficulty}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-[#0F0F0F] text-sm leading-5 line-clamp-2 mb-2">
                {lesson.title}
              </h3>

              {/* Tags */}
              {lesson.tags && lesson.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {lesson.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[#F5F5F5] rounded-md text-[10px] text-[#6B6B6B]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-[11px] text-[#6B6B6B] mt-auto">
                <span className="flex items-center gap-1">
                  <IconClock size={12} />
                  {lesson.duration || 30} min
                </span>
                {lesson.totalExercises > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <IconStar size={12} />
                      {lesson.totalExercises} exercises
                    </span>
                  </>
                )}
                {lesson.avatarLessonId && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-[#A78BFA]">
                      <IconRobot size={12} />
                      AI tutor
                    </span>
                  </>
                )}
              </div>

              {/* CTA */}
              <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#A78BFA] group-hover:text-[#7C3AED] transition-colors flex items-center gap-1">
                  Start Learning
                  <IconChevronRight size={14} />
                </span>
                {lesson.avatarLessonId ? (
                  <span className="text-[10px] text-[#A0A0A0]">Interactive</span>
                ) : (
                  <span className="text-[10px] text-[#A0A0A0]">Coding lesson</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
