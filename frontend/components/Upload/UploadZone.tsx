"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { uploadDocument, pollUploadStatus, fetchProviders, explainText, type AiProviderOption } from "@/lib/api";
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

// ─── Explanation modes ────────────────────────────────────────────────────────
const EXPLANATION_MODES: Array<{ id: string; label: string; desc: string }> = [
  { id: "full_lesson",  label: "Balanced Lesson", desc: "Full walkthrough with narration, visuals, and recap." },
  { id: "visual_first", label: "Visual First",   desc: "Board-led teaching with diagrams, graphs, and movement." },
  { id: "step_by_step", label: "Step by Step",   desc: "One concept at a time with slower progression." },
  { id: "qa_mode",      label: "Q\u0026A Practice", desc: "Frequent questions, checks, and quiz moments." },
  { id: "text_focus",   label: "Text Focus",     desc: "Long-form explanation supported by selective visuals." },
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
  blaze: [
    { id: "qwen3.6-plus-thinking", label: "Premium",  modelName: "qwen3.6-plus-thinking", desc: "Deepest analysis",   badge: "Recommended" },
    { id: "qwen3.6-plus",          label: "Standard", modelName: "qwen3.6-plus",           desc: "Fast & accurate",   badge: null },
    { id: "grok-4.20-fast", label: "Grok 4.20 Fast", modelName: "grok-4.20-fast", desc: "Low-latency reasoning", badge: null },
    { id: "qwen3.6-max-preview-thinking", label: "Qwen 3.6 Max Preview", modelName: "qwen3.6-max-preview-thinking", desc: "Extended thinking preview", badge: null },
    { id: "moonshotai/kimi-k2.6", label: "Kimi K2.6", modelName: "moonshotai/kimi-k2.6", desc: "Long-context generalist", badge: null },
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
    { key: "ai_retry",            label: "Retrying Generation",         desc: `${agent} is retrying with a simplified prompt after an upstream failure…` },
    { key: "ai_refining",         label: "Refining Output",             desc: `${agent} is reviewing and improving for accuracy…` },
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
  const [analysisModel, setAnalysisModel] = useState<string>("qwen3.6-plus-thinking");
  const [aiProvider, setAiProvider] = useState<string>("blaze");
  const [providers, setProviders] = useState<AiProviderOption[]>([]);

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

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch(() => {
        setProviders([
          { id: "blaze",    label: "BlazeAI",     icon: "", name: "BlazeAI (Multi-model)", desc: "Free tier with multiple models",    badge: null },
        ]);
      });
  }, []);

  const modelOptionsForProvider = useMemo(() => {
    const fromApi = providers.find((p) => p.id === aiProvider)?.models;
    if (fromApi?.length) {
      return fromApi.map((m) => ({ id: m.id, label: m.label, modelName: m.id, desc: m.desc, badge: m.badge }));
    }
    return PROVIDER_MODELS[aiProvider] || PROVIDER_MODELS.blaze;
  }, [providers, aiProvider]);

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
    if (f) startUpload(f);
  }

  const selectedProvider = providers.find((p) => p.id === aiProvider)
    ?? { id: aiProvider, label: "BlazeAI", icon: "", name: "", desc: "", badge: null };
  const selectedModel = modelOptionsForProvider.find((m) => m.id === analysisModel) ?? modelOptionsForProvider[0];
  const providerLabel = selectedProvider.label || selectedProvider.name;
  const modelDisplayName = selectedModel?.label ?? analysisModel;
  const selectedIntent = LESSON_INTENTS.find((intent) => intent.id === lessonIntent) ?? LESSON_INTENTS[0];
  const selectedMode = EXPLANATION_MODES.find((mode) => mode.id === explanationMode) ?? EXPLANATION_MODES[0];
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
  const fallbackProviders: AiProviderOption[] = [
    { id: "blaze",    label: "BlazeAI",     icon: "", name: "BlazeAI (Multi-model)", desc: "Free tier with multiple models",    badge: null },
  ];
  const displayProviders = providers.length > 0 ? providers : fallbackProviders;

  return (
    <div className="w-full rounded-[28px] border border-slate-200/90 bg-white/95 px-4 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
      <div className="mb-6 border-b border-slate-200/80 pb-5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Lesson Builder</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-3xl">Create a lesson in three clear steps</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Pick the input method, choose one teaching preset, then add any extra guidance. Advanced AI settings stay out of the way unless you need them.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Step 1</p>
            <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900">Choose where the lesson comes from</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Pick the option that matches what you have right now.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                {
                  id: "upload",
                  title: "Use a file",
                  desc: "Best when the lesson must stay tied to a PDF, worksheet, notes, or image.",
                  note: "Upload a source and the planner will read from it.",
                  icon: IconUpload,
                },
                {
                  id: "explain",
                  title: "Describe a topic",
                  desc: "Best when you want a direct explanation from a written prompt.",
                  note: "Type the concept or question in your own words.",
                  icon: IconText,
                },
              ].map((option) => {
                const active = activeTab === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveTab(option.id as "upload" | "explain")}
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-2xl border p-3 ${active ? "border-white/10 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold tracking-[-0.02em]">{option.title}</div>
                        <div className={`mt-1 text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>{option.desc}</div>
                        <div className={`mt-2 text-[11px] leading-5 ${active ? "text-slate-300" : "text-slate-400"}`}>{option.note}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Step 2</p>
            <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900">Pick the teaching method</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Choose one preset. It sets both the lesson goal and the whiteboard style for you.</p>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
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
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold tracking-[-0.02em]">{preset.label}</div>
                        <div className={`mt-1 text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>{preset.desc}</div>
                      </div>
                      {active && <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Selected</span>}
                    </div>
                    <div className={`mt-3 rounded-2xl px-3 py-2 text-[11px] leading-5 ${active ? "bg-white/10 text-slate-200" : "bg-slate-50 text-slate-500"}`}>
                      {preset.useWhen}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${selectedPreset ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {selectedPreset
                ? `Current teaching method: ${selectedPreset.label}.`
                : `Current teaching method is custom: ${selectedIntent.label} + ${selectedMode.label}.`}
            </div>

            <details className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold tracking-[-0.02em] text-slate-900 [&::-webkit-details-marker]:hidden">
                Fine-tune the lesson behavior
              </summary>
              <p className="mt-2 text-xs leading-5 text-slate-500">Only open this if a preset is close but not exact. Changing these options can switch the request into a custom setup.</p>

              <div className="mt-4 grid gap-5 xl:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Lesson Goal</p>
                  <div className="mt-3 grid gap-2">
                    {LESSON_INTENTS.map((intent) => {
                      const active = lessonIntent === intent.id;
                      return (
                        <button
                          key={intent.id}
                          type="button"
                          onClick={() => setLessonIntent(intent.id)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="text-sm font-semibold tracking-[-0.02em]">{intent.label}</div>
                          <div className={`mt-1 text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>{intent.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Board Style</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">This controls how the explanation feels once the teaching goal is set.</p>
                    </div>
                    <div className="hidden rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-400 md:block">{selectedMode.label}</div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {EXPLANATION_MODES.map((mode) => {
                      const active = explanationMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setExplanationMode(mode.id)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className={`text-sm font-semibold tracking-[-0.02em] ${active ? "text-emerald-900" : "text-slate-800"}`}>{mode.label}</div>
                          <div className={`mt-1 text-xs leading-5 ${active ? "text-emerald-700" : "text-slate-500"}`}>{mode.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </details>
          </section>

          {activeTab === "upload" ? (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Step 3</p>
              <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900">Add the source and any extra guidance</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Use the notes box only for special constraints such as difficulty level, examples to include, or whether to focus on answers.</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed px-6 py-8 text-center transition ${
                    dragging
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-slate-50 hover:border-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <input type="file" accept={ACCEPTED} className="hidden" onChange={handleFileInput} />
                  <div className={`mb-5 rounded-2xl border p-4 ${dragging ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                    <IconUpload className="h-10 w-10" />
                  </div>
                  <p className={`text-lg font-semibold tracking-[-0.02em] ${dragging ? "text-white" : "text-slate-900"}`}>Drop your source file here</p>
                  <p className={`mt-2 max-w-sm text-sm leading-6 ${dragging ? "text-slate-200" : "text-slate-500"}`}>Click or drag a PDF, notes file, worksheet, or image.</p>
                  <p className={`mt-4 text-xs uppercase tracking-[0.24em] ${dragging ? "text-slate-300" : "text-slate-400"}`}>PDF · DOCX · TXT · MD · PNG · JPG</p>
                </label>

                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Subject or topic label (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                  <textarea
                    placeholder="Extra guidance (optional): beginner level, focus on worked answers, use more diagrams, include more notes, slow down the explanation..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={7}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white resize-none"
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
                    The selected teaching method and these notes are automatically combined before the planner runs.
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Step 3</p>
              <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-900">Describe the topic clearly</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Write the concept, problem, or question in the left panel. Use the notes box only if the student needs a specific level or style.</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.85fr)]">
                <div className="flex flex-col gap-4">
                  <textarea
                    placeholder="Type a short topic like 'Photosynthesis', 'Cosine', or 'Newton's second law' and the AI will expand it into a full lesson automatically."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={10}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="text"
                    placeholder="Subject or topic label (optional)"
                    value={textSubject}
                    onChange={(e) => setTextSubject(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400"
                  />
                  <textarea
                    placeholder="Extra guidance (optional): student level, more questions, more notes, slower steps, more graphs, more diagrams..."
                    value={textInstructions}
                    onChange={(e) => setTextInstructions(e.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 placeholder-slate-400 outline-none transition focus:border-slate-400 resize-none"
                  />
                  <button
                    type="button"
                    onClick={startExplain}
                    disabled={textInput.trim().length < 2}
                    className="mt-auto inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Generate Lesson
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[24px] border border-slate-200 bg-slate-900 p-4 text-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Request Summary</p>
            <div className="mt-4 space-y-4 text-sm leading-6">
              <div>
                <div className="text-slate-400">Source</div>
                <div className="font-medium text-white">{activeTab === "upload" ? "File-based lesson" : "Prompt-based lesson"}</div>
              </div>
              <div>
                <div className="text-slate-400">Teaching Method</div>
                <div className="font-medium text-white">{selectedPreset ? selectedPreset.label : "Custom setup"}</div>
                <div className="text-xs leading-5 text-slate-400">{selectedPreset ? selectedPreset.desc : `${selectedIntent.label} + ${selectedMode.label}`}</div>
              </div>
              <div>
                <div className="text-slate-400">Model</div>
                <div className="font-medium text-white">{providerLabel} · {modelDisplayName}</div>
              </div>
            </div>
          </section>

          <details className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold tracking-[-0.02em] text-slate-900 [&::-webkit-details-marker]:hidden">
              Advanced AI settings
            </summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">Only change these when you need a different provider or model. The defaults are already selected.</p>

            <div className="mt-4 grid gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Provider</p>
              {displayProviders.map((opt) => {
                const selected = aiProvider === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAiProvider(opt.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold tracking-[-0.02em]">{opt.label}</span>
                      {opt.badge && <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${selected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>{opt.badge}</span>}
                    </div>
                    <div className={`mt-1 text-xs leading-5 ${selected ? "text-slate-200" : "text-slate-500"}`}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Model</p>
              {modelOptionsForProvider.map((opt) => {
                const selected = analysisModel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAnalysisModel(opt.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold tracking-[-0.02em]">{opt.label}</span>
                      {opt.badge && <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{opt.badge}</span>}
                    </div>
                    <div className={`mt-1 text-xs leading-5 ${selected ? "text-emerald-700" : "text-slate-500"}`}>{opt.modelName}</div>
                    <div className={`mt-1 text-[11px] leading-5 ${selected ? "text-emerald-800" : "text-slate-400"}`}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </details>
        </aside>
      </div>
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
  let tries = 0;
  while (tries < MAX) {
    await sleep(2000);
    const s = await pollUploadStatus(lessonId);
    if (s.processing_step) setStep(s.processing_step);
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

