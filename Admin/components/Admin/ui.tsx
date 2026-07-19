"use client";

import { useState, useEffect } from "react";

// ── A tiny Tailwind-aware class combiner ─────────────────────────────────────
export function cn(...args: Array<string | false | null | undefined>): string {
  return args.filter(Boolean).join(" ");
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "green" | "amber" | "red" | "blue" | "purple" | "teal" | "indigo" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", map[color])}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.05)]", className)}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, hint, color = "slate" }: { label: string; value: string | number; hint?: string; color?: "slate" | "green" | "amber" | "red" | "blue" | "purple" | "teal" | "indigo" }) {
  const map: Record<string, string> = {
    slate: "bg-white border-slate-200 text-slate-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    teal: "bg-teal-50 border-teal-200 text-teal-800",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
  };
  return (
    <div className={cn("rounded-[22px] border px-4 py-4 shadow-sm", map[color])}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1.5 leading-none">{label}</p>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-[11px] opacity-60 leading-snug">{hint}</p>}
    </div>
  );
}

// ── Modal (controlled) ──────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-lg" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn("w-full rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl", maxWidth)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-700 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 rounded-b-3xl flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ── Button (with primary/secondary/danger variants) ──────────────────────────
export function Button({ children, onClick, disabled, type = "button", variant = "primary", size = "md", title, form }: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  title?: string;
  form?: string;
}) {
  const v = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  }[variant];
  const s = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3.5 py-2 text-sm",
  }[size];
  return (
    <button
      type={type}
      form={form}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed", v, s)}
    >
      {children}
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/70 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon ?? <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" className="h-5 w-5"><circle cx="12" cy="12" r="9" /><path d="M9 12h6" strokeLinecap="round" /></svg>}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ── Toast (simple, top-right, auto-dismiss) ──────────────────────────────────
type Toast = { id: number; message: string; tone: "info" | "error" | "success" };
let _push: ((t: Omit<Toast, "id">) => void) | null = null;
export function toast(message: string, tone: Toast["tone"] = "info") { _push?.({ message, tone }); }

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    _push = (t) => {
      const id = Date.now() + Math.random();
      setItems((arr) => [...arr, { id, ...t }]);
      setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== id)), 3500);
    };
    return () => { _push = null; };
  }, []);
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur",
            t.tone === "error" ? "border-red-200 bg-red-50/95 text-red-800" :
            t.tone === "success" ? "border-emerald-200 bg-emerald-50/95 text-emerald-800" :
            "border-slate-200 bg-white/95 text-slate-800",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
