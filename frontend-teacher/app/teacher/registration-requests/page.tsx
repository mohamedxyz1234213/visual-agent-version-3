"use client";

import { useState } from "react";
import { useRegistrationRequests } from "@/features/teacher/hooks";
import { IconShield, IconCheck, IconX } from "@/components/shared/FluxIcons";

export default function RegistrationRequestsPage() {
  const { requests, loading, approve, reject } = useRegistrationRequests();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleApprove(id: string) {
    setBusyId(id);
    setError("");
    try {
      await approve(id);
    } catch (err: any) {
      setError(err.message || "Approval failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Reason for rejection (optional):") || "";
    setBusyId(id);
    setError("");
    try {
      await reject(id, reason);
    } catch (err: any) {
      setError(err.message || "Rejection failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Registration Requests</h2>
        <p className="text-sm text-gray-500 mt-1">Review pending student sign-ups matched to your assigned school years by age</p>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconShield size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No pending requests</h3>
          <p className="text-gray-500 text-sm">New student registrations matched to your school years will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#18181B]">{r.fullName}</h3>
                    <span className="px-2 py-0.5 bg-[#A78BFA]/20 text-xs font-semibold rounded-full text-[#18181B]">Age {r.age}</span>
                    {r.matchedSchoolYear && (
                      <span className="px-2 py-0.5 bg-gray-100 text-xs font-semibold rounded-full text-gray-600">{r.matchedSchoolYear.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">@{r.username} \u00b7 {r.schoolEmail} \u00b7 {r.parentPhone}</p>
                  <p className="text-xs text-gray-400 mt-1">National ID: {r.nationalId}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={busyId === r.id}
                    className="px-4 py-2 bg-[#D6F63E] text-[#0F0F0F] rounded-xl text-sm font-semibold hover:bg-[#c5e63d] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <IconCheck size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={busyId === r.id}
                    className="px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <IconX size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
