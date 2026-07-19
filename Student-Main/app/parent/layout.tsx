"use client";

import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";

const parentNavItems = [
  { label: "Search Student", href: "/parent/search", icon: "search" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Sidebar
        items={parentNavItems}
        title="CodeBuddy"
        subtitle="Parent Portal"
      />
      <main className="ml-[244px] min-h-screen p-5">
        <Header title="Parent Portal" subtitle="Track your child's progress" />
        {children}
      </main>
    </div>
  );
}
