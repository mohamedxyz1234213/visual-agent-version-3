"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { Card, Button, Badge, Toaster, toast, EmptyState, Modal, cn } from "@/components/Admin/ui";
import { adminApi, type AdminUser, type SafeUser } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin" pageTitle="Users" pageActions={<NewUserButton />}>
        <Body />
      </AdminShell>
    </AdminGuard>
  );
}

function Body() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await adminApi.listUsers(debounced || undefined)); }
    catch (err) { toast(err instanceof Error ? err.message : "Failed to load", "error"); }
    finally { setLoading(false); }
  }, [debounced]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <Card className="!p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or username…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </Card>

      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState title="No users found" hint="Try a different search or add a user above." />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1fr_0.6fr_0.7fr_0.5fr_auto] gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>User</span>
            <span>Email</span>
            <span>Role</span>
            <span>Quota</span>
            <span>Lessons</span>
            <span></span>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map((u) => (
              <li key={u.id} className="grid grid-cols-[1.5fr_1fr_0.6fr_0.7fr_0.5fr_auto] items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-semibold text-slate-900">{u.username}</span>
                  {u.status === "disabled" && <Badge color="red">Disabled</Badge>}
                </div>
                <span className="truncate text-sm text-slate-600">{u.email}</span>
                <span><Badge color={u.role === "admin" ? "indigo" : "slate"}>{u.role}</Badge></span>
                <span className="text-sm text-slate-700 tabular-nums">
                  {u.ai_requests_used} / {u.max_ai_requests}
                </span>
                <span className="text-sm text-slate-700 tabular-nums">{u.lessons_count}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/users/${u.id}`} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Open</Link>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>Edit</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function NewUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New user</Button>
      {open && <NewUserModal onClose={() => setOpen(false)} />}
    </>
  );
}

function NewUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [maxAi, setMaxAi] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi.createUser({ email, username: username.toLowerCase(), password, role, max_ai_requests: maxAi });
      toast(`Created user ${username}`, "success");
      onClose();
      // Reload the listing (caller will re-run its effect on its own; but a soft refresh helps)
      window.dispatchEvent(new Event("admin:users-changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New user"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button form="new-user-form" type="submit" disabled={busy}>{busy ? "Creating…" : "Create user"}</Button>
        </>
      }
    >
      <form id="new-user-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Email">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        </Field>
        <Field label="Username (3–32 chars, lowercase)">
          <input required minLength={3} maxLength={32} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        </Field>
        <Field label="Password (min 8 chars)">
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Max AI lessons">
            <input type="number" min={0} max={1000} value={maxAi} onChange={(e) => setMaxAi(Number(e.target.value) || 0)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums" />
          </Field>
        </div>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const me = useAuthStore((s) => s.user);
  const [max, setMax] = useState(user.max_ai_requests);
  const [used, setUsed] = useState(user.ai_requests_used);
  const [status, setStatus] = useState<"active" | "disabled">(user.status);
  const [role, setRole] = useState<"user" | "admin">(user.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = me?.id === user.id;

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = { max_ai_requests: max, ai_requests_used: used, status, role };
      if (password) patch.password = password;
      await adminApi.patchUser(user.id, patch);
      toast(`Saved ${user.username}`, "success");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (isSelf) { toast("You can't delete your own account.", "error"); return; }
    if (!confirm(`Delete user ${user.username}? Their lessons will be detached and their sessions revoked.`)) return;
    try {
      await adminApi.deleteUser(user.id);
      toast("User deleted", "success");
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${user.username}`}
      maxWidth="max-w-xl"
      footer={
        <>
          {!isSelf && <Button variant="danger" onClick={handleDelete}>Delete user</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Max AI lessons">
            <input type="number" min={0} max={1000} value={max} onChange={(e) => setMax(Number(e.target.value) || 0)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums" />
          </Field>
          <Field label="Used">
            <input type="number" min={0} value={used} onChange={(e) => setUsed(Number(e.target.value) || 0)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "disabled")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")} disabled={isSelf} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>
        <Field label="Reset password (optional)">
          <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave empty to keep current" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
        </Field>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
          <p>Email: <span className="font-mono text-slate-700">{user.email}</span></p>
          <p>Last login: <span className="text-slate-700">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "—"}</span>{user.last_login_ip ? ` from ${user.last_login_ip}` : ""}</p>
          <p>Active sessions: <span className="text-slate-700">{user.active_sessions}</span></p>
        </div>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}
