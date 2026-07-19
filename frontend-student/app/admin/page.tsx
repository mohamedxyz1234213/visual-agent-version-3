"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { StatCard, Card, Button, Toaster, Badge, EmptyState } from "@/components/Admin/ui";
import { adminApi, type AdminStats } from "@/lib/api";

function IconArrowRight({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}><path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function AdminOverviewPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin Panel" pageTitle="Overview">
        <OverviewBody />
      </AdminShell>
    </AdminGuard>
  );
}

function OverviewBody() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-slate-500">Loading overview…</div>;
  if (error || !stats) return <Card><p className="text-sm text-red-700">{error || "Failed to load."}</p></Card>;

  return (
    <div className="flex flex-col gap-6">
      <Toaster />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Pending access" value={stats.early_access.pending} color="amber" hint="Awaiting your review" />
        <StatCard label="Approved" value={stats.early_access.approved} color="blue" hint="Invites sent" />
        <StatCard label="Users" value={stats.users.total} color="slate" hint={`${stats.users.by_status?.active || 0} active`} />
        <StatCard label="Lessons" value={stats.lessons.total} color="teal" />
        <StatCard label="AI requests" value={stats.ai_requests.total} color="indigo" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">7-day activity</p>
          <div className="mt-3 flex flex-col gap-2">
            <ActivityRow label="Logins" value={stats.activity_7d.logins} color="bg-blue-500" />
            <ActivityRow label="AI lesson generations" value={stats.activity_7d.ai_requests} color="bg-indigo-500" />
            <ActivityRow label="Early-access requests" value={stats.activity_7d.early_access} color="bg-amber-500" />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Quick actions</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ActionTile
              href="/admin/early-access?status=pending"
              title="Review early access"
              desc={`${stats.early_access.pending} request${stats.early_access.pending === 1 ? "" : "s"} waiting`}
              tone="amber"
            />
            <ActionTile
              href="/admin/users"
              title="Manage users"
              desc="Adjust quotas, disable accounts, or add a user directly."
            />
            <ActionTile
              href="/admin/lessons"
              title="Browse lessons"
              desc="Preview any lesson in the system. Inspect per-user output."
            />
            <ActionTile
              href="/admin/logs/login"
              title="View login logs"
              desc="See who has signed in, and any failed attempts."
            />
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Lesson status</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge color="amber">{stats.lessons.by_status?.processing || 0} processing</Badge>
          <Badge color="green">{stats.lessons.by_status?.ready || 0} ready</Badge>
          <Badge color="red">{stats.lessons.by_status?.error || 0} errors</Badge>
        </div>
        <div className="mt-4">
          <Link href="/admin/lessons" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">
            Open lessons dashboard <IconArrowRight />
          </Link>
        </div>
      </Card>
    </div>
  );
}

function ActivityRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="flex-1 text-sm text-slate-700">{label}</span>
      <span className="tabular-nums text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function ActionTile({ href, title, desc, tone }: { href: string; title: string; desc: string; tone?: "amber" }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white/80 p-4 transition hover:border-slate-300 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{desc}</p>
        </div>
        {tone === "amber" && <Badge color="amber">Action</Badge>}
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 group-hover:text-blue-900">
        Open <IconArrowRight />
      </span>
    </Link>
  );
}
