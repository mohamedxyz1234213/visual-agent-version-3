"use client";

import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const studentNavItems = [
  { label: "Dashboard", href: "/student/dashboard", icon: "📊" },
  { label: "Learn", href: "/student/learn", icon: "📚" },
  { label: "Avatar Teacher", href: "/student/avatar-teacher", icon: "🤖" },
  { label: "Exercises", href: "/student/exercises", icon: "💻" },
  { label: "Challenges", href: "/student/challenges", icon: "🏆" },
  { label: "Leaderboard", href: "/student/leaderboard", icon: "🥇" },
  { label: "Achievements", href: "/student/achievements", icon: "⭐" },
  { label: "Progress", href: "/student/progress", icon: "📈" },
  { label: "Whiteboard", href: "/student/whiteboard", icon: "🎨" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, refresh } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) refresh();
  }, [initialized, refresh]);

  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (initialized && user && user.role !== "student" && user.role !== "admin") {
      router.push("/login");
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#D4F542] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <Sidebar
        items={studentNavItems}
        title="CodeBuddy"
        subtitle={`${user.username}`}
        logoColor="#D4F542"
        bottomContent={
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-400">Level</span>
              <span className="text-sm font-bold text-[#D4F542]">1</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#D4F542] rounded-full" style={{ width: "35%" }} />
            </div>
            <span className="text-[10px] text-gray-500 mt-1 block">350 / 500 XP</span>
          </div>
        }
      />
      <div className="ml-[260px] min-h-screen">
        <Header title="Student Portal" accentColor="#D4F542" />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
