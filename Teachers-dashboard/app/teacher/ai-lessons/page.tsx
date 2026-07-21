"use client";

import { useState, useCallback } from "react";
import { generateAILesson, createLesson } from "@/features/teacher/api";
import {
  IconRobot,
  IconBook,
  IconCode,
  IconCheck,
  IconX,
  IconFileText,
  IconStar,
  IconZap,
  IconClock,
  IconTarget,
} from "@/components/shared/FluxIcons";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AIGeneratedLesson {
  _id: string;
  title: string;
  subjectId: string | null;
  difficulty: string;
  duration: number;
  style: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
  content: string;
  objectives: string[];
  codeSnippets: { language: string; code: string; explanation: string }[];
  exercises: {
    title: string;
    description: string;
    starterCode: string;
    difficulty: string;
    type: string;
    xpReward: number;
  }[];
  tags: string[];
  estimatedTime: number;
  totalExercises: number;
}

interface SubjectOption {
  _id: string;
  name: string;
  color: string;
}

// ── Subjects ────────────────────────────────────────────────────────────────────
const SUBJECTS: SubjectOption[] = [
  { _id: "js", name: "JavaScript", color: "#F7DF1E" },
  { _id: "python", name: "Python", color: "#3776AB" },
  { _id: "html", name: "HTML/CSS", color: "#E34F26" },
  { _id: "react", name: "React", color: "#61DAFB" },
  { _id: "node", name: "Node.js", color: "#339933" },
  { _id: "algo", name: "Algorithms", color: "#8B5CF6" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", desc: "No prior knowledge needed" },
  { value: "intermediate", label: "Intermediate", desc: "Basic concepts known" },
  { value: "advanced", label: "Advanced", desc: "Deep dive with complex topics" },
];

const STYLES = [
  { value: "explain", label: "Explain", desc: "Concept-focused with theory" },
  { value: "practical", label: "Practical", desc: "Hands-on coding exercises" },
  { value: "exam-prep", label: "Exam Prep", desc: "Test-focused with quizzes" },
  { value: "project", label: "Project-Based", desc: "Build a complete project" },
];

const DURATIONS = [15, 30, 45, 60, 90];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AILessonsPage() {
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState("explain");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState<AIGeneratedLesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "exercises" | "code">("content");

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    setLesson(null);
    try {
      const res = await generateAILesson(topic.trim(), subjectId || undefined, difficulty, duration, style);
      const l = res.lesson as AIGeneratedLesson;
      setLesson(l);
    } catch (err: any) {
      setError(err.message || "Failed to generate lesson");
    } finally {
      setGenerating(false);
    }
  }, [topic, subjectId, difficulty, duration, style]);

  const handleSaveLesson = useCallback(async (publish: boolean) => {
    if (!lesson) return;
    setSaving(true);
    try {
      await createLesson({
        title: lesson.title,
        subjectId: subjectId || undefined,
        difficulty: lesson.difficulty,
        content: lesson.content,
        objectives: lesson.objectives,
        codeSnippets: lesson.codeSnippets,
        exercises: lesson.exercises,
        isPublished: publish,
        duration: lesson.duration,
      });
      setToast({ msg: publish ? "Lesson published! 🎉" : "Lesson saved as draft", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ msg: err.message || "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [lesson]);

  const startEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!lesson || !editField) return;
    if (editField === "title") setLesson({ ...lesson, title: editValue });
    if (editField === "content") setLesson({ ...lesson, content: editValue });
    setEditField(null);
  };

  const selectedSubject = SUBJECTS.find((s) => s._id === subjectId);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right ${
            toast.type === "success" ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F0F0F]">AI Lesson Generator</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Create complete coding lessons with AI in seconds
          </p>
        </div>
        {lesson && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSaveLesson(false)}
              disabled={saving}
              className="px-4 py-2.5 border border-[#E5E5E5] bg-white text-[#0F0F0F] rounded-xl font-semibold text-sm hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save as Draft"}
            </button>
            <button
              onClick={() => handleSaveLesson(true)}
              disabled={saving}
              className="px-5 py-2.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <IconZap size={16} />
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>
        )}
      </div>

      {/* Main grid: Form + Preview */}
      <div className="grid grid-cols-5 gap-6">
        {/* ── Left Panel: Form ───────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">
          {/* Topic */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
              Lesson Topic
            </label>
            <div className="relative">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g., JavaScript Closures, React Hooks, Python Lists..."
                className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm text-[#0F0F0F] placeholder-[#A0A0A0] focus:border-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#0F0F0F]/10 transition-all pr-10"
              />
              {topic && (
                <button
                  onClick={() => setTopic("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#0F0F0F]"
                >
                  <IconX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
              Subject (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSubjectId("")}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  !subjectId
                    ? "bg-[#0F0F0F] text-white"
                    : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                }`}
              >
                Any
              </button>
              {SUBJECTS.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSubjectId(s._id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    subjectId === s._id
                      ? "bg-[#0F0F0F] text-white"
                      : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                    difficulty === d.value
                      ? "bg-[#D6F63E] text-[#0F0F0F]"
                      : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                  }`}
                >
                  <span className="block">{d.label}</span>
                  <span className="block text-[10px] font-normal opacity-70 mt-0.5">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Style Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
                Duration (min)
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      duration === d
                        ? "bg-[#0F0F0F] text-white"
                        : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2 block">
                Teaching Style
              </label>
              <div className="space-y-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      style === s.value
                        ? "bg-[#D6F63E] text-[#0F0F0F]"
                        : "bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]"
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full py-3.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Lesson...
              </>
            ) : (
              <>
                <IconRobot size={18} />
                Generate Lesson with AI
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-start gap-2.5">
              <IconX size={16} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Tips */}
          <div className="bg-[#F5F5F5] rounded-2xl p-4 border border-[#E5E5E5]">
            <h4 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
              💡 Tips
            </h4>
            <ul className="text-xs text-[#6B6B6B] space-y-1.5">
              <li>• Be specific with your topic for better results</li>
              <li>• Choose a teaching style that matches your goal</li>
              <li>• You can edit everything after generation</li>
              <li>• Save as draft to continue editing later</li>
            </ul>
          </div>
        </div>

        {/* ── Right Panel: Preview / Editor ──────────────────────────────── */}
        <div className="col-span-3">
          {!lesson ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mb-4">
                <IconRobot size={32} className="text-[#A0A0A0]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F0F0F] mb-2">Ready to Create a Lesson</h3>
              <p className="text-sm text-[#6B6B6B] max-w-sm">
                Fill in the topic and options on the left, then click{" "}
                <span className="font-semibold text-[#0F0F0F]">Generate</span> to create your
                AI-powered lesson.
              </p>
              <div className="flex items-center gap-6 mt-6 text-[11px] text-[#A0A0A0]">
                <span className="flex items-center gap-1.5"><IconBook size={14} /> Auto content</span>
                <span className="flex items-center gap-1.5"><IconCode size={14} /> Code snippets</span>
                <span className="flex items-center gap-1.5"><IconStar size={14} /> Exercises</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] overflow-hidden">
              {/* Lesson header */}
              <div className="p-6 pb-4 border-b border-[#E5E5E5]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {editField === "title" ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          autoFocus
                          className="flex-1 text-xl font-bold text-[#0F0F0F] bg-[#F5F5F5] rounded-lg px-3 py-1 border border-[#E5E5E5] outline-none focus:border-[#0F0F0F]"
                        />
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><IconCheck size={18} /></button>
                        <button onClick={() => setEditField(null)} className="text-[#6B6B6B] hover:text-[#0F0F0F]"><IconX size={18} /></button>
                      </div>
                    ) : (
                      <h3
                        className="text-xl font-bold text-[#0F0F0F] cursor-pointer hover:text-[#6B6B6B] transition-colors group flex items-center gap-2"
                        onClick={() => startEdit("title", lesson.title)}
                      >
                        {lesson.title}
                        <span className="text-[#A0A0A0] opacity-0 group-hover:opacity-100 text-xs font-normal transition-opacity">
                          click to edit
                        </span>
                      </h3>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSubject?.color || "#8B5CF6" }} />
                        {selectedSubject?.name || "General"}
                      </span>
                      <span className="text-[#E5E5E5]">·</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        lesson.difficulty === "beginner" ? "bg-green-100 text-green-700" :
                        lesson.difficulty === "intermediate" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {lesson.difficulty}
                      </span>
                      <span className="text-[#E5E5E5]">·</span>
                      <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                        <IconClock size={12} /> {lesson.duration} min
                      </span>
                      <span className="text-[#E5E5E5]">·</span>
                      <span className="text-xs text-[#6B6B6B] flex items-center gap-1 capitalize">
                        <IconTarget size={12} /> {lesson.style} style
                      </span>
                      <span className="text-[#E5E5E5]">·</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        lesson.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {lesson.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E5E5]">
                {[
                  { id: "content" as const, label: "Content", icon: IconFileText },
                  { id: "exercises" as const, label: `Exercises (${lesson.totalExercises})`, icon: IconStar },
                  { id: "code" as const, label: "Code Snippets", icon: IconCode },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === tab.id
                        ? "border-[#0F0F0F] text-[#0F0F0F]"
                        : "border-transparent text-[#A0A0A0] hover:text-[#6B6B6B]"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                {activeTab === "content" && (
                  <div className="space-y-6">
                    {/* Objectives */}
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">
                        Learning Objectives
                      </h4>
                      <div className="space-y-2">
                        {lesson.objectives.map((obj, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-[#F5F5F5] rounded-xl px-4 py-2.5">
                            <div className="w-5 h-5 rounded-full bg-[#D6F63E] flex items-center justify-center shrink-0 mt-0.5">
                              <IconCheck size={10} className="text-[#0F0F0F]" />
                            </div>
                            <span className="text-sm text-[#0F0F0F]">{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">
                        Lesson Content
                      </h4>
                      {editField === "content" ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            rows={12}
                            className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#0F0F0F] font-mono focus:border-[#0F0F0F] focus:outline-none focus:ring-2 focus:ring-[#0F0F0F]/10 resize-y"
                          />
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="px-3 py-1.5 bg-[#0F0F0F] text-white rounded-lg text-xs font-semibold">Save</button>
                            <button onClick={() => setEditField(null)} className="px-3 py-1.5 border border-[#E5E5E5] rounded-lg text-xs font-semibold text-[#6B6B6B]">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm max-w-none text-[#0F0F0F] cursor-pointer group"
                          onClick={() => startEdit("content", lesson.content)}
                        >
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.content}</div>
                          <span className="text-[#A0A0A0] text-xs opacity-0 group-hover:opacity-100 transition-opacity mt-2 block">
                            click to edit content
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "exercises" && (
                  <div className="space-y-3">
                    {lesson.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="bg-[#F5F5F5] rounded-xl p-4 border border-[#E5E5E5] hover:border-[#D6F63E] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="font-semibold text-sm text-[#0F0F0F]">{ex.title}</h5>
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0">
                            <IconZap size={12} /> +{ex.xpReward} XP
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6B6B] mb-2">{ex.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            ex.difficulty === "easy" ? "bg-green-100 text-green-700" :
                            ex.difficulty === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>{ex.difficulty}</span>
                          <span className="text-[10px] text-[#A0A0A0] capitalize">{ex.type?.replace("-", " ")}</span>
                        </div>
                        {ex.starterCode && (
                          <pre className="mt-2 bg-[#0F0F0F] text-white rounded-lg p-3 text-xs font-mono overflow-x-auto">
                            {ex.starterCode}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "code" && (
                  <div className="space-y-4">
                    {lesson.codeSnippets.map((snippet, i) => (
                      <div
                        key={i}
                        className="bg-[#0F0F0F] rounded-xl overflow-hidden border border-[#2A2A2A]"
                      >
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-[#2A2A2A]">
                          <span className="text-xs font-semibold text-[#A0A0A0] uppercase">
                            {snippet.language}
                          </span>
                        </div>
                        <pre className="p-4 text-sm font-mono text-white overflow-x-auto leading-relaxed">
                          {snippet.code}
                        </pre>
                        {snippet.explanation && (
                          <div className="px-4 py-3 bg-[#1A1A1A] border-t border-[#2A2A2A]">
                            <p className="text-xs text-[#A0A0A0]">{snippet.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer stats */}
              <div className="px-6 py-4 bg-[#F5F5F5] border-t border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                  <span className="flex items-center gap-1">
                    <IconBook size={14} /> {lesson.objectives.length} objectives
                  </span>
                  <span className="flex items-center gap-1">
                    <IconStar size={14} /> {lesson.totalExercises} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <IconCode size={14} /> {lesson.codeSnippets.length} snippets
                  </span>
                </div>
                <div className="text-[10px] text-[#A0A0A0]">
                  Created {new Date(lesson.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
