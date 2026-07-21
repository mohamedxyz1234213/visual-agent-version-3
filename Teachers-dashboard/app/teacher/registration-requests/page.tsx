"use client";

import { useState } from "react";
import { useClasses, useAddStudent, useRemoveStudent } from "@/features/teacher/hooks";
import { IconShield, IconCheck, IconX, IconSearch } from "@/components/shared/FluxIcons";
import type { StudentInClass } from "@/features/teacher/types";

export default function AddStudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Add Students</h2>
        <p className="text-sm text-gray-500 mt-1">
          Search for approved students by their student code and add them to your class
        </p>
      </div>
      <SearchSection />
      <CurrentClassSection />
    </div>
  );
}

function SearchSection() {
  const { result, error, loading, search, add } = useAddStudent();
  const [code, setCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSuccess("");
    if (code.trim()) await search(code.trim());
  }

  async function handleAdd() {
    if (!result) return;
    setAdding(true);
    setSuccess("");
    try {
      await add(result.studentCode);
      setSuccess(`✅ ${result.username} added to your class!`);
      setCode("");
    } catch (err: any) {
      // error handled by hook
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-[#18181B] mb-3">Search by Student Code</h3>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. STU-2026-0001"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#18181B] placeholder-gray-400 focus:border-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/30 font-mono tracking-wide"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl text-sm font-semibold hover:bg-[#9678f0] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <IconSearch size={14} /> Search
        </button>
      </form>

      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      {success && (
        <div className="mt-3 px-4 py-3 bg-green-50 text-green-700 text-sm rounded-xl">{success}</div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-[#18181B]">{result.username}</h4>
                <span className="px-2 py-0.5 bg-[#D6F63E]/30 text-xs font-semibold rounded-full text-[#18181B]">
                  {result.studentCode}
                </span>
                {result.alreadyAssigned && (
                  <span className="px-2 py-0.5 bg-blue-100 text-xs font-semibold rounded-full text-blue-700">
                    Already in your class
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{result.email}</p>
              {result.schoolYear && (
                <p className="text-xs text-gray-400 mt-1">
                  School Year: {result.schoolYear.name}
                  {result.section && ` · Section ${result.section}`}
                </p>
              )}
            </div>
            {!result.alreadyAssigned && (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="px-4 py-2 bg-[#D6F63E] text-[#0F0F0F] rounded-xl text-sm font-semibold hover:bg-[#c5e63d] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <IconCheck size={14} /> {adding ? "Adding…" : "Add to Class"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrentClassSection() {
  const { classes, loading, refresh } = useClasses();
  const removeStudent = useRemoveStudent();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const allStudents = (Object.entries(classes) as [string, StudentInClass[]][]).flatMap(([year, students]) =>
    students.map((s) => ({ ...s, year }))
  );

  async function handleRemove(id: string) {
    if (!confirm("Remove this student from your class?")) return;
    setRemovingId(id);
    try {
      await removeStudent(id);
      await refresh();
    } catch (err: any) {
      alert(err.message || "Failed to remove student");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#18181B]">Your Students ({allStudents.length})</h3>
        <button
          onClick={refresh}
          className="text-xs font-semibold text-[#A78BFA] hover:text-[#9678f0] transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : allStudents.length === 0 ? (
        <div className="py-12 text-center">
          <IconShield size={40} className="mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-semibold text-[#18181B] mb-2">No students yet</h4>
          <p className="text-gray-500 text-sm">
            Search for a student above using their code to add them to your class.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allStudents.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#18181B]">{s.username}</span>
                  <span className="px-2 py-0.5 bg-[#A78BFA]/20 text-[10px] font-semibold rounded-full text-[#18181B] font-mono">
                    {s.studentCode}
                  </span>
                  <span className="text-[10px] text-gray-400">· {s.year}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>XP: {s.xp || 0}</span>
                  <span>Level: {s.level || 1}</span>
                  {s.averageScore > 0 && <span>Score: {Math.round(s.averageScore)}%</span>}
                  {s.streak > 0 && <span>🔥 {s.streak} day streak</span>}
                </div>
              </div>
              <button
                onClick={() => handleRemove(s.id)}
                disabled={removingId === s.id}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Remove from class"
              >
                <IconX size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
