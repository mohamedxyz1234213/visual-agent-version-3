"use client";

import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const teacherNavItems = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
  { label: "My Classes", href: "/teacher/my-classes", icon: "users" },
  { label: "Lessons", href: "/teacher/lessons", icon: "book" },
  { label: "Exercises", href: "/teacher/exercises", icon: "code" },
  { label: "Exams", href: "/teacher/exams", icon: "clipboard" },
  { label: "Submissions", href: "/teacher/submissions", icon: "check" },
  { label: "Analytics", href: "/teacher/analytics", icon: "chart" },
  { label: "Whiteboard", href: "/teacher/whiteboard", icon: "palette" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, refresh } = useAuthStore();
  const router = useRouter();

  useEffect(() => { if (!initialized) refresh(); }, [initialized, refresh]);
  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (initialized && user && !["teacher", "admin", "super-admin"].includes(user.role)) router.push("/login");
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#C4B5F5] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Sidebar items={teacherNavItems} title="CodeBuddy" subtitle={user.username} />
      <main className="ml-[244px] min-h-screen p-5">
        <Header title="Teacher Portal" subtitle="Manage your classes" username={user.username} />
        {children}
      </main>
    </div>
  );
}
