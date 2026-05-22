import type {
  Lesson,
  LessonStatus,
  LessonPart,
  Quiz,
  QuizAttemptResult,
  SeriesLesson,
  DashboardResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  subject?: string,
  userInstructions?: string,
  analysisModel?: string,
  aiProvider?: string,
  explanationMode?: string,
  lessonIntent?: string
): Promise<LessonStatus> {
  const form = new FormData();
  form.append("file", file);
  if (subject) form.append("subject", subject);
  if (userInstructions) form.append("user_instructions", userInstructions);
  form.append("ai_provider", aiProvider || "blaze");
  form.append("analysis_model", analysisModel || "qwen3.6-plus-thinking");
  if (explanationMode) form.append("explanation_mode", explanationMode);
  if (lessonIntent) form.append("lesson_intent", lessonIntent);

  const res = await fetch(`${BASE}/upload/`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function explainText(
  text: string,
  subject?: string,
  userInstructions?: string,
  explanationMode?: string,
  analysisModel?: string,
  aiProvider?: string,
  lessonIntent?: string
): Promise<LessonStatus> {
  const res = await fetch(`${BASE}/explain/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      subject: subject || undefined,
      user_instructions: userInstructions || undefined,
      explanation_mode: explanationMode || "full_lesson",
      ai_provider: aiProvider || "blaze",
      analysis_model: analysisModel || "qwen3.6-plus-thinking",
      lesson_intent: lessonIntent || "teach",
    }),
  });
  if (!res.ok) throw new Error(`Explain failed: ${res.statusText}`);
  return res.json();
}

export type AiModelOption = {
  id: string;
  label: string;
  desc: string;
  badge: string | null;
};

export type AiProviderOption = {
  id: string;
  label: string;
  icon: string;
  name: string;
  desc: string;
  badge: string | null;
  models?: AiModelOption[];
};

export async function testAIConnection(
  provider = "blaze",
  model?: string
): Promise<{ ok: boolean; provider: string; model: string; endpoint: string; error?: string; latencyMs: number }> {
  const q = new URLSearchParams({ provider });
  if (model) q.set("model", model);
  const res = await fetch(`${BASE}/upload/test-ai?${q}`);
  if (!res.ok) throw new Error(`AI test failed: ${res.statusText}`);
  return res.json();
}

export async function fetchProviders(): Promise<AiProviderOption[]> {
  const res = await fetch(`${BASE}/upload/providers`);
  if (!res.ok) throw new Error(`Failed to fetch providers: ${res.statusText}`);
  const data = await res.json();
  return data.providers;
}

export async function pollUploadStatus(lessonId: string): Promise<LessonStatus> {
  return request<LessonStatus>(`/upload/status/${lessonId}`);
}

// ─── Lessons ──────────────────────────────────────────────────────────────────

export async function listLessons(): Promise<LessonStatus[]> {
  return request<LessonStatus[]>("/lessons/");
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  return request<Lesson>(`/lessons/${lessonId}`);
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await request<void>(`/lessons/${lessonId}`, { method: "DELETE" });
}

export async function getSeriesLessons(seriesId: string): Promise<SeriesLesson[]> {
  return request<SeriesLesson[]>(`/lessons/series/${seriesId}`);
}

// ─── Storyboard ───────────────────────────────────────────────────────────────

export async function getPartStoryboard(partId: string): Promise<LessonPart> {
  return request<LessonPart>(`/storyboard/part/${partId}`);
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export async function getQuizForPart(partId: string): Promise<Quiz> {
  return request<Quiz>(`/quiz/part/${partId}`);
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, string>,
  sessionId?: string
): Promise<QuizAttemptResult> {
  return request<QuizAttemptResult>(`/quiz/${quizId}/attempt`, {
    method: "POST",
    body: JSON.stringify({ answers, session_id: sessionId }),
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: "recent" | "oldest" | "title";
}

export async function fetchDashboard(
  params: DashboardParams = {}
): Promise<DashboardResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.sort) qs.set("sort", params.sort);
  const query = qs.toString();
  return request<DashboardResponse>(`/dashboard/${query ? `?${query}` : ""}`);
}
