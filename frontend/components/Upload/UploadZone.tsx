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

const EXPLANATION_MODES: Array<{ id: string; label: string; desc: string }> = [
  { id: "full_lesson",  label: "Balanced Lesson", desc: "Full walkthrough with narration, visuals, and recap." },
  { id: "visual_first", label: "Visual First",   desc: "Board-led teaching with diagrams, graphs, and movement." },
  { id: "step_by_step", label: "Step by Step",   desc: "One concept at a time with slower progression." },
  { id: "qa_mode",      label: "Q&A Practice", desc: "Frequent questions, checks, and quiz moments." },
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

type StageDef = { key: string; label: string; desc: string };

function buildStages(providerLabel: string, modelName: string, textMode = false): StageDef[] {
  const agent = `${providerLabel} \u00b7 ${modelName}`;
  const stages: StageDef[] = [
    { key: "queued",              label: textMode ? "Preparing" : "Uploading",                    desc: textMode ? "Sending your topic to the server\u2026" : "Sending your file to the server\u2026" },
    { key: "extracting",          label: "Extracting Content",          desc: "Reading text, tables, and structure from your document\u2026" },
    { key: "analyzing_document",  label: "Deep Document Analysis",      desc: `${agent} is reading your entire document\u2026` },
    { key: "deep_scanning",       label: "Deep Scan (2nd pass)",        desc: `${agent} is re-reading for missed topics and procedures\u2026` },
    { key: "planning_lessons",    label: "Splitting Into Lessons",      desc: `${agent} is dividing the material into focused lessons\u2026` },
    { key: "ai_generating",       label: "Generating Lesson",           desc: `${agent} is writing narration, explanations, and quizzes\u2026` },
    { key: "ai_retry",            label: "Optimizing Generation",       desc: `${agent} is refining the approach for better results\u2026` },
    { key: "ai_refining",         label: "Refining Output",             desc: `${agent} is reviewing and improving for accuracy\u2026` },
    { key: "planning_outline",    label: "Building Lesson Structure",   desc: `${agent} is structuring parts and key concepts\u2026` },
    { key: "planning_visuals_1",  label: "Drawing Part 1",              desc: `${agent} is creating whiteboard animations for Part 1\u2026` },
    { key: "planning_visuals_2",  label: "Drawing Part 2",              desc: `${agent} is creating whiteboard animations for Part 2\u2026` },
    { key: "planning_visuals_3",  label: "Drawing Part 3",              desc: `${agent} is creating whiteboard animations for Part 3\u2026` },
    { key: "saving",              label: "Saving Lesson",               desc: "Saving scenes, visuals, and quiz data to the database\u2026" },
    { key: "finalizing",          label: "Finalizing",                  desc: "Wrapping up \u2014 other lessons continue in the background\u2026" },
  ];
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
function IconPaperclip({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSend({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSettings({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={className}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Chat-style Processing Panel ──────────────────────────────────────────────
interface ProcessingPanelProps {
  file: File | null;
  sourceLabel: string;
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
    <div className="flex flex-col gap-4">
      {/* User message bubble */}
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white">
          <p className="font-medium">{sourceLabel}</p>
          {file && <p className="mt-0.5 text-xs text-blue-200">{formatFileSize(file.size)}</p>}
        </div>
      </div>

      {/* AI response bubble */}
      <div className="flex justify-start">
        <div className="max-w-full w-full rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isError ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-600"}`}>
              {isError ? <IconAlert className="w-4 h-4" /> : <IconSpinner className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isError ? "Processing Failed" : "Building Your Lesson"}
              </p>
              {!isError && (
                <p className="text-[11px] text-slate-400">
                  {providerLabel} &middot; {modelName} &middot; {formatElapsed(elapsed)}
                </p>
              )}
            </div>
          </div>

          {!isError && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-500 truncate pr-2">{stages[currentIdx]?.desc}</span>
                <span className="text-xs font-bold text-blue-600 font-mono tabular-nums shrink-0">{progress}%</span>
              </div>
              <div className="relative w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {stages.map((stage, idx) => {
              const isDone = idx < currentIdx;
              const isActive = !isError && idx === currentIdx;
              const isFailed = isError && idx === currentIdx;
              const duration = stepDurations[stage.key];

              if (!isDone && !isActive && !isFailed) return null;

              return (
                <div key={stage.key} className="flex items-center gap-2 py-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isDone ? <span className="text-emerald-500"><IconCheck className="w-3.5 h-3.5" /></span>
                    : isActive ? <IconSpinner className="w-3.5 h-3.5 text-blue-500" />
                    : <span className="text-red-500 text-xs font-bold">&times;</span>}
                  </div>
                  <span className={`text-xs ${isActive ? "text-blue-700 font-medium" : isFailed ? "text-red-600" : "text-slate-500"}`}>
                    {stage.label}
                  </span>
                  {isDone && duration !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">{formatElapsed(duration)}</span>
                  )}
                  {isActive && <span className="text-[10px] text-blue-400 animate-pulse ml-auto">running&hellip;</span>}
                </div>
              );
            })}
          </div>

          {isError && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-red-500 mb-2">{errorMsg ?? "An error occurred during processing."}</p>
              <button onClick={onRetry} className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">
                Try Again
              </button>
            </div>
          )}

          {!isError && (
            <p className="mt-2 text-[11px] text-slate-400">
              AI lesson generation typically takes 1&ndash;3 minutes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main UploadZone ──────────────────────────────────────────────────────────
export default function UploadZone({ onReady }: UploadZoneProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "explain">("explain");
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

  // UI toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch(() => {
        setProviders([
          { id: "blaze", label: "BlazeAI", icon: "", name: "BlazeAI (Multi-model)", desc: "Free tier with multiple models", badge: null },
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
    setSourceLabel(text.length > 60 ? text.slice(0, 60) + "\u2026" : text);
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

  function handleSubmit() {
    if (activeTab === "explain" && textInput.trim().length >= 2) {
      startExplain();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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

  const fallbackProviders: AiProviderOption[] = [
    { id: "blaze", label: "BlazeAI", icon: "", name: "BlazeAI (Multi-model)", desc: "Free tier with multiple models", badge: null },
  ];
  const displayProviders = providers.length > 0 ? providers : fallbackProviders;

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

  // ── Chat-style idle form ──────────────────────────────────────────────────
  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Welcome area */}
      <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">What would you like to learn?</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Type a topic below or attach a file, and I&apos;ll create a visual whiteboard lesson for you.
        </p>

        {/* Quick presets */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {LESSON_PRESETS.slice(0, 3).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setLessonIntent(preset.intent);
                setExplanationMode(preset.mode);
                setShowPresets(false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedPreset?.id === preset.id
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/90">
          <div className="text-center">
            <IconPaperclip className="mx-auto h-8 w-8 text-blue-500" />
            <p className="mt-2 text-sm font-medium text-blue-700">Drop your file here</p>
            <p className="text-xs text-blue-500">PDF &middot; DOCX &middot; TXT &middot; MD &middot; PNG &middot; JPG</p>
          </div>
        </div>
      )}

      {/* Selected options as pills */}
      <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
          {selectedIntent.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          {selectedMode.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          {providerLabel} &middot; {modelDisplayName}
        </span>
        {file && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <IconPaperclip className="w-3 h-3" /> {file.name}
            <button onClick={() => setFile(null)} className="ml-0.5 text-emerald-400 hover:text-emerald-600">
              <IconX className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      {/* Input area */}
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:border-blue-300 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]">
        {/* Extra guidance row */}
        {(subject || instructions || textSubject || textInstructions) && (
          <div className="border-b border-slate-100 px-4 py-2">
            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
              {(activeTab === "upload" ? subject : textSubject) && (
                <span className="rounded bg-slate-100 px-2 py-0.5">Subject: {activeTab === "upload" ? subject : textSubject}</span>
              )}
              {(activeTab === "upload" ? instructions : textInstructions) && (
                <span className="rounded bg-slate-100 px-2 py-0.5 truncate max-w-[200px]">Notes: {activeTab === "upload" ? instructions : textInstructions}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          {/* File attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Attach a file"
          >
            <IconPaperclip className="w-[18px] h-[18px]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Text input */}
          <textarea
            placeholder="Type a topic like 'Photosynthesis' or 'Newton's second law'..."
            value={activeTab === "explain" ? textInput : subject}
            onChange={(e) => {
              if (activeTab === "explain") setTextInput(e.target.value);
              else setSubject(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent py-2 text-sm text-slate-800 placeholder-slate-400 outline-none"
            style={{ minHeight: "36px", maxHeight: "120px" }}
          />

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
              showSettings ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
            title="Settings"
          >
            <IconSettings className="w-[18px] h-[18px]" />
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={activeTab === "explain" ? textInput.trim().length < 2 : !file}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconSend className="w-4 h-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 border-t border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={() => setActiveTab("explain")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === "explain" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Type a topic
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === "upload" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Upload a file
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
            >
              Presets
            </button>
          </div>
        </div>
      </div>

      {/* Settings popover */}
      {showSettings && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Lesson Settings</h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
              <IconX className="w-4 h-4" />
            </button>
          </div>

          {/* Intent */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Lesson Goal</p>
            <div className="flex flex-wrap gap-1.5">
              {LESSON_INTENTS.map((intent) => (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => setLessonIntent(intent.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    lessonIntent === intent.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  title={intent.desc}
                >
                  {intent.label}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation Mode */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Board Style</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPLANATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setExplanationMode(mode.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    explanationMode === mode.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  title={mode.desc}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider & Model */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">AI Provider</p>
            <div className="flex flex-wrap gap-1.5">
              {displayProviders.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAiProvider(opt.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    aiProvider === opt.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                  {opt.badge && <span className="ml-1 text-[10px] opacity-60">({opt.badge})</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Model</p>
            <div className="flex flex-wrap gap-1.5">
              {modelOptionsForProvider.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnalysisModel(opt.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    analysisModel === opt.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                  {opt.badge && <span className="ml-1 text-[10px] opacity-60">({opt.badge})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Instructions */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Extra Guidance</p>
            <input
              type="text"
              placeholder="Subject label (optional)"
              value={activeTab === "upload" ? subject : textSubject}
              onChange={(e) => activeTab === "upload" ? setSubject(e.target.value) : setTextSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 mb-2"
            />
            <textarea
              placeholder="Extra instructions (optional): difficulty level, more diagrams, focus on examples..."
              value={activeTab === "upload" ? instructions : textInstructions}
              onChange={(e) => activeTab === "upload" ? setInstructions(e.target.value) : setTextInstructions(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 resize-none"
            />
          </div>
        </div>
      )}

      {/* Presets popover */}
      {showPresets && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">Teaching Presets</h3>
            <button onClick={() => setShowPresets(false)} className="text-slate-400 hover:text-slate-600">
              <IconX className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-2">
            {LESSON_PRESETS.map((preset) => {
              const active = selectedPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setLessonIntent(preset.intent);
                    setExplanationMode(preset.mode);
                    setShowPresets(false);
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${active ? "text-blue-700" : "text-slate-800"}`}>{preset.label}</span>
                    {active && <span className="text-[10px] font-semibold text-blue-600 uppercase">Active</span>}
                  </div>
                  <p className={`mt-0.5 text-xs ${active ? "text-blue-600" : "text-slate-500"}`}>{preset.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Polling helper ───────────────────────────────────────────────────────────
async function poll(
  lessonId: string,
  onReady: (id: string, seriesId?: string, totalLessons?: number) => void,
  setStep: (step: string) => void
) {
  const MAX = 300;
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
