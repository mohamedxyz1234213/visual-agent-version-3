"use client";

import Link from "next/link";
import { useEffect, useState, useRef, type CSSProperties } from "react";
import { fetchMe, type SafeUser } from "@/lib/api";
import { AnimatedLogo } from "@/components/shared/AnimatedLogo";
import { HomeWhiteboardDemo } from "@/components/shared/HomeWhiteboardDemo";
import { Reveal, StatNumber, useInView } from "@/components/shared/HomeMotion";
import {
  Zap,
  BookOpen,
  Flame,
  Compass,
  Code2,
  Bot,
  Trophy,
  Target,
  TrendingUp,
  Palette,
  ChevronRight,
  Users,
  Check,
  Play,
  Sparkles,
  ArrowRight,
  Star,
  Search,
  Layers,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const dashRef = useInView<HTMLDivElement>(0.3);
  const dashInView = dashRef.inView;

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeroVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      {/* ── Floating animated nav ──────────────────────────────────── */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-6 pt-3 sm:pt-4">
        <nav className="pointer-events-auto w-full max-w-3xl flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 sm:px-5 py-2.5 shadow-lg shadow-[#0F0F0F]/5 backdrop-blur-xl animate-[navFloat_6s_ease-in-out_infinite]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <AnimatedLogo size={42} animate={false} className="text-[#D6F63E]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0F0F0F]">
              CodeBuddy
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6B6B6B]">
            <a href="#product" className="hover:text-[#0F0F0F] transition-colors">Product</a>
            <a href="#features" className="hover:text-[#0F0F0F] transition-colors">Features</a>
            <a href="#whiteboard" className="hover:text-[#0F0F0F] transition-colors">Whiteboard</a>
            <a href="#dashboard" className="hover:text-[#0F0F0F] transition-colors">Dashboard</a>
          </div>

          <div className="flex items-center gap-1.5">
            {loading ? (
              <div className="w-16 h-9 bg-gray-200 rounded-full animate-pulse" />
            ) : user && user.role === "student" ? (
              <Link
                href={getDashboardPath(user.role)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D6F63E] text-[#0F0F0F] rounded-full font-semibold text-[13px] hover:bg-[#c5e535] transition-colors"
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-2 text-[13px] font-semibold text-[#0F0F0F] hover:bg-black/5 rounded-full transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F0F0F] text-white rounded-full font-semibold text-[13px] hover:bg-[#2A2A2A] transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* floating ambient shapes — palette-safe, no glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-16 left-[6%] hidden lg:block w-16 h-16 rounded-2xl border-2 border-[#0F0F0F]/10 animate-[heroDrift_9s_ease-in-out_infinite]" />
          <div className="absolute top-40 right-[8%] hidden lg:block w-10 h-10 rounded-full bg-[#D6F63E]/50 animate-[heroFloat_7s_ease-in-out_infinite]" />
          <div className="absolute bottom-10 left-[14%] hidden lg:block w-8 h-8 rounded-lg bg-[#0F0F0F]/10 animate-[heroDriftAlt_11s_ease-in-out_infinite]" />
          <div className="absolute top-24 right-[24%] hidden lg:block w-4 h-4 rounded-full border-2 border-[#0F0F0F]/20 animate-[heroFloat_8s_ease-in-out_infinite]" style={{ animationDelay: "0.6s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-20 sm:pt-28 pb-12 sm:pb-16">
          <div
            className={`flex flex-wrap items-center justify-center gap-2 mb-6 transition-all duration-700 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D6F63E]/20 border border-[#D6F63E]/40 text-[11px] font-semibold text-[#0F0F0F]">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#0F0F0F] animate-[dotPulse_1.6s_ease-in-out_infinite]" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-[#0F0F0F]" />
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#0F0F0F]" />
              AI-Powered Adaptive Learning Platform
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.06] mb-6 transition-all duration-700 delay-100 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Learn to Code with Adaptive
              <br />
              <span className="relative inline-block text-[#171717] mt-2">
                AI Teachers
                <span
                  className="absolute left-0 -bottom-1.5 h-[5px] w-full rounded-full bg-[#D6F63E] origin-left animate-[underlineDraw_900ms_cubic-bezier(0.22,0.61,0.36,1)_0.7s_both]"
                  style={{ transform: heroVisible ? undefined : "scaleX(0)" }}
                />
              </span>
            </h1>
            <p
              className={`text-base sm:text-lg text-[#6B6B6B] max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 delay-200 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Interactive coding lessons, AI avatar teachers with voice, gamified
              progress, and a complete classroom management system for schools.
            </p>

            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 delay-300 ${
                heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <Link
                href={user ? "/student/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#D6F63E] text-[#0F0F0F] rounded-full font-semibold text-base hover:bg-[#c5e535] hover:scale-105 active:scale-95 transition-all"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href={user ? "/student/whiteboard" : "/login?next=" + encodeURIComponent("/student/whiteboard")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#171717] text-white rounded-full font-semibold text-base hover:bg-[#333] hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-white" />
                Try Whiteboard
              </Link>
            </div>
          </div>

          <div
            className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-9 transition-all duration-700 delay-400 ${
              heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              "Personalized AI tutor",
              "Gamified learning experience",
              "Real-time progress tracking",
            ].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 text-[12.5px] text-[#6B6B6B] font-medium">
                <span className="w-4 h-4 rounded-full bg-[#D6F63E]/30 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#0F0F0F]" strokeWidth={3} />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* floating code chips — real palette, hand-crafted */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          <div className="absolute left-[7%] top-[58%] bg-white border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 shadow-sm animate-[heroChip_7s_ease-in-out_infinite]" style={{ "--chip-tilt": "2deg" } as CSSProperties}>
            <div className="flex items-center gap-1 mb-1.5">
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <code className="text-[11px] font-medium text-[#0F0F0F]"><span className="text-[#A0A0A0]">for</span> i <span className="text-[#A0A0A0]">in</span> range(5):</code>
          </div>
          <div className="absolute right-[6%] top-[44%] bg-[#171717] text-white rounded-xl px-3.5 py-2.5 shadow-sm animate-[heroChip_8s_ease-in-out_infinite]" style={{ "--chip-tilt": "-3deg" } as CSSProperties}>
            <code className="text-[11px] font-medium"><span className="text-[#D6F63E]">print</span>(i)</code>
          </div>
          <div className="absolute right-[14%] top-[70%] bg-white border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 shadow-sm animate-[heroChip_9s_ease-in-out_infinite]" style={{ "--chip-tilt": "3deg" } as CSSProperties}>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0F0F0F]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D6F63E]" />
              +12 XP
            </div>
          </div>
          <div className="absolute left-[20%] top-[74%] bg-white border border-[#E5E5E5] rounded-xl px-3.5 py-2.5 shadow-sm animate-[heroChip_10s_ease-in-out_infinite]" style={{ "--chip-tilt": "-2deg" } as CSSProperties}>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0F0F0F]">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
              </span>
              Teacher online
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee strip ───────────────────────────────────────────── */}
      <div className="relative bg-[#0F0F0F] py-3 overflow-hidden">
        <div className="flex w-max animate-[marquee_26s_linear_infinite]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {["Python", "JavaScript", "HTML & CSS", "Loops", "Functions", "Arrays", "AI Teacher", "XP & Badges", "Live Lessons", "Adaptive Pacing"].map((word) => (
                <span key={word} className="flex items-center text-sm font-semibold tracking-tight text-white">
                  <span className="px-5">{word}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D6F63E]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Dashboard preview (mirrors the real student dashboard) ──── */}
      <section id="dashboard" className="pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <Reveal className="rounded-[24px] bg-white border border-[#E5E5E5] shadow-2xl shadow-[#171717]/10 overflow-hidden">
            {/* window bar */}
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-[#E5E5E5] bg-[#F5F5F5]">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              <div className="ml-4 flex-1 min-w-0 max-w-xs hidden sm:flex items-center gap-2 bg-white border border-[#E5E5E5] rounded-lg px-3 py-1.5 text-[11px] text-[#A0A0A0]">
                <Search className="w-3 h-3" />
                app.codebuddy.ai/student/dashboard
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B6B6B]">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <span className="w-7 h-7 rounded-full bg-[#D6F63E] text-[#0F0F0F] text-[10px] font-bold flex items-center justify-center">
                  ST
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-[#F5F5F5]">
              {/* Student ID banner */}
              <div className="flex flex-col gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#E5E5E5] sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D6F63E] flex items-center justify-center shrink-0">
                    <Target size={18} className="text-[#0F0F0F]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Student ID</p>
                    <p className="text-base font-bold text-[#0F0F0F] tracking-wider">ST-2026-0452</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#A0A0A0] sm:text-right">
                  Share this code with your teacher to connect to your class
                </p>
              </div>

              {/* Row 1: 3 stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 sm:mb-4">
                {[
                  { icon: <Zap size={18} className="text-[#6B6B6B]" />, title: "XP Earned", value: "1,240", change: "+12%" },
                  { icon: <BookOpen size={18} className="text-[#6B6B6B]" />, title: "Lessons Done", value: "24" },
                  { icon: <Flame size={18} className="text-[#6B6B6B]" />, title: "Current Streak", value: "12", unit: "days" },
                ].map((s, i) => (
                  <Reveal key={s.title} delay={i * 80}>
                    <div className="flux-card flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center">{s.icon}</div>
                          <span className="text-[12px] font-medium text-[#6B6B6B]">{s.title}</span>
                        </div>
                        <span className="text-[#6B6B6B] text-[10px]">⋯</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <StatNumber value={Number(s.value.replace(",", ""))} className="text-3xl font-bold tracking-tight text-[#0F0F0F]" />
                        {s.unit && <span className="text-[12px] font-medium text-[#6B6B6B]">{s.unit}</span>}
                        {s.change && (
                          <span className="bg-[#D6F63E]/20 text-[#0F0F0F] rounded-full px-2 py-0.5 text-[10px] font-semibold ml-1">
                            {s.change}
                          </span>
                        )}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Row 2: dark activity chart + progress by subject */}
              <div ref={dashRef.ref} className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-3 sm:mb-4">
                <div className="lg:col-span-3 flux-card-dark">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <TrendingUp size={15} className="text-[#A0A0A0]" />
                      </div>
                      <span className="text-[14px] font-semibold text-white">Learning Activity</span>
                    </div>
                    <span className="px-3 py-1.5 bg-[#2A2A2A] text-[#A0A0A0] text-[11px] font-medium rounded-full">
                      Monthly
                    </span>
                  </div>

                  <div className="flex gap-5 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-[#D6F63E]" />
                        <span className="text-[26px] font-bold text-white leading-none">24</span>
                      </div>
                      <span className="text-[12px] text-[#A0A0A0]">lessons completed</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded-sm bg-[#F5F5F5]" />
                        <span className="text-[26px] font-bold text-white leading-none">92%</span>
                      </div>
                      <span className="text-[12px] text-[#A0A0A0]">average score</span>
                    </div>
                  </div>

                  <div className="flex items-end gap-1.5 h-[90px]">
                    {[
                      { h: 30, today: false },
                      { h: 55, today: false },
                      { h: 40, today: false },
                      { h: 75, today: false },
                      { h: 60, today: false },
                      { h: 90, today: true },
                      { h: 45, today: false },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: "70px" }}>
                          <div
                            className={`w-[40%] rounded-t-[3px] origin-bottom ${bar.today ? "bg-[#D6F63E]" : "bg-[#2A2A2A]"} ${dashInView ? "animate-[barGrow_800ms_cubic-bezier(0.22,0.61,0.36,1)_both]" : ""}`}
                            style={{ height: `${bar.h}%`, animationDelay: dashInView ? `${300 + i * 90}ms` : undefined }}
                          />
                          <div
                            className={`w-[40%] rounded-t-[3px] origin-bottom ${bar.today ? "bg-[#F5F5F5]" : "bg-[#171717]"} ${dashInView ? "animate-[barGrow_800ms_cubic-bezier(0.22,0.61,0.36,1)_both]" : ""}`}
                            style={{ height: `${bar.h * 0.7}%`, animationDelay: dashInView ? `${380 + i * 90}ms` : undefined }}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${bar.today ? "text-white" : "text-[#A0A0A0]"}`}>
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 flux-card">
                  <h3 className="text-[14px] font-semibold text-[#0F0F0F] mb-4">Progress by Subject</h3>
                  {[
                    { pct: 92, name: "Python Fundamentals", color: "#D6F63E" },
                    { pct: 76, name: "JavaScript Basics", color: "#0F0F0F" },
                    { pct: 58, name: "HTML & CSS", color: "#171717" },
                  ].map((bar, barIndex) => (
                    <div key={bar.name} className="mb-3.5 last:mb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl font-bold text-[#0F0F0F]">{bar.pct}%</span>
                        <span className="text-[12px] font-medium text-[#6B6B6B]">{bar.name}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#EAEAEA] overflow-hidden">
                        <div
                          className="h-full rounded-full origin-left"
                          style={{
                            width: `${bar.pct}%`,
                            backgroundColor: bar.color,
                            transform: dashInView ? undefined : "scaleX(0)",
                            animation: dashInView ? `fillWipe 1100ms cubic-bezier(0.22,0.61,0.36,1) ${400 + barIndex * 180}ms both` : undefined,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Quick Actions + Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
                <Reveal from="left" className="lg:col-span-3 flux-card">
                  <h3 className="text-[14px] font-semibold text-[#0F0F0F] mb-3.5">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { icon: <Compass size={20} className="text-[#0F0F0F]" />, label: "Learn" },
                      { icon: <Code2 size={20} className="text-[#0F0F0F]" />, label: "Exercises" },
                      { icon: <Bot size={20} className="text-[#0F0F0F]" />, label: "AI Teacher" },
                      { icon: <Trophy size={20} className="text-[#0F0F0F]" />, label: "Leaderboard" },
                    ].map((a, i) => (
                      <div key={a.label} className="flex flex-col items-center gap-1.5 p-3.5 rounded-[14px] bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors cursor-pointer animate-[popBounce_400ms_cubic-bezier(0.34,1.56,0.64,1)_both]" style={{ animationDelay: dashInView ? `${500 + i * 90}ms` : undefined }}>
                        <span className="transition-transform duration-300 group-hover:-translate-y-1">{a.icon}</span>
                        <span className="text-[11px] font-semibold text-[#0F0F0F]">{a.label}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>

                <Reveal from="right" className="lg:col-span-2 flux-card">
                  <h3 className="text-[14px] font-semibold text-[#0F0F0F] mb-3.5">Leaderboard Preview</h3>
                  <div className="space-y-1">
                    {[
                      { u: "Nora", xp: "2,480 XP", lv: "Lv.14", crown: true },
                      { u: "Omar", xp: "2,310 XP", lv: "Lv.13" },
                      { u: "Lina", xp: "2,120 XP", lv: "Lv.13" },
                      { u: "Yousef", xp: "1,980 XP", lv: "Lv.12" },
                    ].map((r, i) => (
                      <div key={r.u} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors animate-[popBounce_400ms_cubic-bezier(0.34,1.56,0.64,1)_both]" style={{ animationDelay: dashInView ? `${600 + i * 90}ms` : undefined }}>
                        <div className="w-7 h-7 rounded-full bg-[#D6F63E] text-[#0F0F0F] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {r.u[0]}
                        </div>
                        <span className="flex-1 min-w-0 text-[11px] font-semibold text-[#0F0F0F] truncate flex items-center gap-1">
                          {r.u}
                          {r.crown && <Trophy size={11} className="text-amber-500 shrink-0" />}
                        </span>
                        <span className="text-[11px] font-bold text-[#6B6B6B]">{r.xp}</span>
                        <span className="text-[10px] text-[#A0A0A0] w-9 text-right">{r.lv}</span>
                      </div>
                    ))}
                  </div>
                  <span className="block text-center text-[11px] font-semibold text-[#0F0F0F] hover:text-[#6B6B6B] pt-2 transition-colors">
                    View full leaderboard →
                  </span>
                </Reveal>
              </div>

              {/* Row 5: My Whiteboard Lessons */}
              <Reveal delay={150} className="flux-card mt-3 sm:mt-4">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#D6F63E] flex items-center justify-center">
                      <Palette size={15} className="text-[#0F0F0F]" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-[#0F0F0F]">My Whiteboard Lessons</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0F0F0F] hover:text-[#6B6B6B] flex items-center gap-1 transition-colors">
                    View All <ChevronRight size={13} />
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    { title: "Intro to Python Loops", subject: "Python", status: "Ready" },
                    { title: "HTML Forms Explained", subject: "Web Dev", status: "Ready" },
                    { title: "JavaScript Functions", subject: "JavaScript", status: "Processing" },
                    { title: "CSS Flexbox Basics", subject: "Web Dev", status: "Ready" },
                  ].map((l, i) => (
                    <div key={l.title} className="rounded-xl border border-[#E5E5E5] bg-white p-3.5 hover:shadow-sm transition-shadow cursor-pointer animate-[popBounce_400ms_cubic-bezier(0.34,1.56,0.64,1)_both]" style={{ animationDelay: dashInView ? `${750 + i * 80}ms` : undefined }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                          l.status === "Processing" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${l.status === "Processing" ? "bg-amber-400" : "bg-emerald-400"}`} />
                          {l.status}
                        </span>
                        <span className="text-[9px] text-[#A0A0A0]">Aug 5</span>
                      </div>
                      <h4 className="text-[11px] font-semibold text-[#0F0F0F] leading-5 line-clamp-2 mb-1">{l.title}</h4>
                      <p className="text-[9px] text-[#6B6B6B] truncate">{l.subject}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features section ────────────────────────────────────────── */}
      <section id="features" className="py-14 sm:py-20 bg-[#EDEDED]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6F63E]/20 border border-[#D6F63E]/40 text-[#0F0F0F] text-[11px] font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Everything You Need to Learn
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-[#0F0F0F]">
              A complete AI learning platform
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed">
              Every tool a modern student and teacher needs — delivered in one clean,
              fast, and delightful experience.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: <Bot className="w-5 h-5 text-[#0F0F0F]" />,
                ring: "bg-[#F5F5F5]",
                title: "AI Avatar Teacher",
                desc: "A lifelike AI teacher that speaks, explains, and encourages — adapting to every student.",
              },
              {
                icon: <Palette className="w-5 h-5 text-[#0F0F0F]" />,
                ring: "bg-[#D6F63E]/20",
                title: "Interactive Whiteboard",
                desc: "Step-by-step visual lessons with animations, diagrams, and live explanations.",
              },
              {
                icon: <Trophy className="w-5 h-5 text-[#0F0F0F]" />,
                ring: "bg-[#F5F5F5]",
                title: "Gamified Learning",
                desc: "Earn XP, badges, and climb the leaderboard. Motivation that never fades.",
              },
              {
                icon: <Code2 className="w-5 h-5 text-[#0F0F0F]" />,
                ring: "bg-[#D6F63E]/20",
                title: "Code Exercises",
                desc: "Real coding challenges with instant AI feedback and a smart hint system.",
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-[#0F0F0F]" />,
                ring: "bg-[#F5F5F5]",
                title: "Progress Analytics",
                desc: "Detailed dashboards reveal strengths, weaknesses, and the best next step.",
              },
              {
                icon: <Users className="w-5 h-5 text-[#0F0F0F]" />,
                ring: "bg-[#D6F63E]/20",
                title: "Parent Portal",
                desc: "Parents track progress, attendance, and achievements in real time.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90 + Math.floor(i / 3) * 60}>
                <div className="group bg-white rounded-2xl p-5 border border-[#E5E5E5] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className={`w-11 h-11 rounded-2xl ${f.ring} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:animate-[iconNudge_700ms_ease-in-out] transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-[#0F0F0F] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Whiteboard feature split ────────────────────────────────── */}
      <section id="whiteboard" className="py-14 sm:py-20 bg-white border-y border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <Reveal from="left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6F63E]/20 border border-[#D6F63E]/40 text-[#0F0F0F] text-[11px] font-semibold mb-4">
              <Layers className="w-3.5 h-3.5" /> Visual learning, reimagined
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-[#0F0F0F]">
              The <span className="text-[#171717]">Whiteboard</span> that teaches
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-7">
              Watch abstract concepts come alive as an AI teacher draws, animates, and
              narrates — turning every lesson into an engaging visual story students
              actually remember.
            </p>

            <div className="space-y-4">
              {[
                { icon: <Cpu className="w-4 h-4" />, title: "Real-time annotations", desc: "Live drawing and highlighting tied to the spoken lesson." },
                { icon: <Target className="w-4 h-4" />, title: "Adaptive pacing", desc: "Slows down where a student struggles, speeds up where they shine." },
                { icon: <BookOpen className="w-4 h-4" />, title: "Aligned with curriculum", desc: "Every visual maps to grade-level learning objectives." },
              ].map((b, i) => (
                <div key={b.title} className="flex items-start gap-3.5 animate-[heroFloat_6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.8}s` }}>
                  <span className="w-10 h-10 rounded-xl bg-[#F5F5F5] text-[#0F0F0F] flex items-center justify-center shrink-0">
                    {b.icon}
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-[#0F0F0F]">{b.title}</div>
                    <div className="text-[13px] text-[#6B6B6B] mt-0.5 leading-relaxed">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal from="right" delay={120}>
            <HomeWhiteboardDemo />
          </Reveal>
        </div>
      </section>

      {/* ── Testimonial ─────────────────────────────────────────────── */}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 px-4 bg-[#EDEDED]">
        <Reveal className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-[28px] bg-[#171717] text-white px-6 sm:px-14 py-12 sm:py-16 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
              <div className="absolute top-10 left-12 w-20 h-20 rounded-2xl border-2 border-white animate-[spinSlow_22s_linear_infinite]" />
              <div className="absolute bottom-10 right-16 w-14 h-14 rounded-full border-2 border-[#D6F63E] animate-[heroDrift_10s_ease-in-out_infinite]" />
              <div className="absolute top-1/2 left-[12%] w-2.5 h-2.5 rounded-sm bg-[#D6F63E] animate-[heroFloat_7s_ease-in-out_infinite]" />
              <div className="absolute bottom-8 left-1/3 w-2 h-2 rounded-full bg-white animate-[heroDriftAlt_9s_ease-in-out_infinite]" />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold mb-5 animate-[heroFloat_5s_ease-in-out_infinite]">
                <Sparkles className="w-3.5 h-3.5 text-[#D6F63E]" /> Ready when you are
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
                Start learning with an AI teacher today
              </h2>
              <p className="text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
                Join thousands of students and educators making lessons faster, clearer,
                and far more engaging.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#D6F63E] text-[#0F0F0F] rounded-full font-bold text-[15px] hover:bg-[#c5e535] hover:scale-105 active:scale-95 transition-all"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-white rounded-full font-semibold text-[15px] border border-white/30 hover:bg-white/10 hover:border-white/60 transition-all"
                >
                  Request a Demo
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5E5E5] py-8 px-4 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <AnimatedLogo size={40} animate={false} className="text-[#D6F63E]" />
              </div>
              <span className="font-bold tracking-tight text-[#0F0F0F]">CodeBuddy</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-[#6B6B6B]">
              <a href="#product" className="hover:text-[#0F0F0F] transition-colors">Product</a>
              <a href="#features" className="hover:text-[#0F0F0F] transition-colors">Features</a>
              <a href="#whiteboard" className="hover:text-[#0F0F0F] transition-colors">Whiteboard</a>
              <a href="#dashboard" className="hover:text-[#0F0F0F] transition-colors">Dashboard</a>
              <a href="/contact" className="hover:text-[#0F0F0F] transition-colors">Contact</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-[#E5E5E5]">
            <p className="text-[11px] text-[#A0A0A0]">
              © {new Date().getFullYear()} CodeBuddy — AI Coding Teacher Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}