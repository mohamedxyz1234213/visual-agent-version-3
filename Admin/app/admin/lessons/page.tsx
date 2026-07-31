"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { Card, Badge, Toaster, toast, EmptyState, Button, cn } from "@/components/Admin/ui";
import { adminApi, type AdminLesson } from "@/lib/api";

const STATUSES = [
  { id: "", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "processing", label: "Processing" },
  { id: "error", label: "Error" },
];

export default function AdminLessonsPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin" pageTitle="All lessons">
        <Body />
      </AdminShell>
    </AdminGuard>
  );
}

function Body() {
  const [items, setItems] = useState<AdminLesson[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.listLessons(debounced || undefined, status || undefined)); }
    catch (err) { toast(err instanceof Error ? err.message : "Failed to load", "error"); }
    finally { setLoading(false); }
  }, [debounced, status]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(l: AdminLesson) {
    if (!confirm(`Delete lesson "${l.title}" and all its parts?`)) return;
    try {
      await adminApi.deleteLesson(l.id);
      toast("Deleted", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <Card className="!p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, subject, or filename…"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <div className="flex flex-wrap gap-1">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  status === s.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No lessons match these filters" />
      ) : (
        <Card className="!p-0 overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[1.5fr_0.7fr_0.6fr_0.4fr_0.7fr_auto] gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Lesson</span>
            <span>Owner</span>
            <span>Status</span>
            <span>Parts</span>
            <span>Created</span>
            <span></span>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map((l) => (
              <li key={l.id} className="grid min-w-[720px] grid-cols-[1.5fr_0.7fr_0.6fr_0.4fr_0.7fr_auto] items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{l.title || "Untitled"}</p>
                  <p className="truncate text-[11px] text-slate-500">{l.source_filename}</p>
                </div>
                <div className="min-w-0">
                  {l.owner ? (
                    <Link href={`/admin/users/${l.owner.id}`} className="block truncate text-sm text-slate-700 hover:text-blue-700">
                      {l.owner.username || l.owner.email}
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">— orphan —</span>
                  )}
                </div>
                <span><Badge color={l.status === "ready" ? "green" : l.status === "processing" ? "amber" : "red"}>{l.status}</Badge></span>
                <span className="text-sm tabular-nums text-slate-700">{l.parts_count}</span>
                <span className="text-xs text-slate-500">{new Date(l.created_at).toLocaleDateString()}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/lessons/${l.id}`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Preview</Link>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(l)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
