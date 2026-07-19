"use client";

import { useLeaderboard } from "@/features/student/hooks";

export default function LeaderboardPage() {
  const { leaderboard, myRank, myStats, loading } = useLeaderboard();
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Leaderboard</h2>
        <p className="text-sm text-gray-500 mt-1">See how you rank among other students</p>
      </div>

      {myRank && (
        <div className="bg-[#D4F542] rounded-2xl p-6 text-[#18181B]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#18181B]/10 flex items-center justify-center text-lg font-bold">
              #{myRank}
            </div>
            <div>
              <p className="font-semibold">Your Ranking</p>
              <p className="text-sm opacity-70">{myStats?.xp || 0} XP · Level {myStats?.level || 1}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">XP</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Level</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.map((entry, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3"><span className="text-lg">{medals[i] || `#${entry.rank}`}</span></td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D4F542] flex items-center justify-center text-xs font-bold text-[#18181B]">
                        {entry.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-sm text-[#18181B]">{entry.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-semibold text-[#18181B]">{entry.xp.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="px-2 py-0.5 bg-[#A78BFA]/20 text-xs font-semibold rounded-full">Lv.{entry.level}</span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-600">{entry.streak}🔥</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
