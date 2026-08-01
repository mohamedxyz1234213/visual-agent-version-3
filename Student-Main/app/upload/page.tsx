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
    <main className="flex min-h-screen flex-col bg-white">
      {/* Minimal header */}
      <header className="border-b border-slate-100 px-4 py-3">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <IconBoard className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Visual Teaching AI</span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <IconArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
        </div>
      </header>

      {/* Chat-style centered content */}
      <div className="flex flex-1 flex-col items-center">
        <div className="w-full max-w-[720px] flex-1 px-3 sm:px-4 py-4 sm:py-6">
          <UploadZone onReady={handleReady} />
        </div>
      </div>
    </main>
  );
}