"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { verifyInvite, completeSignup } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function IconWhiteboard({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function IconLock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const { refresh } = useAuthStore();

  const [invite, setInvite] = useState<{ email: string; username: string; expires_at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!token) return;
    verifyInvite(token)
      .then(setInvite)
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid invite"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !invite) return;
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      await completeSignup({
        token,
        email: invite.email,
        username: invite.username,
        password,
      });
      await refresh();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <IconWhiteboard className="h-5 w-5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Whiteboard Classroom</div>
              <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">Create your account</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-3xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {!invite && !error ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-blue-600" />
                Verifying your invite…
              </div>
            </div>
          ) : error ? (
            <ErrorCard message={error} />
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">You&apos;re approved</p>
              <h1 className="app-display mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">Set your password.</h1>
              <p className="mt-1 text-sm text-slate-500">
                Your account is bound to the email and username you originally requested. They are shown below and cannot be changed here.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                <Field label="Email" value={invite!.email} />
                <Field label="Username" value={invite!.username} />
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Password (min 8 characters)</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-2xl sm:rounded-xl border border-slate-200 bg-white px-4 py-4 sm:py-2.5 text-base sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Confirm password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="rounded-2xl sm:rounded-xl border border-slate-200 bg-white px-4 py-4 sm:py-2.5 text-base sm:text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-4 sm:py-3 text-base sm:text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <IconLock className="h-5 w-5 sm:h-4 sm:w-4" />
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="font-mono text-sm text-slate-800 truncate">{value}</span>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-[28px] border border-red-200 bg-red-50/60 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-red-700">Invite problem</p>
      <h1 className="app-display mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">We could not use this invite.</h1>
      <p className="mt-2 text-sm leading-7 text-slate-700">{message}</p>
      <p className="mt-2 text-sm text-slate-500">
        If the email or username you entered do not match the original request, please request early access again from the start.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/request-access"
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-4 sm:py-2.5 text-base sm:text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Request early access
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-4 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
