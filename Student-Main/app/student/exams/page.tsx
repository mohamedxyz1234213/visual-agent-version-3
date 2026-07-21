"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStudentExams } from "@/features/student/hooks";
import {
  getStudentExamDetail,
  startStudentExam,
  submitStudentExam,
  identifyStudent,
} from "@/features/student/api";
import {
  IconClipboard,
  IconZap,
  IconCheck,
  IconX,
  IconClock,
  IconTarget,
  IconCode,
  IconBook,
  IconArrowRight,
  IconAward,
} from "@/components/shared/FluxIcons";
import type { ExamDetail, ExamQuestion, ExamSubmission, ExamResultItem } from "@/features/student/types";

// ── Helper: format seconds → mm:ss ────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentExamsPage() {
  const { exams, loading, refresh } = useStudentExams();
  const [activeExam, setActiveExam] = useState<string | null>(null);
  const [examData, setExamData] = useState<ExamDetail | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Student code identification
  const [studentCode, setStudentCode] = useState<string>("");
  const [identifiedStudent, setIdentifiedStudent] = useState<{ code: string; username: string; level: number; xp: number } | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Ref to keep latest handleAutoSubmit for the timer closure
  const autoSubmitRef = useRef<() => Promise<void>>(async () => {});

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          autoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted]);

  async function openExam(examId: string) {
    setActiveExam(examId);
    setLoadingExam(true);
    setError(null);
    setExamStarted(false);
    setAnswers({});
    setSubmitResult(null);
    setSubmission(null);
    setCompleted(false);
    try {
      const res = await getStudentExamDetail(examId);
      setExamData(res.exam);
      if (res.completed && res.submission) {
        setSubmission(res.submission);
        setCompleted(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load exam");
    } finally {
      setLoadingExam(false);
    }
  }

  async function handleStart() {
    if (!activeExam) return;
    try {
      const res = await startStudentExam(activeExam, identifiedStudent?.code);
      setSubmissionId(res.submissionId);
      setStartedAt(res.startedAt);
      setTimeLeft(res.duration * 60);
      setExamStarted(true);
    } catch (err: any) {
      setError(err.message || "Failed to start exam");
    }
  }

  async function handleSubmit() {
    if (!activeExam || !submissionId) return;
    setSubmitting(true);
    setError(null);
    try {
      const elapsed = startedAt
        ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        : 0;
      const res = await submitStudentExam(activeExam, {
        answers,
        timeSpent: elapsed,
        studentCode: identifiedStudent?.code,
      });
      setSubmitResult(res);
      setSubmission(res.submission);
      setCompleted(true);
      setExamStarted(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setToast({
        msg: res.submission.passed
          ? `Exam passed! +${res.xpEarned} XP earned`
          : "Exam completed. Review your results below.",
        type: res.submission.passed ? "success" : "error",
      });
      refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
    setTimeout(() => setToast(null), 5000);
  }

  // Load saved student code on mount
  useEffect(() => {
    const saved = localStorage.getItem("studentCode");
    if (saved) {
      setStudentCode(saved);
      identifyStudent(saved).then((res) => setIdentifiedStudent(res.student)).catch(() => {});
    }
  }, []);

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

  const handleAutoSubmit = useCallback(async () => {
    if (!activeExam || !submissionId) return;
    try {
      const elapsed = startedAt
        ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
        : 0;
      const res = await submitStudentExam(activeExam, {
        answers,
        timeSpent: elapsed,
        studentCode: identifiedStudent?.code,
      });
      setSubmitResult(res);
      setSubmission(res.submission);
      setCompleted(true);
      setExamStarted(false);
      setToast({
        msg: "Time's up! Your exam has been auto-submitted.",
        type: "error",
      });
      refresh();
    } catch {
      // silent
    }
  }, [activeExam, submissionId, startedAt, answers, refresh, identifiedStudent?.code]);

  // Sync ref with latest callback — avoids stale closure in timer
  useEffect(() => {
    autoSubmitRef.current = handleAutoSubmit;
  }, [handleAutoSubmit]);

  function goBack() {
    setActiveExam(null);
    setExamData(null);
    setSubmission(null);
    setCompleted(false);
    setExamStarted(false);
    setAnswers({});
    setSubmitResult(null);
    setError(null);
    setTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // ── Question Input Renderer ──────────────────────────────────────────────────
  function renderQuestionInput(q: ExamQuestion, index: number) {
    const val = answers[q.id] || "";

    if (q.type === "mcq" && q.options) {
      return (
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <label
              key={oi}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                val === opt
                  ? "border-[#A78BFA] bg-[#F5F3FF] text-[#18181B]"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name={q.id}
                value={opt}
                checked={val === opt}
                onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                className="accent-[#A78BFA]"
              />
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  val === opt ? "bg-[#A78BFA] text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (q.type === "fill-blank") {
      return (
        <input
          type="text"
          value={val}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          placeholder="Type your answer..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
        />
      );
    }

    if (q.type === "predict-output") {
      return (
        <textarea
          value={val}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          rows={3}
          placeholder="What will be the output of this code?"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#A78BFA] resize-none"
        />
      );
    }

    if (q.type === "code" || q.type === "bug-fix") {
      return (
        <div className="space-y-3">
          {q.code && (
            <div className="bg-[#1A1A2E] rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-[#E4E4E7] font-mono whitespace-pre-wrap">{q.code}</pre>
            </div>
          )}
          <textarea
            value={val}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            rows={6}
            placeholder={q.type === "bug-fix" ? "Fix the bug and write the corrected code..." : "Write your code here..."}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#A78BFA] resize-none"
          />
        </div>
      );
    }

    return (
      <textarea
        value={val}
        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
        rows={3}
        placeholder="Your answer..."
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA] resize-none"
      />
    );
  }

  // ── Loading State ─────────────────────────────────────────────────────────────
  if (loading || loadingExam) {
    if (loading && !activeExam) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#18181B]">Exams</h2>
            <p className="text-sm text-gray-500 mt-1">Complete assigned exams and track your scores</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm animate-pulse" />)}
        </div>
      </div>
    );
    }
    // Loading exam detail
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading exam...</span>
        </div>
        <div className="h-48 bg-white rounded-2xl shadow-sm animate-pulse" />
      </div>
    );
  }

  // ── Taking an Exam / Results ──────────────────────────────────────────────────
  if (activeExam && examData) {
    return (
      <div className="space-y-4">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-right ${
            toast.type === "success" ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-red-500 text-white"
          }`}>
            {toast.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-gray-400 hover:text-gray-600 p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-[#18181B]">{examData.title}</h2>
              <p className="text-xs text-gray-500">
                {examData.questions?.length || 0} questions · {examData.duration} min · {examData.totalPoints} pts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {examStarted && !completed && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                timeLeft < 120 ? "bg-red-50 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600"
              }`}>
                <IconClock size={16} />
                {formatTime(timeLeft)}
              </div>
            )}
            {completed && submission && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                submission.passed ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"
              }`}>
                {submission.passed ? <IconCheck size={16} /> : <IconX size={16} />}
                {submission.percentage}%
              </div>
            )}
          </div>
        </div>

        {/* Not Started Yet — Exam Info + Start Button */}
        {!examStarted && !completed && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E5E5E5] text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
              <IconClipboard size={32} className="text-[#A78BFA]" />
            </div>
            <h3 className="text-xl font-bold text-[#18181B] mb-2">Ready to begin?</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              {examData.instructions || "Read each question carefully. You can navigate between questions freely. Once you start, the timer will begin counting down."}
            </p>
            <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-500">
              <span>⏱ {examData.duration} minutes</span>
              <span>📝 {examData.questions?.length || 0} questions</span>
              <span>⭐ {examData.totalPoints} points max</span>
            </div>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-[#18181B] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors inline-flex items-center gap-2"
            >
              <IconZap size={18} />
              Start Exam
            </button>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
          </div>
        )}

        {/* Exam In Progress */}
        {examStarted && !completed && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E5E5E5] flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                {Object.keys(answers).length} of {examData.questions?.length || 0} answered
              </span>
              <div className="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-[#A78BFA] rounded-full transition-all duration-300"
                  style={{ width: `${(examData.questions?.length || 0) > 0 ? (Object.keys(answers).length / (examData.questions?.length || 1)) * 100 : 0}%` }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-[#D6F63E] text-[#0F0F0F] rounded-lg text-xs font-bold hover:bg-[#c8e835] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? "Submitting..." : "Submit All"}
                <IconArrowRight size={14} />
              </button>
            </div>

            {/* Questions */}
            {examData.questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#F5F5F5] text-gray-500">
                    {q.type === "mcq" ? "Multiple Choice" : q.type === "fill-blank" ? "Fill in the Blank" : q.type === "code" ? "Coding" : q.type === "bug-fix" ? "Bug Fix" : q.type === "predict-output" ? "Predict Output" : q.type}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-sm font-medium text-[#18181B] mb-4 leading-relaxed">{q.question}</p>
                {renderQuestionInput(q, i)}
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                <IconX size={14} className="mt-0.5 shrink-0 text-red-500" /><span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Completed — Results View */}
        {completed && submission && (
          <div className="space-y-4">
            {/* Score card */}
            <div className={`rounded-2xl p-6 shadow-sm border text-center ${
              submission.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-center gap-3 mb-3">
                {submission.passed ? (
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <IconAward size={28} className="text-green-600" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                    <IconTarget size={28} className="text-red-500" />
                  </div>
                )}
                <div className="text-left">
                  <h3 className="text-xl font-bold text-[#18181B]">
                    {submission.passed ? "Exam Passed!" : "Keep Practicing"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {submission.passed
                      ? `Great job! You scored ${submission.percentage}%`
                      : `You scored ${submission.percentage}% — review the correct answers below`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-8 text-sm">
                <div>
                  <span className="text-2xl font-bold text-[#18181B]">{submission.score}</span>
                  <span className="text-gray-400"> / {submission.maxScore}</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Score</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#18181B]">{submission.percentage}%</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Percentage</p>
                </div>
                {submitResult?.xpEarned > 0 && (
                  <div>
                    <span className="text-2xl font-bold text-[#D6F63E]">+{submitResult.xpEarned}</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">XP Earned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Question-by-question results */}
            {submission.results && submission.results.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#18181B]">Question Results</h3>
                {submission.results.map((r: ExamResultItem, i: number) => (
                  <div
                    key={r.questionId}
                    className={`bg-white rounded-2xl p-5 shadow-sm border ${
                      r.correct ? "border-green-200" : "border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {r.correct ? "Correct" : "Incorrect"}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">{r.points}/{r.maxPoints} pts</span>
                    </div>
                    <p className="text-sm text-[#18181B] mb-2">{r.question}</p>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-500">
                        Your answer:{" "}
                        <span className={`font-semibold ${r.correct ? "text-green-600" : "text-red-500"}`}>
                          {r.studentAnswer || "(not answered)"}
                        </span>
                      </p>
                      {!r.correct && r.correctAnswer && (
                        <p className="text-gray-500">
                          Correct answer:{" "}
                          <span className="font-semibold text-green-600">{r.correctAnswer}</span>
                        </p>
                      )}
                      {r.explanation && (
                        <p className="text-gray-400 mt-1 leading-relaxed">{r.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="flex-1 px-5 py-3 bg-[#18181B] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors"
              >
                Back to Exams
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Identification screen ─────────────────────────────────────────────────────
  if (!identifiedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#18181B]">Exams</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your student code to access exams</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
            <IconClipboard size={32} className="text-[#A78BFA]" />
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

  // ── Exam List (default view) ──────────────────────────────────────────────────
  return (
    <div className="space-y-4">
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
          <p className="text-sm text-gray-500 mt-1">
            Complete assigned exams and track your scores · <span className="font-mono text-[#A78BFA]">{identifiedStudent.code}</span>
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconClipboard size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No exams assigned</h3>
          <p className="text-gray-500 text-sm">Your teacher hasn't assigned any exams yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5E5] hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  {exam.status === "passed" ? (
                    <IconAward size={22} className="text-green-500" />
                  ) : exam.status === "attempted" ? (
                    <IconTarget size={22} className="text-amber-500" />
                  ) : (
                    <IconClipboard size={22} className="text-[#A78BFA]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-[#18181B] truncate">{exam.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      exam.status === "passed" ? "bg-green-100 text-green-700" :
                      exam.status === "attempted" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {exam.status === "passed" ? "Passed" : exam.status === "attempted" ? "Attempted" : "New"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {exam.questionCount} questions · {exam.duration} min · {exam.totalPoints} pts
                    {exam.subjectId?.name && <span> · {exam.subjectId.name}</span>}
                  </p>
                  {exam.submission && (
                    <p className="text-xs font-medium mt-0.5">
                      Score: <span className={exam.submission.status === "passed" ? "text-green-600" : "text-amber-600"}>
                        {exam.submission.score}/{exam.submission.maxScore}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openExam(exam._id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                    exam.status === "passed"
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-[#18181B] text-white hover:bg-[#2A2A2A]"
                  }`}
                >
                  {exam.status === "passed" ? "View Results" : exam.status === "attempted" ? "Retry" : "Start Exam"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
