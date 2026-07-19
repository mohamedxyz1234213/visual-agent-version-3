"use client";

import { useProgress } from "@/features/student/hooks";
import { IconTrending, IconBook } from "@/components/shared/FluxIcons";

export default function ProgressPage() {
  const { progress, loading } = useProgress();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">My Progress</h2>
        <p className="text-sm text-gray-500 mt-1">Track your learning across all subjects</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      ) : !progress.length ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconTrending size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No progress data yet</h3>
          <p className="text-gray-500 text-sm">Start completing lessons and exercises to see your progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: (p.subjectId?.color || "#D4F542") + "20" }}><IconBook size={20} className="text-[#18181B]" /></div>
                <div>
                  <h3 className="font-semibold text-[#18181B]">{p.subjectId?.name || "Subject"}</h3>
                  <p className="text-xs text-gray-500">{p.lessonCompletions?.length || 0} lessons · {p.exerciseStats?.total || 0} exercises</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Completion</span>
                  <span className="text-xs font-semibold text-[#18181B]">{p.overallCompletion}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.overallCompletion}%`, backgroundColor: p.subjectId?.color || "#D4F542" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#18181B]">{p.exerciseStats?.passed || 0}</p>
                  <p className="text-xs text-gray-500">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#18181B]">{p.examScores?.length || 0}</p>
                  <p className="text-xs text-gray-500">Exams</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#18181B]">{p.timeSpent || 0}m</p>
                  <p className="text-xs text-gray-500">Time</p>
                </div>
              </div>
              {p.conceptMastery?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Concept Mastery</p>
                  <div className="space-y-2">
                    {p.conceptMastery.slice(0, 4).map((c, j) => (
                      <div key={j}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-gray-600">{c.concept}</span>
                          <span className="text-xs font-semibold">{c.proficiency}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#A78BFA] rounded-full" style={{ width: `${c.proficiency}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
