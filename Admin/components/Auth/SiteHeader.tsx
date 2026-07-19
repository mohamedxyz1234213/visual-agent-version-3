"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

function IconWhiteboard({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function IconLogout({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconUser({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

export function SiteHeader({
  kicker = "Whiteboard Classroom",
  title,
  rightSlot,
}: {
  kicker?: string;
  title: string;
  rightSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <button
          onClick={() => router.push(user?.role === "admin" ? "/admin" : "/")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shrink-0 shadow-sm">
            <IconWhiteboard />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{kicker}</div>
            <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">{title}</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {rightSlot}
          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs">
                <IconUser />
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-slate-800">{user.username}</span>
                  <span className="text-[10px] text-slate-400">
                    {user.role === "admin" ? "Admin" : `${user.ai_requests_used}/${user.max_ai_requests} lessons`}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                title="Sign out"
              >
                <IconLogout />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
