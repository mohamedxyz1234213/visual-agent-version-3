"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { Card, Button, Badge, Toaster, toast, EmptyState, cn } from "@/components/Admin/ui";
import { adminApi, type AdminRegistrationRequest } from "@/lib/api";

const STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_COLOR: Record<string, "slate" | "amber" | "blue" | "green" | "red"> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

export default function AdminRegistrationRequestsPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin" pageTitle="Student registration requests">
        <Body />
      </AdminShell>
    </AdminGuard>
  );
}

function Body() {
  const [items, setItems] = useState<AdminRegistrationRequest[]>([]);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { requests } = await adminApi.listRegistrationRequests(status || undefined, debounced || undefined);
      setItems(requests);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [status, debounced]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(req: AdminRegistrationRequest) {
    try {
      const r = await adminApi.approveRegistrationRequest(req.id);
      toast(`Approved — student code ${r.studentCode}`, "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approve failed", "error");
    }
  }

  async function handleReject(req: AdminRegistrationRequest) {
    const reason = window.prompt(`Reject the request from ${req.fullName}? Reason (optional):`) ?? undefined;
    if (reason === undefined) return;
    try {
      await adminApi.rejectRegistrationRequest(req.id, reason);
      toast("Request rejected", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reject failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Toaster />

      <Card className="!p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, email, or national ID…"
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
        <EmptyState title="No requests match these filters" hint="Try a different status or search term." />
      ) : (
        <div className="grid gap-3">
          {items.map((req) => (
            <Card key={req.id} className="!p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{req.fullName}</span>
                    <Badge color={STATUS_COLOR[req.status]}>{req.status}</Badge>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Age {req.age}</span>
                    {req.matchedSchoolYear && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{req.matchedSchoolYear.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">@{req.username} · {req.schoolEmail} · {req.parentPhone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">National ID: {req.nationalId}</p>
                  {req.status === "rejected" && req.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Rejected: {req.rejectionReason}</p>
                  )}
                </div>
                {req.status === "pending" && (
                  <div className="flex flex-shrink-0 gap-2">
                    <Button onClick={() => handleApprove(req)}>Approve</Button>
                    <Button variant="secondary" onClick={() => handleReject(req)}>Reject</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
