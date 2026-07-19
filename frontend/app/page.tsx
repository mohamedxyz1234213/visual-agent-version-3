"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMe, type SafeUser } from "@/lib/api";

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function getDashboardPath(role: string) {
    switch (role) {
      case "admin": return "/admin";
      case "teacher": return "/teacher/dashboard";
      case "student": return "/student/dashboard";
      default: return "/student/dashboard";
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#D4F542] rounded-lg flex items-center justify-center">
            <span className="text-[#18181B] font-bold text-sm">CT</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">CodeBuddy</span>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-9 bg-white/10 rounded-xl animate-pulse" />
          ) : user ? (
            <Link
              href={getDashboardPath(user.role)}
              className="px-5 py-2.5 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Sign In
              </Link>
              <Link href="/request-access" className="px-5 py-2.5 bg-[#D4F542] text-[#18181B] rounded-xl font-semibold text-sm hover:bg-[#c5e63d] transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-32 text-center">
        <div className="inline-block px-4 py-1.5 bg-[#D4F542]/10 rounded-full text-[#D4F542] text-sm font-semibold mb-6">
          AI-Powered Learning Platform
        </div>
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Learn to Code with
          <br />
          <span className="text-[#D4F542]">AI Teachers</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Interactive coding lessons, AI avatar teachers with voice, gamified progress,
          and a complete classroom management system for schools.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/request-access"
            className="px-8 py-4 bg-[#D4F542] text-[#18181B] rounded-2xl font-bold text-lg hover:bg-[#c5e63d] transition-all hover:scale-105 shadow-lg shadow-[#D4F542]/20"
          >
            Request Early Access
          </Link>
          <Link
            href="/request-access?feature=whiteboard"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all"
          >
            Try Whiteboard Free
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-3xl font-bold text-center mb-16">Everything You Need to Learn</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🤖", title: "AI Avatar Teacher", desc: "Interactive lessons with an AI teacher that speaks, explains, and encourages you." },
            { icon: "💻", title: "Code Exercises", desc: "Practice with real code challenges, get instant AI feedback, and track your progress." },
            { icon: "🏆", title: "Gamification", desc: "Earn XP, badges, and climb leaderboards. Learning has never been this fun." },
            { icon: "🎨", title: "Interactive Whiteboard", desc: "Visual lessons with animations, diagrams, and step-by-step explanations." },
            { icon: "📊", title: "Progress Analytics", desc: "Detailed dashboards showing your strengths, weaknesses, and learning path." },
            { icon: "👨‍👩‍👧", title: "Parent Portal", desc: "Parents can track their child's progress, attendance, and achievements." },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-[#18181B] py-24">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-16">Built for Everyone</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { role: "Students", icon: "🎓", color: "#D4F542", desc: "Learn coding with AI tutors, complete exercises, earn achievements." },
              { role: "Teachers", icon: "👨‍🏫", color: "#A78BFA", desc: "Create lessons, manage classes, grade submissions, track analytics." },
              { role: "Admins", icon: "⚙️", color: "#EF4444", desc: "Manage users, monitor AI costs, configure the platform." },
              { role: "Parents", icon: "👨‍👩‍👧", color: "#22C55E", desc: "View your child's progress, grades, and learning activity." },
            ].map((r) => (
              <div key={r.role} className="bg-white/5 rounded-2xl p-6 text-center border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-4xl mb-3">{r.icon}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: r.color }}>{r.role}</h3>
                <p className="text-gray-400 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Start Learning?</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join thousands of students learning to code with AI-powered teachers.</p>
        <Link
          href="/request-access"
          className="inline-block px-8 py-4 bg-[#D4F542] text-[#18181B] rounded-2xl font-bold text-lg hover:bg-[#c5e63d] transition-all hover:scale-105"
        >
          Request Access Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-8 text-center text-gray-500 text-sm">
        <p>CodeBuddy — AI Coding Teacher Platform &copy; 2026</p>
      </footer>
    </div>
  );
}
