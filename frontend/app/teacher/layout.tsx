"use client";

import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const teacherNavItems = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: "📊" },
  { label: "My Classes", href: "/teacher/my-classes", icon: "👥" },
  { label: "Lessons", href: "/teacher/lessons", icon: "📚" },
  { label: "Exercises", href: "/teacher/exercises", icon: "💻" },
  { label: "Exams", href: "/teacher/exams", icon: "📝" },
  { label: "Submissions", href: "/teacher/submissions", icon: "✅" },
  { label: "Analytics", href: "/teacher/analytics", icon: "📈" },
  { label: "Whiteboard", href: "/teacher/whiteboard", icon: "🎨" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, refresh } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) refresh();
  }, [initialized, refresh]);

  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (initialized && user && !["teacher", "admin", "super-admin"].includes(user.role)) {
      router.push("/login");
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-[#E5E5E5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <Sidebar
        items={teacherNavItems}
        title="CodeBuddy"
        subtitle={user.username}
        logoColor="#A78BFA"
      />
      <div className="ml-[260px] min-h-screen">
        <Header title="Teacher Portal" accentColor="#A78BFA" />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
