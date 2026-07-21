"use client";

import { useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { submitExercise } from "@/features/student/api";

interface ExerciseBlockData {
  _id: string;
  title: string;
  instructions: string;
  language: string;
  starterCode: string;
  hints: { order: number; text: string }[];
  difficulty: string;
  xpReward: number;
  isRequired: boolean;
}

interface ExerciseBlockProps {
  exercise: ExerciseBlockData;
  onComplete?: (exerciseId: string, passed: boolean, xpEarned: number) => void;
}

export function ExerciseBlock({ exercise, onComplete }: ExerciseBlockProps) {
  const [status, setStatus] = useState<"idle" | "running" | "passed" | "failed">("idle");
  const [result, setResult] = useState<{ output: string; score: number } | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(exercise.language || 'javascript');

  const handleRun = async (code: string) => {
    setStatus("running");
    setResult(null);
    try {
      const res = await submitExercise(exercise._id, { code, language: selectedLanguage });
      const passed = res.submission.status === "passed";
      setStatus(passed ? "passed" : "failed");
      setResult({ output: res.submission.status, score: res.submission.score });
      setXpEarned(res.xpEarned || 0);
      onComplete?.(exercise._id, passed, res.xpEarned || 0);
      return { output: `Score: ${res.submission.score}/100\nStatus: ${res.submission.status}`, passed };
    } catch (e: any) {
      setStatus("failed");
      return { output: `Error: ${e.message}`, passed: false };
    }
  };

  const difficultyColor =
    exercise.difficulty === "easy"
      ? "text-green-600 bg-green-50"
      : exercise.difficulty === "medium"
      ? "text-amber-600 bg-amber-50"
      : "text-red-600 bg-red-50";

  return (
    <div className="my-6 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white">
      {/* Exercise header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A78BFA]">
              Code Exercise
            </span>
            {exercise.isRequired && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                Required
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {exercise.title || "Coding Exercise"}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${difficultyColor}`}>
            {exercise.difficulty}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#D6F63E]/20 text-[#0F0F0F]">
            +{exercise.xpReward} XP
          </span>
        </div>
      </div>

      {/* Instructions */}
      {exercise.instructions && (
        <div className="px-5 py-3 bg-blue-50/30 border-b border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {exercise.instructions}
          </p>
        </div>
      )}

      {/* Code editor */}
      <CodeEditor
        initialCode={exercise.starterCode || ""}
        language={selectedLanguage}
        hints={exercise.hints || []}
        onRun={handleRun}
        showLanguageSelector={true}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Status feedback */}
      {status !== "idle" && (
        <div
          className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 ${
            status === "running"
              ? "bg-blue-50 text-blue-700"
              : status === "passed"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status === "running" && (
            <>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Evaluating your solution...
            </>
          )}
          {status === "passed" && (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Passed! +{xpEarned} XP earned
            </>
          )}
          {status === "failed" && (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Not quite right. Try again!
            </>
          )}
        </div>
      )}
    </div>
  );
}
