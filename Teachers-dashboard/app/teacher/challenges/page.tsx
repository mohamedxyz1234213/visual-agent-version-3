"use client";

import { useState } from "react";
import { useTeacherChallenges, useTeacherExercises, useClasses } from "@/features/teacher/hooks";
import { generateAIExercise } from "@/features/teacher/api";
import { IconTrophy, IconRobot, IconZap, IconCheck, IconX } from "@/components/shared/FluxIcons";

const SUBJECTS = [
  { _id: "js", name: "JavaScript", color: "#F7DF1E" },
  { _id: "python", name: "Python", color: "#3776AB" },
  { _id: "html", name: "HTML/CSS", color: "#E34F26" },
  { _id: "react", name: "React", color: "#61DAFB" },
  { _id: "node", name: "Node.js", color: "#339933" },
  { _id: "algo", name: "Algorithms", color: "#8B5CF6" },
];

export default function TeacherChallengesPage() {
  const { challenges, loading, create, refresh: refreshChallenges } = useTeacherChallenges();
  const { exercises, refresh: refreshExercises } = useTeacherExercises();
  const { classes } = useClasses();
  const allStudents = Object.values(classes).flat();

  const [showAiFlow, setShowAiFlow] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiSubjectId, setAiSubjectId] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("easy");
  const [aiType, setAiType] = useState("free-code");
  const [aiStartDate, setAiStartDate] = useState("");
  const [aiEndDate, setAiEndDate] = useState("");
  const [aiXp, setAiXp] = useState(20);
  const [aiCoins, setAiCoins] = useState(10);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiToast, setAiToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function handleAiGenerateChallenge() {
    if (!aiTopic.trim() || !aiStartDate || !aiEndDate) {
      setAiError("Topic, start date, and end date are required");
      return;
    }
    setAiGenerating(true);
    setAiError("");
    try {
      // Step 1: Generate exercise with AI
      const { exercise } = await generateAIExercise(aiTopic.trim(), aiDifficulty, aiType, aiSubjectId || undefined);
      // Step 2: Immediately create a challenge using the generated exercise
      await create({
        title: aiTopic.trim(),
        description: `Complete the ${aiTopic.trim()} challenge`,
        exerciseId: exercise._id,
        startDate: aiStartDate,
        endDate: aiEndDate,
        rewards: { xp: aiXp, coins: aiCoins },
      });
      setAiToast({ msg: `Challenge "${aiTopic}" created with AI-generated exercise!`, type: "success" });
      setShowAiFlow(false);
      setAiTopic("");
      refreshExercises();
    } catch (err: any) {
      setAiError(err.message || "Failed to generate challenge");
    } finally {
      setAiGenerating(false);
    }
    setTimeout(() => setAiToast(null), 4000);
  }

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

      {aiToast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right ${
          aiToast.type === "success" ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-red-500 text-white"
        }`}>
          {aiToast.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
          {aiToast.msg}
        </div>
      )}

      {/* One-step AI Generate + Challenge button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowAiFlow(true)}
          className="px-5 py-2.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors inline-flex items-center gap-2"
        >
          <IconRobot size={16} />
          AI Generate Challenge
        </button>
        <span className="text-xs text-gray-400">Generate an exercise + create a challenge in one click</span>
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

      {/* AI Generate Challenge Modal */}
      {showAiFlow && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowAiFlow(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                    <IconRobot size={20} className="text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B]">Generate Challenge</h3>
                    <p className="text-xs text-gray-500">AI creates an exercise + challenge in one step</p>
                  </div>
                </div>
                <button onClick={() => setShowAiFlow(false)} className="text-gray-400 hover:text-gray-600">
                  <IconX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Challenge Topic</label>
                  <input
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g., JavaScript Arrays, Python Functions..."
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                  />
                </div>

                {/* Subject selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setAiSubjectId("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !aiSubjectId ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >Any</button>
                    {SUBJECTS.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setAiSubjectId(s._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          aiSubjectId === s._id ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Difficulty</label>
                    <div className="flex gap-1.5">
                      {["easy", "medium", "hard"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setAiDifficulty(d)}
                          className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                            aiDifficulty === d ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Exercise Type</label>
                    <select
                      value={aiType}
                      onChange={(e) => setAiType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA] capitalize"
                    >
                      {["free-code", "fill-code", "find-bug", "predict-output"].map((t) => (
                        <option key={t} value={t}>{t.replace("-", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                    <input required type="date" value={aiStartDate} onChange={(e) => setAiStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                    <input required type="date" value={aiEndDate} onChange={(e) => setAiEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">XP Reward</label>
                    <input type="number" value={aiXp} onChange={(e) => setAiXp(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Coin Reward</label>
                    <input type="number" value={aiCoins} onChange={(e) => setAiCoins(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" />
                  </div>
                </div>

                {aiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                    <IconX size={14} className="mt-0.5 shrink-0 text-red-500" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleAiGenerateChallenge}
                    disabled={aiGenerating || !aiTopic.trim() || !aiStartDate || !aiEndDate}
                    className="flex-1 px-5 py-2.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiGenerating ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Exercise + Challenge...</>
                    ) : (
                      <><IconZap size={16} /> Generate & Create Challenge</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAiFlow(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="bg-[#F5F5F5] rounded-xl p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <IconZap size={12} className="text-[#A78BFA]" />
                    This will create an AI-generated exercise and immediately create a challenge from it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
