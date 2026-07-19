"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

/**
 * Wraps every admin page. Ensures the user is loaded and has the admin role;
 * otherwise redirects to /admin/login.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized, refresh } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!initialized) {
      refresh().finally(() => setReady(true));
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace("/admin/login"); return; }
    if (user.role !== "admin") { router.replace("/admin/login?denied=1"); return; }
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-blue-600" />
          Checking admin access…
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
