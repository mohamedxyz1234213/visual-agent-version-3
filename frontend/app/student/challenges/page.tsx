"use client";

import { useChallenges } from "@/features/student/hooks";
import { joinChallenge } from "@/features/student/api";

export default function ChallengesPage() {
  const { challenges, loading } = useChallenges();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Weekly Challenges</h2>
        <p className="text-sm text-gray-500 mt-1">Compete with other students and win rewards</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      ) : !challenges.length ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <span className="text-4xl block mb-4">🏆</span>
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No active challenges</h3>
          <p className="text-gray-500 text-sm">Check back next week for new challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((c) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000));
            return (
              <div key={c._id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#D4F542]/10 flex items-center justify-center text-2xl">🏆</div>
                  <span className="px-3 py-1 bg-[#EF4444]/10 text-xs font-semibold rounded-full text-[#EF4444]">{daysLeft}d left</span>
                </div>
                <h3 className="font-semibold text-[#18181B] mb-1">{c.title}</h3>
                <p className="text-xs text-gray-500 mb-4">{c.description || "Complete the challenge exercise to earn rewards"}</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs text-gray-500">👥 {c.participantCount || 0} joined</span>
                  <span className="text-xs text-[#D4F542] font-semibold">+{c.rewards?.xp || 20} XP</span>
                  <span className="text-xs text-amber-600 font-semibold">+{c.rewards?.coins || 10} 🪙</span>
                </div>
                {!c.isParticipating ? (
                  <button onClick={() => joinChallenge(c._id).then(() => setChallenges((prev) => prev.map((ch) => ch._id === c._id ? { ...ch, isParticipating: true, participantCount: (ch.participantCount || 0) + 1 } : ch)))} className="w-full py-2.5 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors">
                    Join Challenge
                  </button>
                ) : (
                  <a href={`/student/exercises/${c.exerciseId?._id || c.exerciseId}`}
                     className="block w-full py-2.5 bg-[#18181B] text-white rounded-xl font-semibold text-sm text-center hover:bg-[#333] transition-colors">
                    Start Challenge →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
