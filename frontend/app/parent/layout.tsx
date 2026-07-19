"use client";

import { Sidebar } from "@/components/shared";
import { Header } from "@/components/shared";

const parentNavItems = [
  { label: "Search Student", href: "/parent/search", icon: "🔍" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <Sidebar
        items={parentNavItems}
        title="CodeBuddy"
        subtitle="Parent Portal"
        logoColor="#22C55E"
      />
      <div className="ml-[260px] min-h-screen">
        <Header title="Parent Portal" accentColor="#22C55E" />
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
