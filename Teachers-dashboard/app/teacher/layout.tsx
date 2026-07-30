"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";
// import { useAuthStore } from "@/store/authStore";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import { useClasses } from "@/features/teacher/hooks";

const teacherNavItems = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
  { label: "My Classes", href: "/teacher/my-classes", icon: "users" },
  { label: "Add Students", href: "/teacher/registration-requests", icon: "users" },
  { label: "Lesson Paths", href: "/teacher/lesson-paths", icon: "book" },
  { label: "AI Lessons", href: "/teacher/ai-lessons", icon: "robot" },
  { label: "Exercises", href: "/teacher/exercises", icon: "code" },
  { label: "Exams", href: "/teacher/exams", icon: "clipboard" },
  { label: "Challenges", href: "/teacher/challenges", icon: "trophy" },
  { label: "Submissions", href: "/teacher/submissions", icon: "check" },
  { label: "Analytics", href: "/teacher/analytics", icon: "chart" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  // const { user, initialized, refresh } = useAuthStore();
  // const router = useRouter();
  // const { classes } = useClasses();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Flatten all students from all classes for the notification compose modal
  // const allStudents = Object.values(classes || {}).flat().map((s: any) => ({
  //   id: s.id,
  //   username: s.username || s.studentCode,
  //   studentCode: s.studentCode,
  //   section: s.section || '',
  // }));

  // ── Auth enforcement (commented out for open access) ──────────────────────
  // useEffect(() => { if (!initialized) refresh(); }, [initialized, refresh]);
  // useEffect(() => {
  //   if (initialized && !user) router.push("/login");
  //   if (initialized && user && !["teacher", "admin", "super-admin"].includes(user.role)) router.push("/login");
  // }, [initialized, user, router]);

  // ── Loading guard (removed for open access) ──────────────────────────────
  // if (!initialized || !user) {
  //   return <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#C4B5F5] border-t-transparent rounded-full animate-spin" /></div>;
  // }

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Sidebar items={teacherNavItems} title="CodeBuddy" subtitle={"Guest"} isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className={`min-h-screen p-5 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[244px]' : 'ml-[96px]'}`}>
        <Header title="Teacher Portal" subtitle="Manage your classes" username={"Guest"} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        {children}
      </main>
    </div>
  );
}
