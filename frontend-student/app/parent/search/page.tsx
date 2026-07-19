"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@/components/shared/FluxIcons";

export default function ParentSearchPage() {
  const [studentCode, setStudentCode] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/parent/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCode, nationalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      // Store temp token and redirect
      sessionStorage.setItem("parentToken", data.tempToken);
      router.push(`/parent/child/${data.studentId}`);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <IconSearch size={36} className="mx-auto mb-3 text-[#22C55E]" />
          <h2 className="text-xl font-bold text-[#18181B]">Find Your Child&apos;s Progress</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your child&apos;s student code and national ID</p>
        </div>

        <form onSubmit={handleSearch}>
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#18181B] mb-1.5">Student Code</label>
            <input type="text" value={studentCode} onChange={(e) => setStudentCode(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
              placeholder="STU-2026-0001" />
            <p className="text-xs text-gray-400 mt-1">Format: STU-YYYY-NNNN</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#18181B] mb-1.5">National ID</label>
            <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required
              maxLength={14} pattern="\d{14}"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
              placeholder="14-digit national ID" />
            <p className="text-xs text-gray-400 mt-1">Must be exactly 14 digits</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#22C55E] text-white rounded-xl font-semibold text-sm hover:bg-[#16a34a] transition-colors disabled:opacity-50">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>
    </div>
  );
}
