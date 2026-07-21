"use client";

import { useState } from "react";
import { useTeacherChallenges, useTeacherExercises, useClasses } from "@/features/teacher/hooks";
import { IconTrophy } from "@/components/shared/FluxIcons";

export default function TeacherChallengesPage() {
  const { challenges, loading, create } = useTeacherChallenges();
  const { exercises } = useTeacherExercises();
  const { classes } = useClasses();
  const allStudents = Object.values(classes).flat();

  const [form, setForm] = useState({
    title: "",
    description: "",
    exerciseId: "",
    startDate: "",
    endDate: "",
    xp: 20,
    coins: 10,
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleStudent(id: string) {
    setSelectedStudents((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await create({
        title: form.title,
        description: form.description,
        exerciseId: form.exerciseId,
        startDate: form.startDate,
        endDate: form.endDate,
        rewards: { xp: form.xp, coins: form.coins },
        studentIds: selectedStudents,
      });
      setForm({ title: "", description: "", exerciseId: "", startDate: "", endDate: "", xp: 20, coins: 10 });
      setSelectedStudents([]);
    } catch (err: any) {
      setError(err.message || "Failed to create challenge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#18181B]">Challenges</h2>
        <p className="text-sm text-gray-500 mt-1">Assign coding challenges to your students \u2014 all of them, or a hand-picked group</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-[#18181B] mb-4">Create Challenge</h3>
        {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
            <select required value={form.exerciseId} onChange={(e) => setForm({ ...form, exerciseId: e.target.value })}
              className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]">
              <option value="">Select exercise\u2026</option>
              {exercises.map((ex: any) => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
            </select>
          </div>
          <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" rows={2} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">Start</span>
              <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">End</span>
              <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">XP Reward</span>
              <input type="number" value={form.xp} onChange={(e) => setForm({ ...form, xp: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1">Coin Reward</span>
              <input type="number" value={form.coins} onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
            </label>
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-500 mb-2">
              Assign to specific students (leave empty = all your assigned students)
            </span>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {allStudents.map((s: any) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedStudents.includes(s.id) ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s.username}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors disabled:opacity-50">
            {saving ? "Creating\u2026" : "Create Challenge"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : challenges.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconTrophy size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No challenges yet</h3>
          <p className="text-gray-500 text-sm">Create your first challenge above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c: any) => (
            <div key={c._id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#18181B]">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {c.assignedTo?.length > 0 ? `${c.assignedTo.length} students assigned` : "All your assigned students"} \u00b7 {new Date(c.startDate).toLocaleDateString()} \u2013 {new Date(c.endDate).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#A78BFA]">+{c.rewards?.xp || 0} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
