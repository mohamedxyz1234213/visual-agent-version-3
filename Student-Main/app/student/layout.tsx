"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { label: "Avatar Teacher", href: "/student/avatar-teacher", icon: "robot" },
  { label: "Exercises", href: "/student/exercises", icon: "code" },
  { label: "Exams", href: "/student/exams", icon: "clipboard" },
  { label: "Challenges", href: "/student/challenges", icon: "trophy" },
  { label: "Leaderboard", href: "/student/leaderboard", icon: "award" },
  { label: "Achievements", href: "/student/achievements", icon: "star" },
  { label: "Progress", href: "/student/progress", icon: "trending" },
  { label: "Whiteboard", href: "/student/whiteboard", icon: "palette" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, refresh } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingCheckDone, setOnboardingCheckDone] = useState(false);

  useEffect(() => { if (!initialized) refresh(); }, [initialized, refresh]);
  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (initialized && user && user.role !== "student" && user.role !== "admin") router.push("/login");
  }, [initialized, user, router]);

  // Redirect to onboarding if student hasn't completed it
  useEffect(() => {
    if (!initialized || !user || user.role !== "student") return;
    if (pathname === "/student/onboarding") { setOnboardingCheckDone(true); return; }
    if (onboardingCheckDone || pathname.startsWith("/login")) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${apiBase}/student/adaptive-onboarding-status`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.onboardingCompleted && pathname !== "/student/onboarding") {
          router.push("/student/onboarding");
        }
        setOnboardingCheckDone(true);
      })
      .catch(() => setOnboardingCheckDone(true));
  }, [initialized, user, pathname, onboardingCheckDone, router]);

  if (!initialized || !user) {
    return <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#D6F63E] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Sidebar items={studentNavItems} title="CodeBuddy" subtitle={user.username} isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`min-h-screen p-3 sm:p-5 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-[244px]' : 'lg:ml-[96px]'}`}>
        <Header title="Dashboard" subtitle="Take control of your learning journey" username={user.username} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </main>
    </div>
  );
}
