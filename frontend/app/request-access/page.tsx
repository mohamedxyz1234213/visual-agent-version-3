"use client";

import { useState } from "react";
import Link from "next/link";
import { requestEarlyAccess } from "@/lib/api";

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
function IconCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.4" stroke="currentColor" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconArrowLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RequestAccessPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await requestEarlyAccess({
        email: email.trim(),
        username: username.trim().toLowerCase(),
        reason: reason.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <IconWhiteboard />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Whiteboard Classroom</div>
              <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">Request early access</div>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <IconArrowLeft />
            Back to sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-5xl items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_360px]">
        <div className="mx-auto w-full max-w-xl">
          {submitted ? (
            <SubmittedCard email={email} username={username} />
          ) : (
            <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Early access</p>
              <h1 className="app-display mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">Tell us a little about you.</h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                An administrator will review your request and email a one-time invite to the address below. The invite is bound to <em>this</em> email and username — make sure they are correct.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Username (3–32 chars · lowercase · letters, digits, . _ -)</span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="ms.lee"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Why are you interested? (optional)</span>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="I teach 8th-grade math and would like to turn worksheets into lessons…"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                <IconMail />
                {busy ? "Sending request…" : "Request early access"}
              </button>
            </form>
          )}
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">What happens next</p>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <Step n={1} title="We review your request" body="An administrator checks the queue and decides who to onboard this round." />
            <Step n={2} title="You receive an email" body="If approved, we email a one-time invite link bound to the email and username you submitted." />
            <Step n={3} title="Set your password" body="The link opens a signup form. The email and username are pre-filled and locked — they must match your request exactly." />
            <Step n={4} title="Start teaching" body="Sign in and create lessons. The admin can raise your AI lesson quota at any time." />
          </ol>
        </aside>
      </div>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">{n}</span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs leading-5 text-slate-500">{body}</p>
      </div>
    </li>
  );
}

function SubmittedCard({ email, username }: { email: string; username: string }) {
  return (
    <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
        <IconCheck />
      </div>
      <h1 className="app-display mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-900">Request received.</h1>
      <p className="mt-2 text-sm leading-7 text-slate-700">
        We sent your request for <span className="font-semibold text-slate-900">{username}</span> at <span className="font-semibold text-slate-900">{email}</span> to the administrator queue. You will get an email at the same address the moment it is approved.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to sign in
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
