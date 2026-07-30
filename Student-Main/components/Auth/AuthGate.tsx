"use client";

// ── Auth enforcement (commented out for open access) ────────────────────────
// import { useEffect, useState } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useAuthStore } from "@/store/authStore";

/**
 * Wraps a page that requires authentication. On mount, ensures the auth state
 * is loaded. While loading, renders a soft skeleton. If unauthenticated, pushes
 * to /login (preserving the current path as a `?next=` redirect). Admins get
 * bounced to /admin when they hit the user dashboard root.
 */
export function AuthGate({ children }: { children: React.ReactNode; requireAdmin?: boolean }) {
  // const router = useRouter();
  // const pathname = usePathname();
  // const { user, initialized, refresh } = useAuthStore();
  // const [ready, setReady] = useState(false);

  // useEffect(() => {
  //   if (!initialized) {
  //     refresh().finally(() => setReady(true));
  //   } else {
  //     setReady(true);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // useEffect(() => {
  //   if (!ready) return;
  //   if (!user) {
  //     const next = encodeURIComponent(pathname || "/");
  //     router.replace(`/login?next=${next}`);
  //     return;
  //   }
  //   if (requireAdmin && user.role !== "admin") {
  //     router.replace("/");
  //   }
  // }, [ready, user, requireAdmin, router, pathname]);

  // if (!ready || !user) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
  //       <div className="flex items-center gap-3 text-sm text-slate-500">
  //         <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 border-t-blue-600" />
  //         Checking access…
  //       </div>
  //     </div>
  //   );
  // }
  // if (requireAdmin && user.role !== "admin") return null;
  return <>{children}</>;
}
