"use client";

import { useState } from "react";
import type { Quiz, QuizAttemptResult, QuizQuestion } from "@/lib/types";
import { submitQuizAttempt } from "@/lib/api";

interface QuizPanelProps {
  quiz: Quiz;
  onPass: () => void;
  onRepeat: () => void;
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconCheckCircle({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBookOpen({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function IconReplay({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M1 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function QuizPanel({ quiz, onPass, onRepeat }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = quiz.questions.every((q) => answers[q.id]);
  const answeredCount = quiz.questions.filter((q) => answers[q.id]).length;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await submitQuizAttempt(quiz.id, answers);
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const total = quiz.questions.length;
    const score = result.score ?? 0;
    return (
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div className={`rounded-[28px] border px-5 py-6 text-center ${result.passed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          <div className="flex flex-col items-center gap-3">
            {result.passed ? <IconCheckCircle /> : <IconBookOpen />}
            <span className="text-2xl font-bold tracking-tight">{result.passed ? "Ready to continue" : "Review this section once more"}</span>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Score: <span className="font-semibold text-slate-900">{score}/{total}</span> ({Math.round((score / total) * 100)}%)
            </p>
          </div>
        </div>

        <div className="w-full space-y-3 max-h-80 overflow-y-auto pr-1">
          {quiz.questions.map((q) => {
            const fb = result.feedback?.[q.id];
            return (
              <div
                key={q.id}
                className={`rounded-[24px] border p-4 ${fb?.correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Question</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">{q.question_text}</p>
                <p className="mt-1.5 text-sm text-slate-600">
                  Your answer: <span className="font-semibold">{answers[q.id] || "—"}</span>
                </p>
                {!fb?.correct && (
                  <p className="mt-1 text-sm text-emerald-700">
                    Correct: <span className="font-semibold">{fb?.correct_answer}</span>
                  </p>
                )}
                {fb?.explanation && (
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{fb.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {result.passed ? (
            <button
              onClick={onPass}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Continue
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <>
              <button
                onClick={onRepeat}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <IconReplay />
                Replay Section
              </button>
              <button
                onClick={() => { setResult(null); setAnswers({}); }}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Knowledge Check</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-900">Check what the learner understood</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Answer each question, then submit once everything is complete.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          <span>{answeredCount} of {quiz.questions.length} answered</span>
        </div>
      </div>

      {quiz.questions.map((q, index) => (
        <QuestionItem
          key={q.id}
          index={index}
          question={q}
          value={answers[q.id] ?? ""}
          onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
        />
      ))}

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || loading}
        className="mt-1 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Evaluating..." : "Submit Answers"}
      </button>
    </div>
  );
}

// ─── Individual question ──────────────────────────────────────────────────────

function QuestionItem({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: QuizQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Question {index + 1}
        </span>
        <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
          {question.difficulty}
        </span>
      </div>

      <p className="mb-4 text-sm font-medium leading-7 text-slate-800">{question.question_text}</p>

      {question.question_type === "mcq" && question.options && (
        <div className="space-y-2">
          {question.options.choices.map((choice, choiceIndex) => (
            <label
              key={choice}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                value === choice
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={choice}
                checked={value === choice}
                onChange={() => onChange(choice)}
                className="accent-slate-900"
              />
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${value === choice ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                {String.fromCharCode(65 + choiceIndex)}
              </span>
              <span className={`text-sm ${value === choice ? "text-white" : "text-slate-700"}`}>{choice}</span>
            </label>
          ))}
        </div>
      )}

      {(question.question_type === "fill_blank" || question.question_type === "short_answer") && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.question_type === "fill_blank" ? "Fill in the blank..." : "Your answer..."}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 transition focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
      )}

      {question.question_type === "graph_interpretation" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Interpret the graph..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 transition focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
        />
      )}
    </div>
  );
}
