"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href: "/admin", label: "Overview", icon: IconGrid },
  { href: "/admin/early-access", label: "Early Access", icon: IconMail },
  { href: "/admin/registration-requests", label: "Student Registrations", icon: IconUsers },
  { href: "/admin/users", label: "Users", icon: IconUsers },
  { href: "/admin/lessons", label: "Lessons", icon: IconBoard },
  { href: "/admin/logs/login", label: "Login Logs", icon: IconKey },
  { href: "/admin/logs/ai", label: "AI Requests", icon: IconSparkles },
  { href: "/admin/logs/pages", label: "Page Logs", icon: IconChart },
];

export function AdminShell({ children, pageTitle, pageKicker, pageActions }: {
  children: React.ReactNode;
  pageTitle?: string;
  pageKicker?: string;
  pageActions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, initialized, refresh, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Bootstrap auth state (no redirect here — that's handled in /admin/login + page-level guards)
  if (!initialized && typeof window !== "undefined") {
    refresh();
  }

  async function handleLogout() {
    await logout();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] text-slate-900">
      {/* ── Top header (visible on every admin page) ───────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
              aria-label="Toggle menu"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4 w-4">
                <path d="M12 3l8 4v5a9 9 0 0 1-8 9 9 9 0 0 1-8-9V7l8-4z" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Admin Panel</div>
              <div className="text-sm font-semibold tracking-[-0.02em] text-slate-900 truncate">
                {pageKicker || "Whiteboard Teacher"}{pageTitle ? ` · ${pageTitle}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              ← User site
            </Link>
            {user && (
              <>
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs">
                  <span className="font-semibold text-slate-800">{user.username}</span>
                  <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Admin</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:gap-6">
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className={`${mobileOpen ? "block" : "hidden"} lg:block w-full lg:w-60 lg:shrink-0`}
        >
          <nav className="sticky top-20 rounded-[24px] border border-slate-200/80 bg-white/90 p-2 shadow-[0_18px_42px_rgba(15,23,42,0.05)]">
            <ul className="flex flex-col gap-0.5">
              {NAV.map((item) => {
                const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
              Admin actions are logged with the admin&apos;s identity. Use them carefully.
            </div>
          </nav>
        </aside>

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          {(pageTitle || pageActions) && (
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {pageKicker && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{pageKicker}</p>
                )}
                {pageTitle && (
                  <h1 className="app-display mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-3xl">{pageTitle}</h1>
                )}
              </div>
              {pageActions && <div className="flex flex-wrap items-center gap-2">{pageActions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function IconGrid({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}
function IconMail({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
}
function IconUsers({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><circle cx="9" cy="9" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0" /><path d="M16 11a3 3 0 0 0 0-6" /><path d="M22 20a6 6 0 0 0-5-5.92" /></svg>;
}
function IconBoard({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
}
function IconKey({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><circle cx="8" cy="15" r="4" /><path d="M10.85 12.15L20 3M16 7l3 3" strokeLinecap="round" /></svg>;
}
function IconSparkles({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" /></svg>;
}
function IconChart({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}><path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 14l4-4 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
