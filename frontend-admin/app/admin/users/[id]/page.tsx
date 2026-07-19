"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { Card, Badge, Toaster, EmptyState, Button } from "@/components/Admin/ui";
import { adminApi, type AdminLesson, type AdminUser } from "@/lib/api";

export default function AdminUserDetailPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin" pageTitle="User detail">
        <Body />
      </AdminShell>
    </AdminGuard>
  );
}

function Body() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    setLoading(true);
    adminApi.getUserLessons(id)
      .then((r) => { setUser(r.user as AdminUser); setLessons(r.lessons); })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (error) return <Card><p className="text-sm text-red-700">{error}</p></Card>;
  if (!user) return <Card><p className="text-sm text-slate-500">User not found.</p></Card>;

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{user.username}</h2>
              <Badge color={user.role === "admin" ? "indigo" : "slate"}>{user.role}</Badge>
              {user.status === "disabled" && <Badge color="red">Disabled</Badge>}
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs text-slate-400">
              {user.ai_requests_used} / {user.max_ai_requests} AI lessons used · {user.lessons_count} lessons in DB
              {user.last_login_at && ` · last login ${new Date(user.last_login_at).toLocaleString()}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/admin/users")}>← Back to users</Button>
            <Link href={`/admin/users/${user.id}`} className="hidden">refresh</Link>
          </div>
        </div>
      </Card>

      {lessons.length === 0 ? (
        <EmptyState title="No lessons yet" hint="This user has not generated any lessons." />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_0.7fr_0.5fr_0.4fr_auto] gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Lesson</span>
            <span>Status</span>
            <span>Parts</span>
            <span>Series</span>
            <span></span>
          </div>
          <ul className="divide-y divide-slate-100">
            {lessons.map((l) => (
              <li key={l.id} className="grid grid-cols-[1.5fr_0.7fr_0.5fr_0.4fr_auto] items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{l.title || "Untitled"}</p>
                  <p className="truncate text-[11px] text-slate-500">{l.source_filename}</p>
                </div>
                <span>
                  <Badge color={l.status === "ready" ? "green" : l.status === "processing" ? "amber" : "red"}>{l.status}</Badge>
                </span>
                <span className="text-sm tabular-nums text-slate-700">{l.parts_count}</span>
                <span className="text-sm text-slate-700 tabular-nums">{l.total_lessons > 1 ? `${l.lesson_index + 1}/${l.total_lessons}` : "—"}</span>
                <Link href={`/admin/lessons/${l.id}`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Preview →</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
