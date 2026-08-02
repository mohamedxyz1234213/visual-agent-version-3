"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatedLogo } from "@/components/shared/AnimatedLogo";

function IconSearch({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <circle cx="10.5" cy="10.5" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

function IconUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0112 0v1" />
    </svg>
  );
}

function IconArrowLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconZap({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconBook({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconFlame({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <path d="M12 2s-4 6-4 10a4 4 0 008 0c0-4-4-10-4-10z" />
      <path d="M8 15a4 4 0 008 0" />
    </svg>
  );
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconBarChart({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function IconTarget({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconTrophy({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <path d="M8 21h8m-4-4v4m-4-8a4 4 0 01-4-4V4h16v5a4 4 0 01-4 4h-4z" />
      <path d="M4 4H2v3a3 3 0 003 3m15-6h2v3a3 3 0 01-3 3" />
    </svg>
  );
}

// ── Student Insights Dashboard (no emoji version) ─────────────────────────────
function StudentInsights({ data, onBack }: { data: any; onBack: () => void }) {
  const s = data.student || {};
  const stats = data.stats || {};
  const progress = data.progress || [];
  const achievements = data.achievements || [];
  const submissions = data.recentSubmissions || [];
  const strengths = data.strengths || [];
  const weaknesses = data.weaknesses || [];
  const weeklyActivity = data.weeklyActivity || [];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxActivity = Math.max(...weeklyActivity.map((w: any) => w.count), 1);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-[#6B6B6B] hover:text-[#0F0F0F] transition-colors flex items-center gap-1.5 group"
      >
        <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to search
      </button>

      {/* Student header */}
      <div className="flex items-start justify-between bg-[#F5F5F5] rounded-2xl p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Student</span>
            <span className="px-2 py-0.5 bg-[#D6F63E]/20 text-[#0F0F0F] text-[10px] font-bold rounded-full">{s.code}</span>
          </div>
          <h3 className="text-2xl font-bold text-[#0F0F0F]">{s.username}</h3>
          <p className="text-sm text-[#6B6B6B]">{s.email}{s.parentPhone ? ` \u00B7 ${s.parentPhone}` : ""}</p>
          {s.schoolYear && (
            <p className="text-xs text-[#A0A0A0] mt-1">{s.schoolYear.name} \u00B7 Section {s.section || "N/A"}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#0F0F0F]">{stats.xp?.toLocaleString()}</div>
          <div className="text-xs text-[#6B6B6B]">Total XP<p className="text-[10px]">Level {stats.level}</p></div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Lessons Done", value: stats.totalLessonsCompleted, color: "#D6F63E" },
          { label: "Exercises Done", value: stats.totalExercisesCompleted, color: "#C4B5F5" },
          { label: "Avg Score", value: `${stats.averageScore || 0}%`, color: "#A78BFA" },
          { label: "Streak", value: `${stats.streak} days`, color: "#F59E0B" },
          { label: "Consistency", value: `${stats.consistencyScore || 0}%`, color: "#10B981" },
          { label: "This Week XP", value: stats.weeklyXP?.toLocaleString() || "0", color: "#8B5CF6" },
          { label: "Passed", value: stats.passedSubmissions || 0, color: "#22C55E" },
          { label: "Total Time", value: `${Math.round((stats.totalTimeSpent || 0) / 60)}h`, color: "#6B7280" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
              <span className="text-[11px] text-[#6B6B6B]">{stat.label}</span>
            </div>
            <span className="text-xl font-bold text-[#0F0F0F]">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Weekly Activity + Subject Progress */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-3 bg-white rounded-2xl p-5 border border-[#E5E5E5]">
          <div className="flex items-center gap-2 mb-4">
            <IconBarChart className="w-4 h-4 text-[#6B6B6B]" />
            <h4 className="text-sm font-semibold text-[#0F0F0F]">Weekly Activity</h4>
          </div>
          <div className="flex items-end gap-2 h-[100px]">
            {days.map((day, i) => {
              const entry = weeklyActivity.find((w: any) => w.day === i);
              const height = entry ? (entry.count / maxActivity) * 100 : 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-[3px] bg-[#C4B5F5]"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-[#A0A0A0]">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-span-2 bg-white rounded-2xl p-5 border border-[#E5E5E5]">
          <h4 className="text-sm font-semibold text-[#0F0F0F] mb-4">Progress by Subject</h4>
          <div className="space-y-3">
            {progress.slice(0, 4).map((p: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#6B6B6B]">{p.subjectId?.name || "Subject"}</span>
                  <span className="font-semibold text-[#0F0F0F]">{p.completion || 0}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.completion || 0}%`, backgroundColor: p.subjectId?.color || "#C4B5F5" }} />
                </div>
              </div>
            ))}
            {progress.length === 0 && <p className="text-xs text-[#A0A0A0]">No progress data yet</p>}
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-2xl p-5 border border-[#E5E5E5]">
          <div className="flex items-center gap-2 mb-3">
            <IconTarget className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold text-[#0F0F0F]">Strengths</h4>
          </div>
          {strengths.length > 0 ? (
            <div className="space-y-2">
              {strengths.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[#0F0F0F]">{s.topic}</span>
                  <span className="text-green-600 font-semibold">{s.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A0A0A0]">Complete more exercises to see strengths</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E5E5E5]">
          <div className="flex items-center gap-2 mb-3">
            <IconTarget className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-semibold text-[#0F0F0F]">Areas to Improve</h4>
          </div>
          {weaknesses.length > 0 ? (
            <div className="space-y-2">
              {weaknesses.map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[#0F0F0F]">{w.topic}</span>
                  <span className="text-amber-600 font-semibold">{w.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#A0A0A0]">Keep going! You are doing great.</p>
          )}
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E5E5]">
        <h4 className="text-sm font-semibold text-[#0F0F0F] mb-3">Recent Submissions</h4>
        {submissions.length > 0 ? (
          <div className="space-y-2">
            {submissions.slice(0, 5).map((sub: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-[#F5F5F5] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${sub.status === "passed" ? "bg-green-500" : "bg-amber-500"}`} />
                  <span className="text-[#0F0F0F] truncate">{sub.exerciseId?.title || "Exercise"}</span>
                </div>
                <span className="font-semibold text-[#0F0F0F]">{sub.score}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#A0A0A0]">No submissions yet</p>
        )}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E5E5E5]">
          <div className="flex items-center gap-2 mb-3">
            <IconTrophy className="w-4 h-4 text-[#6B6B6B]" />
            <h4 className="text-sm font-semibold text-[#0F0F0F]">Achievements</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a: any, i: number) => (
              <span key={i} className="px-2.5 py-1 bg-[#D6F63E]/20 text-[#0F0F0F] text-xs rounded-full font-medium">
                {a.title || a.type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Search Page ───────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [studentCode, setStudentCode] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const hasInput = studentCode.trim() || nationalId.trim() || phone.trim();

  const handleSearch = async () => {
    if (!hasInput) return;

    setSearching(true);
    setError(null);
    setResult(null);

    try {
      let q = "";
      let type = "";

      if (studentCode.trim()) {
        q = studentCode.trim().toUpperCase();
        type = "code";
      } else if (nationalId.trim()) {
        q = nationalId.trim();
        type = "nationalId";
      } else if (phone.trim()) {
        q = phone.trim();
        type = "phone";
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://backend-teaching.vercel.app/api/v1";
      const res = await fetch(`${apiBase}/student/search?q=${encodeURIComponent(q)}&type=${type}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Student not found");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setStudentCode("");
    setNationalId("");
    setPhone("");
    setError(null);
    setResult(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#EDEDED] text-[#0F0F0F]">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#E5E5E5]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center">
              <AnimatedLogo size={22} className="text-[#D6F63E]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F0F0F]">CodeBuddy</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors"
            >
              <IconSearch className="w-4 h-4" />
              New Search
            </button>
          </div>
        </nav>

        {/* Results */}
        <main className="max-w-5xl mx-auto px-8 py-8">
          <StudentInsights data={result} onBack={handleClear} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] text-[#0F0F0F]">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#E5E5E5]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <AnimatedLogo size={22} className="text-[#D6F63E]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F0F0F]">CodeBuddy</span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-[#6B6B6B] hover:text-[#0F0F0F] transition-colors"
        >
          Back to Home
        </Link>
      </nav>

      {/* Search Section */}
      <main className="max-w-4xl mx-auto px-8 pt-16 pb-24">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E5E5] p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D6F63E]/20 rounded-full text-[13px] font-semibold mb-4 text-[#0F0F0F]">
              <IconSearch className="w-3.5 h-3.5" />
              Student Search
            </div>
            <h1 className="text-3xl font-bold text-[#0F0F0F] mb-2">Find a Student</h1>
            <p className="text-sm text-[#6B6B6B] max-w-lg mx-auto">
              Enter any of the following details to look up a student and view their learning progress.
            </p>
          </div>

          {/* 3 Input Fields */}
          <div className="space-y-4 max-w-lg mx-auto mb-6">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                Student Code
              </label>
              <input
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. A3X8K2M1"
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#A0A0A0] focus:border-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#0F0F0F]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                National ID
              </label>
              <input
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="14-digit national ID number"
                maxLength={14}
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#A0A0A0] focus:border-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#0F0F0F]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                Parent Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Parent's phone number"
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#A0A0A0] focus:border-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#0F0F0F]/10 transition-all"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSearch}
              disabled={searching || !hasInput}
              className="px-8 py-3 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <IconSearch className="w-4 h-4" />
              )}
              {searching ? "Searching..." : "Search"}
            </button>
            {hasInput && (
              <button
                onClick={handleClear}
                className="px-5 py-3 bg-[#F5F5F5] text-[#6B6B6B] rounded-xl font-semibold text-sm hover:bg-[#E5E5E5] transition-colors flex items-center gap-2"
              >
                <IconX className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="mt-6 max-w-lg mx-auto bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2.5">
              <IconX className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
