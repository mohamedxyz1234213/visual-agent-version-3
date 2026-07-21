"use client";

import { useState, useEffect, useCallback } from "react";
import { getLeaderboard } from "@/features/student/api";
import type { LeaderboardEntry, LeaderboardResponse } from "@/features/student/types";
import {
  IconAward,
  IconFlame,
  IconZap,
  IconTrending,
  IconTrophy,
  IconCrown,
  IconTarget,
  IconStar,
} from "@/components/shared/FluxIcons";

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#D97706"];

const TABS = [
  { id: "xp", label: "All-Time XP", icon: IconZap },
  { id: "weekly", label: "This Week", icon: IconTrending },
  { id: "streak", label: "Streaks", icon: IconFlame },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const end = value;
    const duration = 800;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg"><IconCrown size={22} /></span>;
  if (rank === 2) return <span className="text-lg text-[#94A3B8]"><IconAward size={22} /></span>;
  if (rank === 3) return <span className="text-lg text-[#D97706]"><IconAward size={22} /></span>;
  return <span className="text-sm font-semibold text-[#A0A0A0] w-[22px] text-center">#{rank}</span>;
}

function getXPForNextLevel(level: number) {
  return level * 100 + (level - 1) * 50;
}

function getTotalXPAtLevel(level: number) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForNextLevel(i);
  }
  return total;
}

function LevelProgressBar({ xp, level }: { xp: number; level: number }) {
  const currentLevelXP = xp - getTotalXPAtLevel(level);
  const nextLevelXP = getXPForNextLevel(level);
  const pct = Math.min((currentLevelXP / nextLevelXP) * 100, 100);
  return (
    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-[#A78BFA] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("xp");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async (tab: TabId) => {
    setLoading(true);
    try {
      const type = tab;
      const timeframe = tab === "xp" ? "all-time" : undefined;
      const res = await getLeaderboard(type, 50, timeframe);
      setData(res);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeaderboard(activeTab); }, [activeTab, fetchLeaderboard]);

  const entries = data?.leaderboard || [];
  const myStats = data?.myStats;
  const myRank = data?.myRank;

  const getDisplayValue = (entry: LeaderboardEntry) => {
    if (activeTab === "streak") return entry.streak;
    if (activeTab === "weekly") return entry.weeklyXP || 0;
    return entry.xp;
  };

  const getMyDisplayValue = () => {
    if (!myStats) return 0;
    if (activeTab === "streak") return myStats.streak;
    if (activeTab === "weekly") return myStats.weeklyXP || 0;
    return myStats.xp;
  };

  const getValueLabel = () => {
    if (activeTab === "streak") return "day streak";
    if (activeTab === "weekly") return "XP this week";
    return "total XP";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#0F0F0F]">Leaderboard</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">Compete with peers and track your progress</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-white rounded-2xl p-1.5 shadow-sm border border-[#E5E5E5] w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#0F0F0F] text-white shadow-sm"
                  : "text-[#6B6B6B] hover:text-[#0F0F0F] hover:bg-[#F5F5F5]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* My Stats Card (if user has a rank) */}
      {myRank && myRank > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
              myRank === 1 ? "bg-amber-100 text-amber-600" :
              myRank === 2 ? "bg-slate-100 text-slate-500" :
              myRank === 3 ? "bg-orange-100 text-orange-600" :
              "bg-[#F5F5F5] text-[#6B6B6B]"
            }`}>
              #{myRank}
            </div>
            <div>
              <p className="font-semibold text-[#0F0F0F]">Your Rank</p>
              <p className="text-sm text-[#6B6B6B] flex items-center gap-2">
                <span className="font-semibold text-[#0F0F0F]"><AnimatedNumber value={getMyDisplayValue()} /></span>
                <span>{getValueLabel()}</span>
              </p>
              {myStats && (
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-[#A0A0A0]">Level {myStats.level}</span>
                  <LevelProgressBar xp={myStats.xp} level={myStats.level} />
                  {myStats.longestStreak && myStats.longestStreak > 0 && (
                    <span className="text-[#A0A0A0] flex items-center gap-1">
                      <IconFlame size={12} className="text-orange-400" />
                      Best: {myStats.longestStreak}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-[#A0A0A0] hidden sm:block">
            {activeTab === "weekly" ? (
              <span className="flex items-center gap-1.5">
                <IconTrending size={14} /> Resets Monday
              </span>
            ) : activeTab === "streak" ? (
              <span className="flex items-center gap-1.5">
                <IconFlame size={14} className="text-orange-400" /> Keep it alive!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <IconTrophy size={14} /> All-time ranking
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && entries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 px-4 py-6 bg-white rounded-2xl shadow-sm border border-[#E5E5E5]">
          {/* 2nd place */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border-2 border-[#94A3B8]">
              {entries[1].username[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#0F0F0F] max-w-[80px] truncate">{entries[1].username}</span>
            <div className="w-16 h-[80px] bg-slate-100 rounded-t-lg flex items-center justify-center text-xs font-bold text-slate-500">
              #2
            </div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center gap-2 -mt-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-600 border-2 border-[#F59E0B] shadow-lg shadow-amber-200">
              {entries[0].username[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-bold text-[#0F0F0F] max-w-[80px] truncate">{entries[0].username}</span>
            <div className="w-20 h-[100px] bg-amber-50 rounded-t-lg border border-amber-200 flex items-center justify-center">
              <IconCrown size={24} className="text-[#F59E0B]" />
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 border-2 border-[#D97706]">
              {entries[2].username[0]?.toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-[#0F0F0F] max-w-[80px] truncate">{entries[2].username}</span>
            <div className="w-16 h-[60px] bg-orange-50 rounded-t-lg flex items-center justify-center text-xs font-bold text-orange-500">
              #3
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E5E5] space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-[#F5F5F5] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[48px_1fr_100px_80px] gap-3 border-b border-[#E5E5E5] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">
            <span>Rank</span>
            <span>Student</span>
            <span className="text-right">{activeTab === "streak" ? "Streak" : "XP"}</span>
            <span className="text-right">Level</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F5F5F5]">
            {entries.map((entry, i) => {
              const displayValue = getDisplayValue(entry);
              const isMe = myRank && myRank === entry.rank;
              return (
                <div
                  key={i}
                  className={`grid grid-cols-[48px_1fr_100px_80px] gap-3 items-center px-5 py-3.5 transition-all ${
                    isMe ? "bg-[#D6F63E]/10 border-l-2 border-l-[#D6F63E]" : "hover:bg-[#F5F5F5]"
                  }`}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    <RankBadge rank={entry.rank} />
                  </div>

                  {/* Student info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-600" :
                      i === 1 ? "bg-slate-100 text-slate-500" :
                      i === 2 ? "bg-orange-100 text-orange-600" :
                      "bg-[#D6F63E] text-[#0F0F0F]"
                    }`}>
                      {entry.username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm font-semibold truncate block ${
                        isMe ? "text-[#0F0F0F]" : "text-[#0F0F0F]"
                      }`}>
                        {entry.username}
                      </span>
                      {hoveredRow === i && isMe && (
                        <span className="text-[10px] text-[#A0A0A0]">That's you!</span>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      activeTab === "streak" ? "text-orange-500" :
                      activeTab === "weekly" ? "text-[#A78BFA]" :
                      "text-[#0F0F0F]"
                    }`}>
                      {activeTab === "streak" ? (
                        <span className="inline-flex items-center gap-1">
                          {displayValue}
                          {displayValue > 0 && <IconFlame size={14} className="text-orange-400" />}
                        </span>
                      ) : (
                        <AnimatedNumber value={displayValue} />
                      )}
                    </span>
                  </div>

                  {/* Level */}
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-1 bg-[#A78BFA]/15 text-[#7C3AED] rounded-full">
                      Lv.{entry.level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-4">
                <IconTarget size={32} className="text-[#A0A0A0]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F0F0F] mb-1">No rankings yet</h3>
              <p className="text-sm text-[#6B6B6B] max-w-xs">
                Start completing lessons and exercises to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bottom stats */}
      {entries.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-[#A0A0A0] flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <IconStar size={12} /> {entries.length} students ranked
            </span>
            {activeTab === "weekly" && (
              <span className="flex items-center gap-1">
                <IconTrending size={12} /> Resets every Monday
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
