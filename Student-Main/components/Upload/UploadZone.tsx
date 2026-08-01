"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { uploadDocument, pollUploadStatus, explainText } from "@/lib/api";
import type { LessonStatus } from "@/lib/types";

interface UploadZoneProps {
  onReady: (lessonId: string, seriesId?: string, totalLessons?: number) => void;
}

const ACCEPTED = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp";

type LessonIntent = "teach" | "practice" | "notes";
type LessonPreset = {
  id: string;
  label: string;
  desc: string;
  useWhen: string;
  intent: LessonIntent;
  mode: string;
};

const LESSON_INTENTS: Array<{ id: LessonIntent; label: string; desc: string; prompt: string }> = [
  {
    id: "teach",
    label: "Teach Me Clearly",
    desc: "Full explanation, worked steps, and guided understanding.",
    prompt: "Primary lesson goal: teach the material clearly from fundamentals to application with accurate explanations and worked reasoning.",
  },
  {
    id: "practice",
    label: "Question Practice",
    desc: "Spend more time on checks, worked answers, and self-testing.",
    prompt: "Primary lesson goal: prioritize question practice, frequent checks for understanding, and worked answers while still explaining each idea.",
  },
  {
    id: "notes",
    label: "Notes + Visuals",
    desc: "Condense the topic into clean notes, diagrams, and comparisons.",
    prompt: "Primary lesson goal: produce concise, well-structured notes with clear diagrams, tables, and memorable visual summaries.",
  },
];

const LESSON_PRESETS: LessonPreset[] = [
  {
    id: "explain_clearly",
    label: "Explain It Clearly",
    desc: "Best default. Balanced explanation, visuals, and recap.",
    useWhen: "Use this when the learner is seeing the topic for the first time.",
    intent: "teach",
    mode: "full_lesson",
  },
  {
    id: "show_visually",
    label: "Show It Visually",
    desc: "Leans on diagrams, graphs, movement, and board space.",
    useWhen: "Use this for geometry, graphs, physics, and visual processes.",
    intent: "teach",
    mode: "visual_first",
  },
  {
    id: "go_step_by_step",
    label: "Go Step by Step",
    desc: "Slower pacing with one move at a time.",
    useWhen: "Use this for formulas, derivations, and harder multi-stage ideas.",
    intent: "teach",
    mode: "step_by_step",
  },
  {
    id: "practice_questions",
    label: "Practice With Questions",
    desc: "Adds more checks, worked answers, and quiz moments.",
    useWhen: "Use this when the learner already knows the basics and needs practice.",
    intent: "practice",
    mode: "qa_mode",
  },
  {
    id: "revision_notes",
    label: "Turn It Into Notes",
    desc: "Creates concise notes and selective supporting visuals.",
    useWhen: "Use this for revision, summaries, and cleaner study notes.",
    intent: "notes",
    mode: "text_focus",
  },
];

// ─── Per-provider analysis model options ──────────────────────────────────────
const PROVIDER_MODELS: Record<string, Array<{
  id: string; label: string; modelName: string; desc: string; badge: string | null;
}>> = {
  openrouter: [
    { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra", modelName: "nvidia/nemotron-3-ultra-550b-a55b:free", desc: "Fast & capable (free)", badge: "Recommended" },
    { id: "google/gemma-4-27b-it:free", label: "Gemma 4 27B (free)", modelName: "google/gemma-4-27b-it:free", desc: "Google model", badge: null },
    { id: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick (free)", modelName: "meta-llama/llama-4-maverick:free", desc: "Meta latest", badge: null },
    { id: "qwen/qwen3-235b-a22b:free", label: "Qwen3 235B (free)", modelName: "qwen/qwen3-235b-a22b:free", desc: "Strong reasoning", badge: null },
  ],
  
};

// ─── Pipeline stage definitions ───────────────────────────────────────────────
type StageDef = { key: string; label: string; desc: string };
type StageKey = string;

function buildStages(providerLabel: string, modelName: string, textMode = false): StageDef[] {
  const agent = `${providerLabel} · ${modelName}`;
  const stages: StageDef[] = [
    { key: "queued",              label: textMode ? "Preparing" : "Uploading",                    desc: textMode ? "Sending your topic to the server…" : "Sending your file to the server…" },
    { key: "extracting",          label: "Extracting Content",          desc: "Reading text, tables, and structure from your document…" },
    { key: "analyzing_document",  label: "Deep Document Analysis",      desc: `${agent} is reading your entire document…` },
    { key: "deep_scanning",       label: "Deep Scan (2nd pass)",        desc: `${agent} is re-reading for missed topics and procedures…` },
    { key: "planning_lessons",    label: "Splitting Into Lessons",      desc: `${agent} is dividing the material into focused lessons…` },
    { key: "ai_generating",       label: "Generating Lesson",           desc: `${agent} is writing narration, explanations, and quizzes…` },
    { key: "ai_retry",            label: "Optimizing Generation",       desc: `${agent} is refining the approach for better results…` },
    { key: "ai_refining",         label: "Refining Output",             desc: `${agent} is reviewing and improving for accuracy…` },
    { key: "ai_visual_refining",  label: "Composing Visuals",           desc: `${agent} is designing SVG diagrams and varied whiteboard scenes…` },
    { key: "planning_outline",    label: "Building Lesson Structure",   desc: `${agent} is structuring parts and key concepts…` },
    { key: "planning_visuals_1",  label: "Drawing Part 1",              desc: `${agent} is creating whiteboard animations for Part 1…` },
    { key: "planning_visuals_2",  label: "Drawing Part 2",              desc: `${agent} is creating whiteboard animations for Part 2…` },
    { key: "planning_visuals_3",  label: "Drawing Part 3",              desc: `${agent} is creating whiteboard animations for Part 3…` },
    { key: "saving",              label: "Saving Lesson",               desc: "Saving scenes, visuals, and quiz data to the database…" },
    { key: "finalizing",          label: "Finalizing",                  desc: "Wrapping up — other lessons continue in the background…" },
  ];
  // In text mode, skip the file-extraction stage since we bypass it
  return textMode ? stages.filter((s) => s.key !== "extracting") : stages;
}

function getStageIndex(stages: readonly StageDef[], step: string): number {
  const idx = stages.findIndex((s) => s.key === step);
  return idx === -1 ? 0 : idx;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m === 0 ? `${s}s` : `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildRequestInstructions(freeform: string) {
  return freeform.trim();
}

// ─── SVG icons ────────────────────────────────────────────────────────────────
function IconUpload({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconText({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className={className}>
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}
function IconSpinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className={`animate-spin ${className}`}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" stroke="currentColor" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconAlert({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
  );
}

// ─── Processing Panel ─────────────────────────────────────────────────────────
interface ProcessingPanelProps {
  file: File | null;
  sourceLabel: string; // file name or "Direct text"
  processingStep: string;
  elapsed: number;
  stepDurations: Partial<Record<string, number>>;
  stages: readonly StageDef[];
  providerLabel: string;
  modelName: string;
  errorMsg?: string;
  onRetry: () => void;
  isError: boolean;
}

function ProcessingPanel({
  file, sourceLabel, processingStep, elapsed, stepDurations, stages,
  providerLabel, modelName, errorMsg, onRetry, isError,
}: ProcessingPanelProps) {
  const currentIdx = getStageIndex(stages, processingStep);
  const progress = isError
    ? Math.round((currentIdx / stages.length) * 100)
    : Math.min(99, Math.round(((currentIdx + 0.6) / stages.length) * 100));

  return (
    <div className="w-full max-w-lg mx-auto py-10 px-4 flex flex-col items-center gap-6">
      <div className="text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${isError ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-600"}`}>
          {isError ? <IconAlert /> : <IconSpinner className="w-7 h-7" />}
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isError ? "Processing Failed" : "Building Your Lesson"}
        </h2>
        {!isError && (
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-blue-600">{providerLabel}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="font-mono text-slate-600">{modelName}</span>
          </p>
        )}
        <p className="text-sm text-slate-500 mt-1 font-mono">
          {sourceLabel}
          {file && (
            <>
              <span className="mx-2 text-slate-300">·</span>
              {formatFileSize(file.size)}
            </>
          )}
          {!isError && (
            <>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-blue-500 font-medium">{formatElapsed(elapsed)}</span>
            </>
          )}
        </p>
      </div>

      {!isError && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 truncate pr-2">{stages[currentIdx]?.desc}</span>
            <span className="text-sm font-bold text-blue-600 font-mono tabular-nums shrink-0">{progress}%</span>
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="w-full flex flex-col gap-1.5">
        {stages.map((stage, idx) => {
          const isDone    = idx < currentIdx;
          const isActive  = !isError && idx === currentIdx;
          const isFailed  = isError  && idx === currentIdx;
          const duration  = stepDurations[stage.key];

          return (
            <div
              key={stage.key}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all ${
                isActive  ? "bg-blue-50 border-blue-200 shadow-sm"
                : isFailed? "bg-red-50 border-red-200"
                : isDone  ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 border-slate-100 opacity-40"
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {isDone   ? <span className="text-emerald-500"><IconCheck className="w-4 h-4" /></span>
                : isActive ? <IconSpinner className="w-4 h-4 text-blue-500" />
                : isFailed ? <span className="text-red-500 font-bold text-sm">×</span>
                : <span className="w-3 h-3 rounded-full border-2 border-slate-300 inline-block" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${
                  isActive ? "text-blue-700" : isFailed ? "text-red-600" : isDone ? "text-emerald-700" : "text-slate-400"
                }`}>{stage.label}</p>
                {isActive && <p className="text-xs text-blue-400 mt-0.5 leading-tight">{stage.desc}</p>}
                {isFailed && errorMsg && <p className="text-xs text-red-400 mt-0.5 leading-tight truncate">{errorMsg}</p>}
              </div>
              {isDone && duration !== undefined && (
                <span className="text-xs bg-emerald-100 text-emerald-600 font-mono px-2 py-0.5 rounded-full shrink-0">
                  {formatElapsed(duration)}
                </span>
              )}
              {isActive && (
                <span className="text-xs text-blue-400 animate-pulse shrink-0">running…</span>
              )}
            </div>
          );
        })}
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-500">{errorMsg ?? "An error occurred during processing."}</p>
          <button onClick={onRetry} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
            Try Again
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center">
          AI lesson generation typically takes 1–3 minutes for detailed documents.
        </p>
      )}
    </div>
  );
}

// ─── Main UploadZone ──────────────────────────────────────────────────────────
export default function UploadZone({ onReady }: UploadZoneProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "explain">("upload");
  const [lessonIntent, setLessonIntent] = useState<LessonIntent>("teach");
  const [explanationMode, setExplanationMode] = useState<string>("full_lesson");

  // Upload tab
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [instructions, setInstructions] = useState("");

  // Explain tab
  const [textInput, setTextInput] = useState("");
  const [textSubject, setTextSubject] = useState("");
  const [textInstructions, setTextInstructions] = useState("");

  // Shared AI config
  const [analysisModel, setAnalysisModel] = useState<string>("nvidia/nemotron-3-ultra-550b-a55b:free");
  const aiProvider = "openrouter";

  // UI control state
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Processing state
  const [isTextMode, setIsTextMode] = useState(false);
  const [uiStatus, setUiStatus] = useState<"idle" | "uploading" | "processing" | "error">("idle");
  const [processingStep, setProcessingStep] = useState<string>("queued");
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [stepDurations, setStepDurations] = useState<Partial<Record<string, number>>>({});
  const [sourceLabel, setSourceLabel] = useState<string>("");

  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStepRef = useRef<string>("queued");
  const stepStartedAtRef = useRef<Partial<Record<string, number>>>({ queued: 0 });

  const modelOptionsForProvider = useMemo(() => {
    return PROVIDER_MODELS.openrouter;
  }, []);

  const allModels = modelOptionsForProvider;

  useEffect(() => {
    if (modelOptionsForProvider.length > 0) setAnalysisModel(modelOptionsForProvider[0].id);
  }, [aiProvider, modelOptionsForProvider]);

  useEffect(() => {
    if (uiStatus === "uploading" || uiStatus === "processing") {
      timerRef.current = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [uiStatus]);

  useEffect(() => {
    const prev = prevStepRef.current;
    if (prev === processingStep) return;
    const startedAt = stepStartedAtRef.current[prev];
    if (startedAt !== undefined) setStepDurations((d) => ({ ...d, [prev]: elapsedRef.current - startedAt }));
    stepStartedAtRef.current[processingStep] = elapsedRef.current;
    prevStepRef.current = processingStep;
  }, [processingStep]);

  function resetProcessing() {
    setIsTextMode(false);
    setUiStatus("idle");
    setFile(null);
    setProcessingStep("queued");
    setErrorMsg("");
    setElapsed(0);
    setStepDurations({});
    elapsedRef.current = 0;
    prevStepRef.current = "queued";
    stepStartedAtRef.current = { queued: 0 };
  }

  const startUpload = useCallback(async (selectedFile: File) => {
    const composedInstructions = buildRequestInstructions(instructions);
    setFile(selectedFile);
    setIsTextMode(false);
    setSourceLabel(selectedFile.name);
    setUiStatus("uploading");
    setProcessingStep("queued");
    setErrorMsg("");
    setElapsed(0);
    setStepDurations({});
    elapsedRef.current = 0;
    prevStepRef.current = "queued";
    stepStartedAtRef.current = { queued: 0 };
    try {
      const result: LessonStatus = await uploadDocument(
        selectedFile,
        subject || undefined,
        composedInstructions || undefined,
        analysisModel || undefined,
        aiProvider || undefined,
        explanationMode || undefined,
        lessonIntent,
      );
      setUiStatus("processing");
      await poll(result.id, onReady, setProcessingStep);
    } catch (e) {
      setUiStatus("error");
      setErrorMsg(String(e));
    }
  }, [subject, instructions, lessonIntent, analysisModel, aiProvider, explanationMode, onReady]);

  const startExplain = useCallback(async () => {
    const text = textInput.trim();
    const composedInstructions = buildRequestInstructions(textInstructions);
    if (text.length < 2) return;
    setIsTextMode(true);
    setSourceLabel("Direct text input");
    setUiStatus("uploading");
    setProcessingStep("queued");
    setErrorMsg("");
    setElapsed(0);
    setStepDurations({});
    elapsedRef.current = 0;
    prevStepRef.current = "queued";
    stepStartedAtRef.current = { queued: 0 };
    try {
      const result: LessonStatus = await explainText(
        text,
        textSubject || undefined,
        composedInstructions || undefined,
        explanationMode || undefined,
        analysisModel || undefined,
        aiProvider || undefined,
        lessonIntent,
      );
      setUiStatus("processing");
      await poll(result.id, onReady, setProcessingStep);
    } catch (e) {
      setUiStatus("error");
      setErrorMsg(String(e));
    }
  }, [textInput, textSubject, textInstructions, lessonIntent, analysisModel, aiProvider, explanationMode, onReady]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) startUpload(f);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  const selectedProvider = { id: aiProvider, label: "OpenRouter", name: "OpenRouter (Free models)" };
  const providerLabel = selectedProvider.label || selectedProvider.name;
  const selectedModel = allModels.find((m) => m.id === analysisModel) ?? modelOptionsForProvider[0];

  const modelDisplayName = selectedModel?.label ?? analysisModel;
  const selectedPreset = LESSON_PRESETS.find((preset) => preset.intent === lessonIntent && preset.mode === explanationMode) ?? null;
  const processingStages = buildStages(providerLabel, modelDisplayName, isTextMode);

  // ── Processing screen ─────────────────────────────────────────────────────
  if (uiStatus === "uploading" || uiStatus === "processing" || uiStatus === "error") {
    return (
      <ProcessingPanel
        file={file}
        sourceLabel={sourceLabel}
        processingStep={processingStep}
        elapsed={elapsed}
        stepDurations={stepDurations}
        stages={processingStages}
        providerLabel={providerLabel}
        modelName={analysisModel}
        errorMsg={errorMsg}
        onRetry={resetProcessing}
        isError={uiStatus === "error"}
      />
    );
  }

  // ── Idle form ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-[28px] border border-slate-200/90 bg-white/95 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
      {/* Header */}
      <div className="mb-5 border-b border-slate-200/80 pb-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Lesson Builder</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-3xl">Create a lesson</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Type a topic or attach a source file. Pick a teaching style and the AI will build your lesson.
        </p>
      </div>

      {/* Model selector row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Model selector dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowModelDropdown(!showModelDropdown); }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-sm transition hover:border-slate-300 min-w-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Model</span>
            <span className="w-px h-4 bg-slate-200" />
            <span className="font-semibold text-slate-700 max-w-[80px] sm:max-w-none truncate">{selectedModel?.label ?? analysisModel}</span>
            <svg className="w-4 h-4 text-slate-400 transition-transform" style={{ transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showModelDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowModelDropdown(false)} />
              <div className="absolute top-full mt-2 left-0 w-[calc(100vw-2rem)] sm:w-72 rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.12)] p-2 z-20">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">OpenRouter Free Models</p>
                {allModels.map((opt) => {
                  const active = analysisModel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setAnalysisModel(opt.id); setShowModelDropdown(false); }}
                      className={`w-full rounded-xl px-4 py-2.5 text-left transition ${
                        active
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold tracking-[-0.02em]">{opt.label}</span>
                        {opt.badge && (
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className={`mt-0.5 text-xs ${active ? "text-slate-200" : "text-slate-400"}`}>
                        {opt.modelName}
                      </div>
                      <div className={`mt-0.5 text-[11px] leading-5 ${active ? "text-slate-300" : "text-slate-400"}`}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Teaching presets (chips/pills) */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-3">Teaching Style</p>
        <div className="flex flex-wrap gap-2">
          {LESSON_PRESETS.map((preset) => {
            const active = selectedPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setLessonIntent(preset.intent);
                  setExplanationMode(preset.mode);
                }}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        {selectedPreset && (
          <p className="mt-2 text-xs leading-5 text-slate-400">{selectedPreset.useWhen}</p>
        )}
      </div>

      {/* File attachment indicator */}
      {file && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-800 truncate">{file.name}</div>
            <div className="text-xs text-emerald-600 font-mono">{formatFileSize(file.size)}</div>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat input area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); } }}
        className={`rounded-[24px] border px-4 py-3 transition ${
          dragging
            ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
            : "border-slate-200 bg-slate-50/70"
        }`}
      >
        <textarea
          placeholder={file ? "Add extra instructions or guidance (optional)..." : "Describe what you want to learn about — or drop a file here..."}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (file) startUpload(file);
              else if (textInput.trim().length >= 2) startExplain();
            }
          }}
          rows={3}
          className="w-full bg-transparent text-sm leading-6 text-slate-700 placeholder-slate-400 outline-none resize-none"
        />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {/* File attach button */}
            <label className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 cursor-pointer transition">
              <input type="file" accept={ACCEPTED} className="hidden" onChange={handleFileInput} />
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </label>
            {/* Drag hint */}
            <span className="hidden sm:inline text-xs text-slate-400">or drop a file</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (file) startUpload(file);
              else startExplain();
            }}
            disabled={!file && textInput.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preferences collapsible */}
      <details className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold tracking-[-0.02em] text-slate-900 [&::-webkit-details-marker]:hidden">
          Preferences
        </summary>
        <p className="mt-2 text-xs leading-5 text-slate-500">Optional settings for subject labeling and special guidance.</p>
        <div className="mt-4 grid gap-3">
          <input
            type="text"
            placeholder="Subject or topic label (optional)"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setTextSubject(e.target.value); }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400"
          />
          <textarea
            placeholder="Extra guidance (optional): difficulty level, focus areas, examples to include, more diagrams, slower steps..."
            value={instructions}
            onChange={(e) => { setInstructions(e.target.value); setTextInstructions(e.target.value); }}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 resize-none"
          />
        </div>
      </details>
    </div>
  );
}

// ─── Polling helper ───────────────────────────────────────────────────────────
async function poll(
  lessonId: string,
  onReady: (id: string, seriesId?: string, totalLessons?: number) => void,
  setStep: (step: string) => void
) {
  const MAX = 270;
  const STALL_LIMIT = 150; // 150 * 2s = 5 minutes on the same step
  const STALL_SENSITIVE_STEPS = new Set([
    "analyzing_document",
    "deep_scanning",
    "planning_lessons",
    "planning_outline",
    "ai_generating",
    "ai_refining",
    "ai_visual_refining",
  ]);
  let tries = 0;
  let lastStep = "queued";
  let sameStepCount = 0;
  while (tries < MAX) {
    await sleep(2000);
    const s = await pollUploadStatus(lessonId);
    const step = s.processing_step || "queued";
    setStep(step);

    if (step === lastStep) {
      sameStepCount += 1;
    } else {
      lastStep = step;
      sameStepCount = 0;
    }

    if (STALL_SENSITIVE_STEPS.has(step) && sameStepCount >= STALL_LIMIT) {
      throw new Error(`Generation stalled at ${step} for over 5 minutes. Please retry.`);
    }

    if (s.status === "ready") {
      onReady(lessonId, s.series_id ?? undefined, s.total_lessons);
      return;
    }
    if (s.status === "error") {
      throw new Error(s.error_message ?? "Lesson processing failed on the server.");
    }
    tries++;
  }
  throw new Error("Timed out waiting for lesson to process.");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

