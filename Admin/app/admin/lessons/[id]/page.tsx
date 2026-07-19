"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/Admin/AdminShell";
import { AdminGuard } from "@/components/Admin/AdminGuard";
import { Card, Badge, Button, Toaster, toast } from "@/components/Admin/ui";
import { adminApi } from "@/lib/api";
import { IconCheck } from "@/components/shared/FluxIcons";

type AdminLessonDetail = {
  id: string;
  title: string;
  subject: string | null;
  source_filename: string;
  source_file_url: string | null;
  summary: string | null;
  status: "processing" | "ready" | "error";
  processing_step: string;
  error_message: string | null;
  created_at: string;
  series_id: string | null;
  lesson_index: number;
  total_lessons: number;
  ai_provider: string | null;
  analysis_model: string | null;
  owner: { id: string; email: string | null; username: string | null } | null;
  parts: Array<{
    id: string;
    title: string;
    order_index: number;
    narration: string | null;
    duration_seconds: number;
    audio_url: string | null;
    part_type: "content" | "quiz" | "final_quiz";
    scenes: Array<{ id: string; time_offset: number; action_type: string; payload: unknown }>;
    quiz: null | { id: string; part_id: string; questions: Array<{ id: string; question_type: string; question_text: string; options: { choices?: string[]; correct?: string } | null; correct_answer?: string | null; explanation: string | null; difficulty: string }> };
  }>;
};

export default function AdminLessonDetailPage() {
  return (
    <AdminGuard>
      <AdminShell pageKicker="Admin" pageTitle="Lesson preview">
        <Body />
      </AdminShell>
    </AdminGuard>
  );
}

function Body() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<AdminLessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPartId, setOpenPartId] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    setLoading(true);
    adminApi.getLesson(id)
      .then((l) => setLesson(l as AdminLessonDetail))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function handleDelete() {
    if (!lesson) return;
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await adminApi.deleteLesson(lesson.id);
      toast("Deleted", "success");
      router.push("/admin/lessons");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (error) return <Card><p className="text-sm text-red-700">{error}</p></Card>;
  if (!lesson) return <Card><p className="text-sm text-slate-500">Not found.</p></Card>;

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">{lesson.title || "Untitled lesson"}</h2>
              <Badge color={lesson.status === "ready" ? "green" : lesson.status === "processing" ? "amber" : "red"}>{lesson.status}</Badge>
            </div>
            {lesson.subject && <p className="mt-0.5 text-sm text-slate-500">{lesson.subject}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {lesson.parts.length} parts · created {new Date(lesson.created_at).toLocaleString()}
              {lesson.total_lessons > 1 && ` · series ${lesson.lesson_index + 1} of ${lesson.total_lessons}`}
            </p>
            {lesson.owner && (
              <p className="mt-1 text-xs text-slate-500">
                Owner:{" "}
                <Link href={`/admin/users/${lesson.owner.id}`} className="font-semibold text-blue-700 hover:text-blue-900">
                  {lesson.owner.username || lesson.owner.email}
                </Link>
              </p>
            )}
            {lesson.ai_provider && (
              <p className="mt-1 text-[11px] text-slate-400">
                AI: <span className="font-mono">{lesson.ai_provider}</span> · <span className="font-mono">{lesson.analysis_model}</span>
              </p>
            )}
            {lesson.error_message && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{lesson.error_message}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/admin/lessons")}>← All lessons</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
        {lesson.summary && (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Summary</p>
            <p className="mt-1">{lesson.summary}</p>
          </div>
        )}
      </Card>

      <ol className="flex flex-col gap-2">
        {lesson.parts.map((p) => (
          <li key={p.id}>
            <PartRow
              part={p}
              isOpen={openPartId === p.id}
              onToggle={() => setOpenPartId(openPartId === p.id ? null : p.id)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function PartRow({ part, isOpen, onToggle }: {
  part: AdminLessonDetail["parts"][number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="!p-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            {part.order_index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{part.title}</p>
            <p className="text-[11px] text-slate-500">
              {part.part_type === "content" ? "Content" : part.part_type === "quiz" ? "Quiz" : "Final quiz"} ·
              {" "}{Math.round(part.duration_seconds)}s ·
              {" "}{part.scenes.length} scenes
              {part.quiz && ` · ${part.quiz.questions.length} questions`}
            </p>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 text-sm">
          {part.narration && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Narration</p>
              <p className="mt-1 leading-6 text-slate-700">{part.narration}</p>
            </div>
          )}
          {part.scenes.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Scenes ({part.scenes.length})</p>
              <ul className="mt-1 grid gap-1.5">
                {part.scenes.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 text-xs">
                    <span className="font-mono text-slate-400">{s.time_offset.toFixed(1)}s</span>
                    <span className="font-mono text-slate-700">{s.action_type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {part.quiz && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Quiz questions</p>
              <ol className="mt-1 grid gap-2">
                {part.quiz.questions.map((q, i) => (
                  <li key={q.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-700">{i + 1}. {q.question_text}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{q.question_type} · {q.difficulty}</p>
                    {q.options?.choices && (
                      <ul className="mt-1 list-disc pl-5 text-[11px] text-slate-600">
                        {q.options.choices.map((c) => <li key={c}><span className="font-mono">{c}</span>{q.options?.correct === c && <span className="ml-1 text-emerald-700 inline-flex items-center gap-0.5"><IconCheck size={11} /> correct</span>}</li>)}
                      </ul>
                    )}
                    {q.explanation && <p className="mt-1 text-[11px] text-slate-500">{q.explanation}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
