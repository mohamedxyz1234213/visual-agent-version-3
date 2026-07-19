"use client";

import { useAchievements } from "@/features/student/hooks";
import {
  IconBook, IconCode, IconRobot, IconFlame, IconZap, IconStar,
  IconTarget, IconBug, IconCrown, IconCompass, IconTrophy,
} from "@/components/shared/FluxIcons";

type IconComponent = React.ComponentType<{ className?: string; size?: number }>;

export default function AchievementsPage() {
  const { achievements, loading } = useAchievements();

  const iconMap: Record<string, IconComponent> = {
    "first-lesson": IconBook, "first-exercise": IconCode, "first-avatar-session": IconRobot,
    "streak-3": IconFlame, "streak-7": IconZap, "streak-14": IconStar, "streak-30": IconStar,
    "perfect-score": IconTarget, "bug-hunter": IconBug, "speed-demon": IconZap,
    "code-master": IconCrown, "ai-friend": IconRobot, "explorer": IconCompass,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Achievements</h2>
        <p className="text-sm text-gray-500 mt-1">Track your milestones and accomplishments</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : achievements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconTrophy size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No achievements yet</h3>
          <p className="text-gray-500 text-sm">Complete lessons and exercises to earn achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((a) => {
            const AchievementIcon = iconMap[a.type] || IconTrophy;
            return (
            <div key={a._id} className="bg-white rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                   style={{ backgroundColor: (a.color || "#D4F542") + "20" }}>
                <AchievementIcon size={28} className="text-[#18181B]" />
              </div>
              <h3 className="font-semibold text-sm text-[#18181B] mb-1">{a.title}</h3>
              <p className="text-xs text-gray-500 mb-2">{a.description}</p>
              <p className="text-xs text-gray-400">{new Date(a.unlockedAt).toLocaleDateString()}</p>
              {a.xpBonus > 0 && <span className="inline-block mt-2 px-2 py-0.5 bg-[#D4F542]/20 text-xs font-semibold rounded-full text-[#18181B]">+{a.xpBonus} XP</span>}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
