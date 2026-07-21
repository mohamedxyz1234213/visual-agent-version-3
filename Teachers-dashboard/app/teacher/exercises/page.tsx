"use client";

import { useState } from "react";
import { useTeacherExercises } from "@/features/teacher/hooks";
import { generateAIExercise } from "@/features/teacher/api";
import { IconCode, IconRobot, IconCheck, IconX, IconZap } from "@/components/shared/FluxIcons";

const SUBJECTS = [
  { _id: "js", name: "JavaScript", color: "#F7DF1E" },
  { _id: "python", name: "Python", color: "#3776AB" },
  { _id: "html", name: "HTML/CSS", color: "#E34F26" },
  { _id: "react", name: "React", color: "#61DAFB" },
  { _id: "node", name: "Node.js", color: "#339933" },
  { _id: "algo", name: "Algorithms", color: "#8B5CF6" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const TYPES = ["free-code", "fill-code", "find-bug", "predict-output"];

export default function TeacherExercisesPage() {
  const { exercises, loading, refresh } = useTeacherExercises();
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [type, setType] = useState("free-code");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const diffColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      await generateAIExercise(topic.trim(), difficulty, type, subjectId || undefined);
      setToast({ msg: `Exercise "${topic}" generated successfully!`, type: "success" });
      setShowModal(false);
      setTopic("");
      refresh();
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right ${
          toast.type === "success" ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">My Exercises</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage coding exercises</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-white border border-gray-200 text-[#18181B] rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <IconRobot size={16} /> AI Generate
          </button>
          <button className="px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors">
            + New Exercise
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconCode size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exercises yet</h3>
          <p className="text-gray-500 text-sm">Create your first exercise or use AI to generate one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div key={ex._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <IconCode size={22} className="text-[#A78BFA]" />
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffColors[ex.difficulty] || ""}`}>{ex.difficulty}</span>
              </div>
              <h3 className="font-semibold text-[#18181B] mb-1">{ex.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{ex.type?.replace("-", " ")} · {ex.estimatedTime} min</p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{ex.totalAttempts || 0} attempts</span>
                <button className="text-xs text-[#A78BFA] font-semibold hover:underline">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Generate Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                    <IconRobot size={20} className="text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B]">AI Generate Exercise</h3>
                    <p className="text-xs text-gray-500">Create a coding exercise with AI</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <IconX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Topic</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., JavaScript Arrays, Python Functions..."
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                </div>

                {/* Subject selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSubjectId("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !subjectId ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >Any</button>
                    {SUBJECTS.map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setSubjectId(s._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          subjectId === s._id ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                            difficulty === d ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Exercise Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA] capitalize"
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace("-", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                    <IconX size={14} className="mt-0.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !topic.trim()}
                    className="flex-1 px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><IconZap size={16} /> Generate Exercise</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
