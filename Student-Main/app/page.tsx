"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMe, type SafeUser } from "@/lib/api";

function IconCode({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconBoard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconRobot({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <rect x="5" y="8" width="14" height="12" rx="3" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 8V5" /><circle cx="12" cy="3.5" r="1.5" />
      <path d="M5 12H3m18 0h-2" />
    </svg>
  );
}

function IconCode2({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconTrophy({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <path d="M8 21h8m-4-4v4m-4-8a4 4 0 01-4-4V4h16v5a4 4 0 01-4 4h-4z" />
      <path d="M4 4H2v3a3 3 0 003 3m15-6h2v3a3 3 0 01-3 3" />
    </svg>
  );
}

function IconChart({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function IconUsers({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M17 14a4 4 0 013 4v3" />
    </svg>
  );
}

function IconShield({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <path d="M12 3l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V7l8-4z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconSettings({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getDashboardPath(role: string) {
    switch (role) {
      case "student":
        return "/student/dashboard";
      default:
        return "/student/dashboard";
    }
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] text-[#0F0F0F] overflow-x-hidden">
      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#171717] rounded-lg flex items-center justify-center">
            <IconCode className="w-5 h-5 text-[#D6F63E]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F0F0F]">
            CodeBuddy
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="text-sm font-medium text-[#6B6B6B] hover:text-[#0F0F0F] transition-colors hidden sm:inline-block">
            Contact
          </Link>
          {loading ? (
            <div className="w-20 h-9 bg-gray-200 rounded-full animate-pulse" />
          ) : user && user.role === "student" ? (
            <Link
              href={getDashboardPath(user.role)}
              className="flux-btn-lime flex items-center gap-2"
            >
              <IconUser className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flux-btn-outline flex items-center gap-2"
              >
                <IconUser className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="flux-btn-lime flex items-center gap-2"
              >
                Get Started
                <IconArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 pt-20 pb-28 text-center">
        <div className="inline-block px-4 py-1.5 bg-[#D6F63E]/20 rounded-full text-[13px] font-semibold mb-6 text-[#0F0F0F]">
          AI-Powered Learning Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6 text-[#0F0F0F]">
          Learn to Code with
          <br />
          <span className="text-[#171717]">AI Teachers</span>
        </h1>
        <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto mb-10 leading-relaxed">
          Interactive coding lessons, AI avatar teachers with voice, gamified
          progress, and a complete classroom management system for schools.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="flux-btn-lime text-base px-8 py-4 flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Get Started
            <IconArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={user ? "/upload" : "/login?next=" + encodeURIComponent("/upload")}
            className="flux-btn-primary text-base px-8 py-4 flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <IconBoard className="w-5 h-5" />
            Try Whiteboard
          </Link>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold text-center mb-14 text-[#0F0F0F]">
          Everything You Need to Learn
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <IconRobot className="w-6 h-6 text-[#0F0F0F]" />,
              title: "AI Avatar Teacher",
              desc: "Interactive lessons with an AI teacher that speaks, explains, and encourages you.",
            },
            {
              icon: <IconCode2 className="w-6 h-6 text-[#0F0F0F]" />,
              title: "Code Exercises",
              desc: "Practice with real code challenges, get instant AI feedback, and track your progress.",
            },
            {
              icon: <IconTrophy className="w-6 h-6 text-[#0F0F0F]" />,
              title: "Gamification",
              desc: "Earn XP, badges, and climb leaderboards. Learning has never been this fun.",
            },
            {
              icon: <IconBoard className="w-6 h-6 text-[#0F0F0F]" />,
              title: "Interactive Whiteboard",
              desc: "Visual lessons with animations, diagrams, and step-by-step explanations.",
            },
            {
              icon: <IconChart className="w-6 h-6 text-[#0F0F0F]" />,
              title: "Progress Analytics",
              desc: "Detailed dashboards showing your strengths, weaknesses, and learning path.",
            },
            {
              icon: <IconUsers className="w-6 h-6 text-[#0F0F0F]" />,
              title: "Parent Portal",
              desc: "Parents can track their child's progress, attendance, and achievements.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flux-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flux-icon-chip mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-[#0F0F0F]">
                {f.title}
              </h3>
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles Section ───────────────────────────────────────────── */}
      <section className="bg-[#171717] py-24">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-14 text-white">
            Built for Everyone
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              {
                role: "Students",
                icon: <IconUser className="w-8 h-8" />,
                color: "#D6F63E",
                desc: "Learn coding with AI tutors, complete exercises, earn achievements.",
              },
              {
                role: "Teachers",
                icon: <IconSettings className="w-8 h-8" />,
                color: "#C4B5F5",
                desc: "Create lessons, manage classes, grade submissions, track analytics.",
              },
              {
                role: "Admins",
                icon: <IconShield className="w-8 h-8" />,
                color: "#FFFFFF",
                desc: "Manage users, monitor AI costs, configure the platform.",
              },
              {
                role: "Parents",
                icon: <IconUsers className="w-8 h-8" />,
                color: "#D6F63E",
                desc: "View your child's progress, grades, and learning activity.",
              },
            ].map((r) => (
              <div
                key={r.role}
                className="flux-card-dark text-center"
              >
                <div className="flux-icon-chip-dark mx-auto mb-4 w-14 h-14 flex items-center justify-center">
                  <span style={{ color: r.color }}>{r.icon}</span>
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: r.color }}
                >
                  {r.role}
                </h3>
                <p className="text-[13px] text-[#A0A0A0]">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 text-center">
        <h2 className="text-4xl font-bold mb-4 text-[#0F0F0F]">
          Ready to Start Learning?
        </h2>
        <p className="text-[#6B6B6B] mb-8 max-w-lg mx-auto">
          Join thousands of students learning to code with AI-powered teachers.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#171717] text-white rounded-full font-bold text-lg hover:bg-[#333] transition-all hover:scale-105"
        >
          Get Started Free
          <IconArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E5E5] py-8 px-8 text-center text-[#6B6B6B] text-sm bg-white">
        <p>CodeBuddy - AI Coding Teacher Platform</p>
      </footer>
    </div>
  );
}
