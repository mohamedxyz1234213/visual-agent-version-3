"use client";

import { Bell, Search, ChevronDown, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";
import { logoutRequest } from "@/lib/api";

interface HeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
}

export function Header({ title, subtitle, accentColor = "#D4F542" }: HeaderProps) {
  const { user, setUser } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);

  async function handleLogout() {
    await logoutRequest();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      {/* Left: Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#18181B]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ focusRingColor: accentColor }}
            placeholder="Search lessons, exercises..."
          />
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>

        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span
            className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ backgroundColor: accentColor, color: "#18181B" }}
          >
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                 style={{ backgroundColor: accentColor, color: "#18181B" }}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block text-[#18181B] font-medium">{user?.username || "User"}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-[#18181B]">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-[#D4F542]/20 text-[#18181B]">
                    {user?.role || "user"}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
