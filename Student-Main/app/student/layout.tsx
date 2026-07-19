"use client";

import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { label: "Learn", href: "/student/learn", icon: "book" },
  { label: "Avatar Teacher", href: "/student/avatar-teacher", icon: "robot" },
  { label: "Exercises", href: "/student/exercises", icon: "code" },
  { label: "Challenges", href: "/student/challenges", icon: "trophy" },
  { label: "Leaderboard", href: "/student/leaderboard", icon: "award" },
  { label: "Achievements", href: "/student/achievements", icon: "star" },
  { label: "Progress", href: "/student/progress", icon: "trending" },
  { label: "Whiteboard", href: "/student/whiteboard", icon: "palette" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, refresh } = useAuthStore();
  const router = useRouter();

  useEffect(() => { if (!initialized) refresh(); }, [initialized, refresh]);
  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (initialized && user && user.role !== "student" && user.role !== "admin") router.push("/login");
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#D6F63E] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Sidebar items={studentNavItems} title="CodeBuddy" subtitle={user.username} />
      <main className="ml-[244px] min-h-screen p-5">
        <Header title="Dashboard" subtitle="Take control of your learning journey" username={user.username} />
        {children}
      </main>
    </div>
  );
}
