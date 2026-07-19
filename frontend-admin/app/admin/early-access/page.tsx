"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { Card, Button, Badge, Toaster, toast, EmptyState, Modal, cn } from "@/components/Admin/ui";
import { adminApi, type AdminEarlyAccessRequest } from "@/lib/api";

const STATUSES = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
  { id: "expired", label: "Expired" },
];

const STATUS_COLOR: Record<string, "slate" | "amber" | "blue" | "green" | "red"> = {
  pending: "amber",
  approved: "blue",
  completed: "green",
  rejected: "red",
  expired: "slate",
};

export default function AdminEarlyAccessPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin" pageTitle="Early access requests">
        <Body />
      </AdminShell>
    </AdminGuard>
  );
}

function Body() {
  const [items, setItems] = useState<AdminEarlyAccessRequest[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminEarlyAccessRequest | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteChannel, setInviteChannel] = useState<string | null>(null);
  const [invitePreviewUrl, setInvitePreviewUrl] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState<"smtp" | "ethereal" | "console" | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testEmailSending, setTestEmailSending] = useState(false);

  useEffect(() => {
    adminApi
      .emailMode()
      .then((r) => setEmailMode(r.mode))
      .catch(() => setEmailMode(null));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminApi.listEarlyAccess(status || undefined, debounced || undefined);
      setItems(list);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [status, debounced]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(req: AdminEarlyAccessRequest) {
    try {
      const r = await adminApi.approveEarlyAccess(req.id);
      toast(r.invite.delivered ? `Invite sent to ${req.email}` : `Invite created (channel: ${r.invite.channel})`, "success");
      setInviteUrl(r.invite.url);
      setInviteChannel(r.invite.channel);
      setInvitePreviewUrl(r.invite.previewUrl || null);
      setSelected(r.request);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Approve failed", "error");
    }
  }

  async function handleTestEmail() {
    setTestEmailSending(true);
    try {
      const r = await adminApi.sendTestEmail(testEmailTo || undefined);
      setEmailMode(r.mode as typeof emailMode);
      if (r.delivered) {
        toast(`Sent via ${r.channel} to ${r.to}`, "success");
        setInviteUrl(r.inviteUrl);
        setInviteChannel(r.channel);
        setInvitePreviewUrl(r.previewUrl);
        setSelected({ id: "test", email: r.to, username: "test", status: "approved", created_at: new Date().toISOString(), reason: "Test email" } as AdminEarlyAccessRequest);
        setTestEmailOpen(false);
      } else {
        toast(`Channel=${r.channel}, delivered=false — check server logs`, "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Test email failed", "error");
    } finally {
      setTestEmailSending(false);
    }
  }

  async function handleReject(req: AdminEarlyAccessRequest) {
    if (!confirm(`Reject the request from ${req.email}? They will need to request access again.`)) return;
    try {
      await adminApi.rejectEarlyAccess(req.id);
      toast("Request rejected", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reject failed", "error");
    }
  }

  async function handleDelete(req: AdminEarlyAccessRequest) {
    if (!confirm(`Permanently delete the request from ${req.email}?`)) return;
    try {
      await adminApi.deleteEarlyAccess(req.id);
      toast("Deleted", "success");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Toaster />

      <EmailModeBanner mode={emailMode} onTestEmail={() => setTestEmailOpen(true)} />

      <Card className="!p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or username…"
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
        <EmptyState
          title="No requests match these filters"
          hint="Try a different status or search term."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((req) => (
            <RequestRow
              key={req.id}
              req={req}
              onApprove={() => handleApprove(req)}
              onReject={() => handleReject(req)}
              onDelete={() => handleDelete(req)}
            />
          ))}
        </div>
      )}

      {inviteUrl && selected && (
        <Modal
          open={Boolean(inviteUrl)}
          onClose={() => { setInviteUrl(null); setSelected(null); setInviteChannel(null); setInvitePreviewUrl(null); }}
          title={inviteChannel === "ethereal" ? "Invite sent (Ethereal test mode)" : inviteChannel === "smtp" ? "Invite sent" : "Invite created"}
          footer={
            <div className="flex flex-wrap items-center gap-2">
              {invitePreviewUrl && (
                <a
                  href={invitePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                >
                  Preview email ↗
                </a>
              )}
              <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(inviteUrl).then(() => toast("Copied to clipboard", "success"))}>Copy link</Button>
            </div>
          }
        >
          <p className="text-sm text-slate-700">
            {inviteChannel === "ethereal"
              ? "This email was sent to a free Ethereal test inbox. Open the preview link above to see exactly what the recipient will get. To deliver to a real inbox, set SMTP_HOST / SMTP_USER / SMTP_PASS in backend/.env."
              : inviteChannel === "smtp"
                ? "The email was delivered to the recipient's real inbox."
                : "Send this link to the recipient manually — the email pipeline is in console mode."}
          </p>
          {selected.email && selected.email !== "test" && (
            <p className="mt-2 text-xs text-slate-500">Recipient: <span className="font-semibold text-slate-700">{selected.email}</span></p>
          )}
          <p className="mt-3 break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
            {inviteUrl}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            The signup form will lock these values. If the recipient enters a different email or username, they will be sent back to request access again.
          </p>
        </Modal>
      )}

      {testEmailOpen && (
        <Modal
          open={testEmailOpen}
          onClose={() => setTestEmailOpen(false)}
          title="Send a test invite email"
          footer={
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setTestEmailOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleTestEmail} disabled={testEmailSending}>
                {testEmailSending ? "Sending…" : "Send test email"}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-slate-700">
            Send a real invite email (same template the system uses for approved requests) so you can verify the pipeline.
          </p>
          <input
            value={testEmailTo}
            onChange={(e) => setTestEmailTo(e.target.value)}
            placeholder="recipient@example.com (optional — defaults to your admin email)"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          {emailMode === "ethereal" && (
            <p className="mt-2 text-[11px] text-slate-500">
              Test mode is on — the email will be sent to a free Ethereal test inbox. A preview URL will be shown after sending.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function EmailModeBanner({ mode, onTestEmail }: { mode: "smtp" | "ethereal" | "console" | null; onTestEmail: () => void }) {
  if (mode === null) return null;
  const config = {
    smtp: {
      color: "border-emerald-200 bg-emerald-50",
      dot: "bg-emerald-500",
      label: "Email: SMTP (real inbox)",
      body: "Approved invites are sent to the recipient's real email inbox.",
    },
    ethereal: {
      color: "border-blue-200 bg-blue-50",
      dot: "bg-blue-500",
      label: "Email: Ethereal test mode",
      body: "Approved invites are sent to a free Ethereal test inbox. A preview URL is shown after each approval. To deliver to a real inbox, set SMTP_HOST / SMTP_USER / SMTP_PASS in backend/.env.",
    },
    console: {
      color: "border-amber-200 bg-amber-50",
      dot: "bg-amber-500",
      label: "Email: Console fallback",
      body: "No SMTP configured. Approved invites are logged to the server console — they will NOT reach the recipient. Configure SMTP to enable real delivery.",
    },
  }[mode];

  return (
    <div className={cn("flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between", config.color)}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-1 inline-block h-2 w-2 shrink-0 rounded-full", config.dot)} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{config.label}</p>
          <p className="mt-0.5 text-xs text-slate-600">{config.body}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onTestEmail}>Send test email</Button>
    </div>
  );
}

function RequestRow({ req, onApprove, onReject, onDelete }: {
  req: AdminEarlyAccessRequest;
  onApprove: () => void; onReject: () => void; onDelete: () => void;
}) {
  const created = new Date(req.created_at).toLocaleString();
  const isPending = req.status === "pending";
  const isApproved = req.status === "approved";

  return (
    <Card className="!p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={STATUS_COLOR[req.status] || "slate"}>{req.status}</Badge>
            <span className="text-sm font-semibold text-slate-900">{req.username}</span>
            <span className="text-sm text-slate-500">·</span>
            <span className="truncate text-sm text-slate-700">{req.email}</span>
          </div>
          {req.reason && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{req.reason}</p>}
          <p className="mt-1 text-[11px] text-slate-400">
            Submitted {created}{req.ip ? ` · IP ${req.ip}` : ""}
            {req.approved_at && ` · approved ${new Date(req.approved_at).toLocaleString()}`}
            {req.completed_at && ` · completed ${new Date(req.completed_at).toLocaleString()}`}
          </p>
          {isApproved && req.invite_expires_at && (
            <p className="mt-1 text-[11px] text-blue-700">
              Invite expires {new Date(req.invite_expires_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {isPending && (
            <>
              <Button variant="primary" size="sm" onClick={onApprove}>Approve</Button>
              <Button variant="secondary" size="sm" onClick={onReject}>Reject</Button>
            </>
          )}
          {isApproved && (
            <Button variant="primary" size="sm" onClick={onApprove}>Re-send invite</Button>
          )}
          {req.status === "rejected" && (
            <Button variant="primary" size="sm" onClick={onApprove}>Re-approve</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </Card>
  );
}
