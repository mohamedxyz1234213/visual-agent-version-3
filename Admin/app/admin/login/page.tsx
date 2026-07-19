"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { fetchBootstrapInfo } from "@/lib/api";

function IconShield({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M12 3l8 4v5a9 9 0 0 1-8 9 9 9 0 0 1-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginPageInner />
    </Suspense>
  );
}

function AdminLoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const denied = params.get("denied") === "1";
  const { user, initialized, refresh, login } = useAuthStore();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!initialized) refresh();
    fetchBootstrapInfo().then((i) => setHasAdmin(i.has_admin)).catch(() => setHasAdmin(true));
  }, [initialized, refresh]);

  useEffect(() => {
    if (initialized && user?.role === "admin") router.replace("/admin");
  }, [initialized, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(identifier.trim(), password);
      if (u.role !== "admin") {
        setError("This account does not have admin privileges. Sign in via the user site.");
        return;
      }
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <IconShield className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Admin Panel</p>
          <h1 className="app-display mt-1 text-3xl font-semibold tracking-[-0.03em] text-slate-900">Sign in to administer.</h1>
        </div>

        {denied && (
          <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            That account doesn&apos;t have admin access. Sign in with an admin account.
          </p>
        )}

        {hasAdmin === false && (
          <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            No admin account exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in the backend <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[12px]">.env</code>, restart, then return here.
          </p>
        )}

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Email or username</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
          </div>
          {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            Looking for the user site? <a href="/login" className="text-slate-600 underline">Sign in here</a>.
          </p>
        </form>
      </div>
    </main>
  );
}
