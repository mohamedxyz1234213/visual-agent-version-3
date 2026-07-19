"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/Upload";
import { AuthGate } from "@/components/Auth/AuthGate";

function IconBoard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function IconArrowLeft({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function UploadPage() {
  return (
    <AuthGate>
      <UploadPageInner />
    </AuthGate>
  );
}

function UploadPageInner() {
  const router = useRouter();

  function handleReady(lessonId: string, seriesId?: string, totalLessons?: number) {
    const params = new URLSearchParams();
    if (seriesId) params.set("series", seriesId);
    if (totalLessons && totalLessons > 1) params.set("total", String(totalLessons));
    const qs = params.toString();
    router.push(`/lesson/${lessonId}${qs ? `?${qs}` : ""}`);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <IconBoard className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Whiteboard Classroom</div>
              <div className="text-sm font-semibold tracking-[-0.03em] text-slate-900">Create a lesson request</div>
            </div>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <IconArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:items-start lg:gap-8 lg:py-10">
        <div className="w-full lg:order-1">
          <UploadZone onReady={handleReady} />
        </div>

        <aside className="rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:px-6 lg:order-2 lg:sticky lg:top-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Quick Guide</div>
          <h1 className="app-display mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-[2.6rem]">Choose the source, then choose how it should teach.</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The main form is first. This sidebar only helps if you want a quick reminder of what each step means.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">Use a file for PDFs, worksheets, notes, or images you want the lesson to stay grounded in.</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">Use a teaching preset when you want the system to decide the right goal and whiteboard style for you.</div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">Open fine-tuning only when the preset is close but not exact.</div>
          </div>
        </aside>
      </div>
    </main>
  );
}