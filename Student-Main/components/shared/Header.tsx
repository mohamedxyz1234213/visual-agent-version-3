"use client";

import { useState, useEffect } from "react";
import { logoutRequest } from "@/lib/api";
import { useNotifications } from "@/features/student/hooks";
import { markNotificationRead, markAllNotificationsRead } from "@/features/student/api";
import {
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
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, refresh } = useNotifications();

  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      // Refresh notifications when opening panel
      refresh();
    }
  }, [showNotifications, refresh]);

  async function handleLogout() {
    await logoutRequest();
    onLogout?.();
    window.location.href = "/login";
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    refresh();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    refresh();
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-0 py-4 sm:py-8 mb-4 sm:mb-6">
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
          <h1 className="text-[20px] sm:text-[28px] font-bold text-[#0F0F0F] tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] sm:text-[13px] text-[#6B6B6B] mt-0.5 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Date label */}
        <span className="text-[13px] text-[#6B6B6B] hidden lg:block">
          {new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>

        {/* Notification bell with real count */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flux-icon-chip hover:bg-gray-200 transition-colors"
          >
            <IconBell size={18} className="text-[#6B6B6B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#D6F63E] text-[9px] font-bold text-[#0F0F0F] rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-[380px] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-[500px] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (                      <div className="px-5 py-10 text-center text-sm text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n._id}
                        className={`px-5 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.isRead ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => !n.isRead && handleMarkRead(n._id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                            {n.message && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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
