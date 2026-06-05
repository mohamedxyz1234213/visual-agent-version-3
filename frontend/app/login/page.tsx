"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { fetchBootstrapInfo, bootstrapFirstAdmin } from "@/lib/api";

function IconWhiteboard({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function IconMail({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function IconKey({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.85 12.15L20 3M16 7l3 3" strokeLinecap="round" />
    </svg>
  );
}
function IconShield({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M12 3l8 4v5a9 9 0 0 1-8 9 9 9 0 0 1-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Mode = "login" | "bootstrap";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { user, initialized, refresh, login } = useAuthStore();

  const [info, setInfo] = useState<{ has_admin: boolean; has_users: boolean } | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // bootstrap form (only shown when no users exist)
  const [bEmail, setBEmail] = useState("");
  const [bUsername, setBUsername] = useState("");
  const [bPassword, setBPassword] = useState("");

  useEffect(() => {
    if (!initialized) refresh();
  }, [initialized, refresh]);

  useEffect(() => {
    fetchBootstrapInfo().then(setInfo).catch(() => setInfo({ has_admin: true, has_users: true }));
  }, []);

  useEffect(() => {
    if (initialized && user) {
      router.replace(user.role === "admin" && next === "/" ? "/admin" : next);
    }
  }, [initialized, user, router, next]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await login(identifier.trim(), password);
      router.replace(u.role === "admin" && next === "/" ? "/admin" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await bootstrapFirstAdmin({ email: bEmail.trim(), username: bUsername.trim(), password: bPassword });
      // After bootstrap the user is already signed in (cookie set)
      await refresh();
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bootstrap failed");
    } finally {
      setBusy(false);
    }
  }

  const showBootstrap = info && !info.has_users;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <IconWhiteboard />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Whiteboard Classroom</div>
              <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">Sign in</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-6xl items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-12">
        {/* Left: pitch */}
        <div className="hidden lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Early Access</p>
          <h1 className="app-display mt-3 text-5xl font-semibold text-slate-900 leading-[1.05]">
            Turn any document into a teacher on the whiteboard.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
            We are onboarding a small group of educators and curious learners. Request early access and we will email you an invite when a slot opens. If you already have an account, sign in.
          </p>
          <div className="mt-6 grid max-w-md gap-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold"><IconKey /> Request access in under a minute</div>
              <p className="mt-1 text-xs leading-6 text-slate-500">Drop your email and a username. We will email you a one-time invite link when an administrator approves your request.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold"><IconShield /> Strict email + username match</div>
              <p className="mt-1 text-xs leading-6 text-slate-500">The signup form is pre-filled with the email and username you requested. If they do not match, you will be sent back to request access again.</p>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="mx-auto w-full max-w-md">
          {showBootstrap ? (
            <BootstrapCard
              email={bEmail} setEmail={setBEmail}
              username={bUsername} setUsername={setBUsername}
              password={bPassword} setPassword={setBPassword}
              onSubmit={handleBootstrap}
              busy={busy}
              error={error}
            />
          ) : (
            <LoginCard
              identifier={identifier} setIdentifier={setIdentifier}
              password={password} setPassword={setPassword}
              onSubmit={handleLogin}
              busy={busy}
              error={error}
            />
          )}

          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-slate-500">
            {!showBootstrap && (
              <Link
                href="/request-access"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <IconMail />
                Request early access
              </Link>
            )}
            <p className="text-xs text-slate-400">
              Approved requests receive a one-time email with a link to create your account.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── LoginCard ────────────────────────────────────────────────────────────────
function LoginCard(props: {
  identifier: string; setIdentifier: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; busy: boolean; error: string | null;
}) {
  return (
    <form onSubmit={props.onSubmit} className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Sign in</p>
      <h2 className="app-display mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">Welcome back.</h2>
      <p className="mt-1 text-sm text-slate-500">Use the email or username from your invite, plus the password you set when you activated it.</p>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Email or username</span>
          <input
            type="text"
            autoComplete="username"
            required
            value={props.identifier}
            onChange={(e) => props.setIdentifier(e.target.value)}
            placeholder="you@school.edu"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={props.password}
            onChange={(e) => props.setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
          />
        </label>
      </div>

      {props.error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {props.error}
        </p>
      )}

      <button
        type="submit"
        disabled={props.busy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {props.busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

// ── BootstrapCard ────────────────────────────────────────────────────────────
function BootstrapCard(props: {
  email: string; setEmail: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; busy: boolean; error: string | null;
}) {
  return (
    <form onSubmit={props.onSubmit} className="rounded-[28px] border border-amber-200 bg-amber-50/60 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">First-time setup</p>
      <h2 className="app-display mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">Create the first admin account.</h2>
      <p className="mt-1 text-sm text-slate-600">
        This screen only appears the very first time Whiteboard Teacher runs. After this account exists, you will only be able to sign in here or via an approved invite.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Email</span>
          <input
            type="email"
            required
            value={props.email}
            onChange={(e) => props.setEmail(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Username</span>
          <input
            type="text"
            required
            minLength={3}
            value={props.username}
            onChange={(e) => props.setUsername(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Password (min 8 characters)</span>
          <input
            type="password"
            required
            minLength={8}
            value={props.password}
            onChange={(e) => props.setPassword(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>
      </div>

      {props.error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {props.error}
        </p>
      )}

      <button
        type="submit"
        disabled={props.busy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {props.busy ? "Creating admin…" : "Create admin account"}
      </button>
    </form>
  );
}
