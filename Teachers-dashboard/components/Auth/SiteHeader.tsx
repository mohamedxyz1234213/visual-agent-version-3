"use client";

// ── Auth dependencies (commented out for open access) ───────────────────────
// import { useRouter } from "next/navigation";
// import { useAuthStore } from "@/store/authStore";

function IconWhiteboard({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
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
  // const router = useRouter();
  // const user = useAuthStore((s) => s.user);
  // const logout = useAuthStore((s) => s.logout);

  // async function handleLogout() {
  //   await logout();
  //   router.push("/login");
  // }

  return (
    <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shrink-0 shadow-sm">
            <IconWhiteboard />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{kicker}</div>
            <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          {/* 👤 User info + sign-out removed for open access */}
        </div>
      </div>
    </header>
  );
}
