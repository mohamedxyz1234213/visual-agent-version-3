"use client";

import { useState } from "react";
import { sendNotification } from "@/features/teacher/api";
import { IconMessage, IconX, IconCheck } from "@/components/shared/FluxIcons";

interface Student {
  id: string;
  username: string;
  studentCode: string;
  section: string;
}

interface NotificationComposeProps {
  open: boolean;
  onClose: () => void;
  students: Student[];
}

export function NotificationCompose({ open, onClose, students }: NotificationComposeProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [sendTo, setSendTo] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function toggleStudent(id: string) {
    setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSending(true);
    setError("");
    try {
      const result = await sendNotification({
        studentIds: sendTo === "all" ? students.map((s) => s.id) : selectedIds,
        type: "teacher-message",
        title: title.trim(),
        message: message.trim(),
        priority,
      });
      setSent(true);
      setTitle("");
      setMessage("");
      setSelectedIds([]);
      setTimeout(() => { setSent(false); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C4B5F5]/20 flex items-center justify-center">
                <IconMessage size={20} className="text-[#C4B5F5]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Send Notification</h2>
                <p className="text-xs text-slate-500">Message your students</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            >
              <IconX size={18} className="text-slate-400" />
            </button>
          </div>

          {sent ? (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <IconCheck size={28} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sent successfully!</h3>
              <p className="text-sm text-slate-500 mt-1">Your notification has been delivered.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Recipient selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Send to</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendTo("all")}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      sendTo === "all"
                        ? "bg-[#C4B5F5] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Students ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTo("selected")}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      sendTo === "selected"
                        ? "bg-[#C4B5F5] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Select Students
                  </button>
                </div>
              </div>

              {/* Student selector (when "selected" mode) */}
              {sendTo === "selected" && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-2">
                  {students.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No students in your classes yet</p>
                  ) : (
                    students.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleStudent(s.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedIds.includes(s.id)
                            ? "bg-[#C4B5F5]/10 text-[#C4B5F5]"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedIds.includes(s.id)
                            ? "border-[#C4B5F5] bg-[#C4B5F5]"
                            : "border-slate-300"
                        }`}>
                          {selectedIds.includes(s.id) && <IconCheck size={10} className="text-white" />}
                        </div>
                        <span className="font-medium">{s.username || s.studentCode}</span>
                        {s.section && <span className="text-xs text-slate-400 ml-auto">{s.section}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Homework Reminder"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B5F5]/40 focus:border-transparent transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B5F5]/40 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {(["low", "normal", "high", "urgent"] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        priority === p
                          ? p === "urgent"
                            ? "bg-red-500 text-white"
                            : p === "high"
                              ? "bg-orange-500 text-white"
                              : p === "normal"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-300 text-slate-700"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !title.trim() || (sendTo === "selected" && selectedIds.length === 0)}
                  className="px-6 py-2.5 rounded-xl bg-[#C4B5F5] text-white text-sm font-semibold hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <IconMessage size={16} />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
