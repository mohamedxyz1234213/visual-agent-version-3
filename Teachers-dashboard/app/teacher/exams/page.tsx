"use client";

import { useState } from "react";
import { useTeacherExams, useClasses } from "@/features/teacher/hooks";
import { generateAIExam, updateExam, deleteExam, getExamAnalytics } from "@/features/teacher/api";
import {
  IconClipboard, IconRobot, IconCheck, IconX, IconZap, IconUsers, IconTrash,
  IconEye, IconEyeOff, IconTrending, IconTarget, IconAward, IconCrown,
} from "@/components/shared/FluxIcons";
import type { ExamAnalytics, PerQuestionStat, GradeDistribution, StudentExamResult } from "@/features/teacher/types";

const SUBJECTS = [
  { _id: "js", name: "JavaScript", color: "#F7DF1E" },
  { _id: "python", name: "Python", color: "#3776AB" },
  { _id: "html", name: "HTML/CSS", color: "#E34F26" },
  { _id: "react", name: "React", color: "#61DAFB" },
  { _id: "node", name: "Node.js", color: "#339933" },
  { _id: "algo", name: "Algorithms", color: "#8B5CF6" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];
const DURATIONS = [15, 30, 45, 60, 90];

export default function TeacherExamsPage() {
  const { exams, loading, refresh } = useTeacherExams();
  const { classes } = useClasses();
  const allStudents = Object.values(classes).flat();

  // AI generation state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(30);
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Assignment state
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Analytics state
  const [analyticsExamId, setAnalyticsExamId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<ExamAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<"overview" | "questions" | "students">("overview");

  const typeColors: Record<string, string> = {
    quiz: "bg-blue-100 text-blue-700",
    midterm: "bg-amber-100 text-amber-700",
    final: "bg-red-100 text-red-700",
    practice: "bg-green-100 text-green-700",
  };

  async function handleGenerate() {
    if (!title.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      await generateAIExam(title.trim(), subjectId || undefined, difficulty, questionCount, duration);
      setToast({ msg: `Exam "${title}" generated successfully!`, type: "success" });
      setShowModal(false);
      setTitle("");
      refresh();
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
    setTimeout(() => setToast(null), 3000);
  }

  async function handleTogglePublish(exam: any) {
    try {
      await updateExam(exam._id, { isPublished: !exam.isPublished });
      setToast({ msg: exam.isPublished ? "Exam unpublished" : "Exam published!", type: "success" });
      refresh();
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to update exam", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(examId: string) {
    if (!confirm("Delete this exam? This cannot be undone.")) return;
    try {
      await deleteExam(examId);
      setToast({ msg: "Exam deleted", type: "success" });
      refresh();
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to delete", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  }

  function openAssign(exam: any) {
    setAssigning(exam._id);
    setSelectedIds(exam.assignedTo?.map((s: any) => s._id || s) || []);
  }

  async function handleAssign() {
    if (!assigning) return;
    try {
      await updateExam(assigning, { assignedTo: selectedIds });
      setToast({ msg: "Students assigned to exam!", type: "success" });
      setAssigning(null);
      refresh();
    } catch (err: any) {
      setToast({ msg: err.message || "Assignment failed", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  }

  function toggleStudent(id: string) {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function openAnalytics(examId: string) {
    setAnalyticsExamId(examId);
    setAnalyticsData(null);
    setAnalyticsLoading(true);
    setAnalyticsTab("overview");
    try {
      const data = await getExamAnalytics(examId);
      setAnalyticsData(data);
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to load analytics", type: "error" });
      setAnalyticsExamId(null);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setAnalyticsLoading(false);
    }
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
          <h2 className="text-2xl font-bold text-[#18181B]">Exams</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage exams and quizzes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-white border border-gray-200 text-[#18181B] rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <IconRobot size={16} /> AI Generate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm animate-pulse" />)}</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconClipboard size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exams yet</h3>
          <p className="text-gray-500 text-sm">Create your first exam to assess student learning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#18181B] truncate">{exam.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[exam.type] || "bg-gray-100 text-gray-600"}`}>{exam.type}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {exam.questions?.length || 0} questions · {exam.duration} min · {exam.totalPoints} pts
                    {exam.subjectId && <span> · {exam.subjectId.name || "General"}</span>}
                    {exam.assignedTo && exam.assignedTo.length > 0 && <span> · {exam.assignedTo.length} students assigned</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openAnalytics(exam._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F5F3FF] text-[#A78BFA] hover:bg-[#EDE9FE] transition-colors flex items-center gap-1.5"
                    title="View exam analytics"
                  >
                    <IconTrending size={14} /> Analytics
                  </button>
                  <button
                    onClick={() => openAssign(exam)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    title="Assign to students"
                  >
                    <IconUsers size={14} /> Assign
                  </button>
                  <button
                    onClick={() => handleTogglePublish(exam)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      exam.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title={exam.isPublished ? "Unpublish" : "Publish"}
                  >
                    {exam.isPublished ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                    {exam.isPublished ? "Published" : "Draft"}
                  </button>
                  <button
                    onClick={() => handleDelete(exam._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                    title="Delete exam"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
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
                    <IconClipboard size={20} className="text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B]">AI Generate Exam</h3>
                    <p className="text-xs text-gray-500">Create a complete exam with AI</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><IconX size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Exam Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., JavaScript Fundamentals Quiz, Python Midterm..."
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Subject (optional)</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setSubjectId("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!subjectId ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Any</button>
                    {SUBJECTS.map((s) => (
                      <button key={s._id} onClick={() => setSubjectId(s._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${subjectId === s._id ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Difficulty</label>
                    <div className="flex gap-1.5">
                      {DIFFICULTIES.map((d) => (
                        <button key={d} onClick={() => setDifficulty(d)}
                          className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${difficulty === d ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Duration (min)</label>
                    <div className="flex gap-1.5">
                      {DURATIONS.map((d) => (
                        <button key={d} onClick={() => setDuration(d)}
                          className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${duration === d ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{d}m</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Number of Questions</label>
                  <div className="flex gap-1.5">
                    {[3, 5, 8, 10, 15].map((n) => (
                      <button key={n} onClick={() => setQuestionCount(n)}
                        className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${questionCount === n ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{n}</button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                    <IconX size={14} className="mt-0.5 shrink-0 text-red-500" /><span>{error}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleGenerate} disabled={generating || !title.trim()}
                    className="flex-1 px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><IconZap size={16} /> Generate Exam</>}
                  </button>
                  <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Students Modal */}
      {assigning && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setAssigning(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                    <IconUsers size={20} className="text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B]">Assign Exam to Students</h3>
                    <p className="text-xs text-gray-500">Select students who can take this exam</p>
                  </div>
                </div>
                <button onClick={() => setAssigning(null)} className="text-gray-400 hover:text-gray-600"><IconX size={20} /></button>
              </div>

              {allStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No students assigned to your class yet.</div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">{selectedIds.length} of {allStudents.length} selected</span>
                    <button
                      onClick={() => setSelectedIds(selectedIds.length === allStudents.length ? [] : allStudents.map((s: any) => s.id))}
                      className="text-xs font-semibold text-[#A78BFA] hover:text-[#8b5cf6]"
                    >
                      {selectedIds.length === allStudents.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    {allStudents.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => toggleStudent(s.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedIds.includes(s.id) ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s.username || s.studentCode}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-5 border-t border-gray-100 mt-5">
                <button onClick={handleAssign} disabled={allStudents.length === 0}
                  className="flex-1 px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors disabled:opacity-50">
                  Save Assignment
                </button>
                <button onClick={() => setAssigning(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Modal */}
      {analyticsExamId && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setAnalyticsExamId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-xl border border-gray-200 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                    <IconTrending size={20} className="text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#18181B]">
                      {analyticsLoading ? "Loading..." : analyticsData?.examTitle || "Exam Analytics"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {analyticsData
                        ? `${analyticsData.submittedCount} of ${analyticsData.totalStudents} submissions`
                        : "Fetching analytics..."}
                    </p>
                  </div>
                </div>
                <button onClick={() => setAnalyticsExamId(null)} className="text-gray-400 hover:text-gray-600"><IconX size={20} /></button>
              </div>

              {/* Tabs */}
              {analyticsData && (
                <div className="flex gap-1 px-6 pt-4 border-b border-gray-100 shrink-0">
                  {[
                    { id: "overview" as const, label: "Overview" },
                    { id: "questions" as const, label: "Questions" },
                    { id: "students" as const, label: "Students" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAnalyticsTab(tab.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                        analyticsTab === tab.id
                          ? "bg-[#F5F3FF] text-[#A78BFA] border-b-2 border-[#A78BFA]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* Overview Tab */}
                    {analyticsTab === "overview" && (
                      <div className="space-y-6">
                        {/* Key Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-[#F5F5F5] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#18181B]">{analyticsData.avgScore}%</p>
                            <p className="text-[11px] text-gray-500 mt-1">Average Score</p>
                          </div>
                          <div className="bg-[#F5F5F5] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#18181B]">{analyticsData.medianScore}%</p>
                            <p className="text-[11px] text-gray-500 mt-1">Median Score</p>
                          </div>
                          <div className="bg-[#F5F5F5] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#18181B]">{analyticsData.passRate}%</p>
                            <p className="text-[11px] text-gray-500 mt-1">Pass Rate</p>
                          </div>
                          <div className="bg-[#F5F5F5] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#18181B]">{analyticsData.lowestScore}%</p>
                            <p className="text-[11px] text-gray-500 mt-1">Lowest Score</p>
                          </div>
                        </div>

                        {/* Range highlight */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <IconCrown size={16} className="text-green-600" />
                              <span className="text-sm font-bold text-green-700">Highest</span>
                            </div>
                            <p className="text-3xl font-bold text-green-700">{analyticsData.highestScore}%</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <div className="flex items-center gap-2 mb-1">
                              <IconTarget size={16} className="text-amber-600" />
                              <span className="text-sm font-bold text-amber-700">Lowest</span>
                            </div>
                            <p className="text-3xl font-bold text-amber-700">{analyticsData.lowestScore}%</p>
                          </div>
                        </div>

                        {/* Grade Distribution */}
                        <div>
                          <h4 className="text-sm font-bold text-[#18181B] mb-3">Grade Distribution</h4>
                          <div className="space-y-2">
                            {[
                              { grade: "A", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50", range: "90-100%" },
                              { grade: "B", color: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", range: "80-89%" },
                              { grade: "C", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", range: "70-79%" },
                              { grade: "D", color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", range: "60-69%" },
                              { grade: "F", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", range: "0-59%" },
                            ].map(({ grade, color, text, bg, range }) => {
                              const count = analyticsData.gradeDistribution[grade as keyof GradeDistribution] || 0;
                              const pct = analyticsData.submittedCount > 0
                                ? Math.round((count / analyticsData.submittedCount) * 100)
                                : 0;
                              return (
                                <div key={grade} className={`${bg} rounded-xl px-4 py-3`}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-7 h-7 rounded-lg ${color} text-white flex items-center justify-center text-xs font-bold`}>{grade}</span>
                                      <span className="text-sm font-semibold text-[#18181B]">{range}</span>
                                    </div>
                                    <span className="text-sm font-bold text-[#18181B]">{count} student{count !== 1 ? "s" : ""} ({pct}%)</span>
                                  </div>
                                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Submissions count */}
                        <div className="bg-[#F5F5F5] rounded-xl p-4 text-center text-sm text-gray-500">
                          {analyticsData.submittedCount} student{analyticsData.submittedCount !== 1 ? "s" : ""} submitted out of {analyticsData.totalStudents} assigned
                          {" · "}Passing score: {analyticsData.passingScore}%
                        </div>
                      </div>
                    )}

                    {/* Questions Tab */}
                    {analyticsTab === "questions" && (
                      <div className="space-y-3">
                        {analyticsData.perQuestionStats.length === 0 ? (
                          <div className="text-center text-sm text-gray-400 py-8">No question data available.</div>
                        ) : (
                          analyticsData.perQuestionStats.map((q: PerQuestionStat, i: number) => {
                            const isHard = q.correctRate < 40;
                            const isMedium = q.correctRate >= 40 && q.correctRate < 70;
                            const isEasy = q.correctRate >= 70;
                            return (
                              <div key={q.questionId} className="bg-[#F5F5F5] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-6 rounded-lg bg-[#E5E5E5] flex items-center justify-center text-[11px] font-bold text-gray-500">
                                    {i + 1}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                    isEasy ? "bg-green-100 text-green-700" : isMedium ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
                                  }`}>
                                    {isEasy ? "Easy" : isMedium ? "Medium" : "Hard"}
                                  </span>
                                  <span className="text-[11px] text-gray-500 ml-auto">{q.points} pt{q.points !== 1 ? "s" : ""} · {q.type}</span>
                                </div>
                                <p className="text-sm text-[#18181B] mb-2">{q.questionText}</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${
                                      isEasy ? "bg-green-500" : isMedium ? "bg-amber-500" : "bg-red-500"
                                    }`} style={{ width: `${q.correctRate}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-[#18181B] shrink-0">{q.correctRate}%</span>
                                  <span className="text-[11px] text-gray-500 shrink-0">{q.correctCount}/{q.totalAttempts}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Students Tab */}
                    {analyticsTab === "students" && (
                      <div className="space-y-2">
                        {analyticsData.studentResults.length === 0 ? (
                          <div className="text-center text-sm text-gray-400 py-8">No student submissions yet.</div>
                        ) : (
                          analyticsData.studentResults.map((s: StudentExamResult, i: number) => (
                            <div key={i} className={`rounded-xl p-4 border ${
                              s.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-gray-500">
                                    {i + 1}
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-[#18181B]">{s.studentCode}</p>
                                    <p className="text-[11px] text-gray-500">
                                      {s.timeSpent ? `${Math.floor(s.timeSpent / 60)} min` : "—"} · {new Date(s.submittedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${s.passed ? "text-green-700" : "text-red-600"}`}>
                                    {s.percentage}%
                                  </p>
                                  <p className="text-[11px] text-gray-500">{s.score}/{s.maxScore}</p>
                                </div>
                              </div>
                              <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${s.passed ? "bg-green-500" : "bg-red-400"}`}
                                  style={{ width: `${s.percentage}%` }} />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
