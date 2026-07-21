"use client";

import { useState, useEffect } from "react";
import { useExercises } from "@/features/student/hooks";
import { ExerciseCard } from "@/features/student/components";
import { getExercise, submitExercise, identifyStudent } from "@/features/student/api";
import { CodeEditor } from "@/components/CodeEditor/CodeEditor";
import type { Exercise } from "@/features/student/types";
import { IconCode } from "@/components/shared/FluxIcons";

export default function ExercisesPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { exercises, loading, refresh } = useExercises(filter ? { difficulty: filter } : undefined);

  // Student code identification
  const [studentCode, setStudentCode] = useState<string>("");
  const [identifiedStudent, setIdentifiedStudent] = useState<{ code: string; username: string; level: number; xp: number } | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);

  // Inline exercise solving
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "running" | "passed" | "failed">("idle");
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function handleIdentify() {
    if (!studentCode.trim()) return;
    setIdentifying(true);
    setIdentifyError(null);
    try {
      const res = await identifyStudent(studentCode.trim().toUpperCase());
      setIdentifiedStudent(res.student);
      localStorage.setItem("studentCode", studentCode.trim().toUpperCase());
    } catch (err: any) {
      setIdentifyError(err.message || "Student not found");
    } finally {
      setIdentifying(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("studentCode");
    if (saved) {
      setStudentCode(saved);
      identifyStudent(saved).then((res) => setIdentifiedStudent(res.student)).catch(() => {});
    }
  }, []);

  async function handleStartExercise(id: string) {
    setActiveExercise(null);
    setLoadingExercise(true);
    setSubmitStatus("idle");
    setSubmitResult(null);
    try {
      const res = await getExercise(id);
      setActiveExercise(res.exercise);
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to load exercise", type: "error" });
    } finally {
      setLoadingExercise(false);
    }
  }

  async function handleSubmitCode(code: string, language: string) {
    if (!activeExercise) return { passed: false, output: "No active exercise" };
    setSubmitStatus("running");
    setSubmitResult(null);
    try {
      const res = await submitExercise(activeExercise._id, {
        code,
        language,
        studentCode: identifiedStudent?.code || undefined,
      });
      const passed = res.submission.status === "passed";
      const output = `Score: ${res.submission.score}/100 · Status: ${res.submission.status}`;
      setSubmitStatus(passed ? "passed" : "failed");
      setSubmitResult(output);
      if (passed) {
        setToast({ msg: `Exercise passed! +${res.xpEarned} XP`, type: "success" });
        refresh();
      } else {
        setToast({ msg: "Not quite right. Try again!", type: "error" });
      }
      setTimeout(() => setToast(null), 5000);
      return { passed, output };
    } catch (err: any) {
      const output = `Error: ${err.message}`;
      setSubmitStatus("failed");
      setSubmitResult(output);
      setTimeout(() => setToast(null), 5000);
      return { passed: false, output };
    }
  }

  function goBack() {
    setActiveExercise(null);
    setSubmitStatus("idle");
    setSubmitResult(null);
  }

  // Show identification screen if not identified
  if (!identifiedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#18181B]">Coding Exercises</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your student code to start practicing</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
            <IconCode size={32} className="text-[#A78BFA]" />
          </div>
          <h3 className="text-lg font-bold text-[#18181B] mb-2">Student Identification</h3>
          <p className="text-sm text-gray-500 mb-4">Enter your student code (ID) to identify yourself</p>
          <input
            type="text"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
            placeholder="Enter your student code (e.g. A3X8K2M1)"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[#A78BFA] mb-3"
            onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
          />
          {identifyError && <p className="text-sm text-red-500 mb-3">{identifyError}</p>}
          <button
            onClick={handleIdentify}
            disabled={identifying || !studentCode.trim()}
            className="w-full px-6 py-3 bg-[#18181B] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
          >
            {identifying ? "Checking..." : "Identify Me"}
          </button>
        </div>
      </div>
    );
  }

  // Inline exercise solving
  if (activeExercise) {
    return (
      <div className="space-y-4">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right ${
            toast.type === "success" ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-red-500 text-white"
          }`}>
            {toast.msg}
          </div>
        )}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-gray-400 hover:text-gray-600 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#18181B]">{activeExercise.title}</h2>
              <p className="text-xs text-gray-500">
                {activeExercise.type} · {activeExercise.difficulty} · +{activeExercise.xpReward} XP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-lg font-mono">ID: {identifiedStudent.code}</span>
          </div>
        </div>

        {activeExercise.description && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{activeExercise.description}</p>
          </div>
        )}

        <CodeEditor
          initialCode={activeExercise.starterCode || ""}
          language="javascript"
          hints={activeExercise.hints || []}
          onRun={async (code) => handleSubmitCode(code, selectedLanguage)}
          showLanguageSelector={true}
          onLanguageChange={setSelectedLanguage}
        />

        {submitStatus !== "idle" && (
          <div className={`px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            submitStatus === "running" ? "bg-blue-50 text-blue-700" :
            submitStatus === "passed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {submitStatus === "running" && <>Evaluating...</>}
            {submitStatus === "passed" && <>Passed! +{activeExercise.xpReward} XP</>}
            {submitStatus === "failed" && <>Not quite right. Try again!</>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right ${
          toast.type === "success" ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">Coding Exercises</h2>
          <p className="text-sm text-gray-500 mt-1">
            Practice and sharpen your coding skills · <span className="font-mono text-[#A78BFA]">{identifiedStudent.code}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {[undefined, "easy", "medium", "hard"].map((d) => (
            <button key={d || "all"} onClick={() => setFilter(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === d || (!filter && !d) ? "bg-[#18181B] text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}>
              {d === "all" || !d ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconCode size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exercises available</h3>
          <p className="text-gray-500 text-sm">Check back later for new challenges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <ExerciseCard key={ex._id} exercise={ex} onStart={(id) => handleStartExercise(id)} />
          ))}
        </div>
      )}
    </div>
  );
}