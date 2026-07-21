"use client";

import { useState } from "react";
import { logoutRequest } from "@/lib/api";
import {
  IconSearch,
  IconBell,
  IconChevronDown,
  IconLogout,
  IconUser,
} from "./FluxIcons";

interface HeaderProps {
  title: string;
  subtitle?: string;
  username?: string;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ title, subtitle, username, onLogout, onToggleSidebar }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);

  async function handleLogout() {
    await logoutRequest();
    onLogout?.();
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-0 py-4 mb-6">
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-[#0F0F0F] tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-[#6B6B6B] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Search + Date + Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Pill search */}
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
          />
          <input
            className="flux-pill-input w-[200px] text-[14px]"
            placeholder="Search..."
          />
        </div>

        {/* Date label */}
        <span className="text-[13px] text-[#6B6B6B] hidden lg:block">
          {new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>

        {/* Today pill */}
        <button className="flux-btn-outline flex items-center gap-1.5 px-3 py-2 text-[13px]">
          Today
          <IconChevronDown size={14} />
        </button>

        {/* Notification bell */}
        <button className="relative flux-icon-chip hover:bg-gray-200 transition-colors">
          <IconBell size={18} className="text-[#6B6B6B]" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D6F63E] text-[9px] font-bold text-[#0F0F0F] rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white/60 rounded-pill transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#C4B5F5] flex items-center justify-center">
              <IconUser size={16} className="text-[#0F0F0F]" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[13px] font-semibold text-[#0F0F0F] leading-tight">
                {username || "User"}
              </span>
              <span className="text-[11px] text-[#6B6B6B] leading-tight">
                Student
              </span>
            </div>
            <IconChevronDown size={14} className="text-[#6B6B6B]" />
          </button>

          {showProfile && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-[20px] shadow-card py-2 z-50">
                <div className="px-4 py-3 border-b border-[#E5E5E5]">
                  <p className="text-[14px] font-semibold text-[#0F0F0F]">
                    {username}
                  </p>
                  <span className="flux-badge-lime mt-1 inline-block">
                    student
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#6B6B6B] hover:bg-gray-50 transition-colors"
                >
                  <IconLogout size={16} />
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
