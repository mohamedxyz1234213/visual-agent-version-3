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
    credentials: "include",
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
  form.append("ai_provider", aiProvider || "openrouter");
  form.append("analysis_model", analysisModel || "nvidia/nemotron-3-ultra-550b-a55b:free");
  if (explanationMode) form.append("explanation_mode", explanationMode);
  if (lessonIntent) form.append("lesson_intent", lessonIntent);

  const res = await fetch(`${BASE}/upload/`, { method: "POST", body: form, credentials: "include" });
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
    credentials: "include",
    body: JSON.stringify({
      text,
      subject: subject || undefined,
      user_instructions: userInstructions || undefined,
      explanation_mode: explanationMode || "full_lesson",
      ai_provider: aiProvider || "openrouter",
      analysis_model: analysisModel || "nvidia/nemotron-3-ultra-550b-a55b:free",
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
  provider = "openrouter",
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

export async function fetchTeacherDashboard(
  params: DashboardParams = {}
): Promise<DashboardResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.sort) qs.set("sort", params.sort);
  const query = qs.toString();
  return request<DashboardResponse>(`/dashboard/teacher${query ? `?${query}` : ""}`);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin" | "student" | "teacher" | "super-admin";
  status: "active" | "disabled";
  max_ai_requests: number;
  ai_requests_used: number;
  last_login_at: string | null;
  created_at: string;
}

export async function fetchMe(): Promise<SafeUser | null> {
  const res = await fetch(`${BASE}/auth/me`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch /me: ${res.status}`);
  const data = await res.json();
  return data.user ?? null;
}

export async function loginRequest(identifier: string, password: string): Promise<SafeUser> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Login failed: ${res.status}`);
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export async function requestEarlyAccess(input: {
  email: string;
  username: string;
  reason?: string;
}): Promise<{ request_id: string; message: string }> {
  const res = await fetch(`${BASE}/auth/request-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export async function verifyInvite(token: string): Promise<{ email: string; username: string; expires_at: string }> {
  const res = await fetch(`${BASE}/auth/verify-invite/${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Invalid invite`);
  return data;
}

export async function registerStudent(input: {
  fullName: string;
  username: string;
  schoolEmail: string;
  parentPhone: string;
  nationalId: string;
  dateOfBirth: string;
  password: string;
}): Promise<{ ok: true; message: string; request_id: string }> {
  const res = await fetch(`${BASE}/registration/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Registration failed: ${res.status}`);
  return data;
}

export async function checkStudentRegistrationStatus(
  schoolEmail: string,
  nationalId: string
): Promise<{ status: string; rejectionReason?: string; submittedAt: string; reviewedAt?: string }> {
  const params = new URLSearchParams({ schoolEmail, nationalId });
  const res = await fetch(`${BASE}/registration/student/status?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lookup failed: ${res.status}`);
  return data;
}

export async function completeSignup(input: {
  token: string;
  email: string;
  username: string;
  password: string;
}): Promise<SafeUser> {
  const res = await fetch(`${BASE}/auth/complete-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Signup failed: ${res.status}`);
  return data.user;
}

export async function bootstrapFirstAdmin(input: {
  email: string;
  username: string;
  password: string;
}): Promise<SafeUser> {
  const res = await fetch(`${BASE}/auth/bootstrap-first-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Bootstrap failed: ${res.status}`);
  return data.user;
}

export async function fetchBootstrapInfo(): Promise<{ has_admin: boolean; has_users: boolean }> {
  const res = await fetch(`${BASE}/auth/bootstrap-info`);
  if (!res.ok) return { has_admin: true, has_users: true };
  return res.json();
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminEarlyAccessRequest {
  id: string;
  email: string;
  username: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed" | "expired";
  invite_token: string | null;
  invite_expires_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  completed_at: string | null;
  completed_user_id: string | null;
  created_at: string;
  ip: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin" | "student" | "teacher" | "super-admin";
  status: "active" | "disabled";
  max_ai_requests: number;
  ai_requests_used: number;
  last_login_at: string | null;
  last_login_ip: string | null;
  lessons_count: number;
  active_sessions: number;
  created_at: string;
}

export interface AdminLesson {
  id: string;
  title: string;
  subject: string | null;
  source_filename: string;
  status: "processing" | "ready" | "error";
  processing_step: string;
  error_message: string | null;
  parts_count: number;
  series_id: string | null;
  lesson_index: number;
  total_lessons: number;
  created_at: string;
  owner: { id: string; email: string | null; username: string | null } | null;
}

export interface AdminStats {
  users: { total: number; by_status: Record<string, number> };
  early_access: { total: number; pending: number; approved: number; completed: number; rejected: number };
  lessons: { total: number; by_status: Record<string, number> };
  ai_requests: { total: number; by_status: Record<string, number> };
  activity_7d: { logins: number; ai_requests: number; early_access: number };
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data as T;
}

export const adminApi = {
  stats: () => adminRequest<AdminStats>("/admin/stats"),
  listEarlyAccess: (status?: string, search?: string) => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    return adminRequest<AdminEarlyAccessRequest[]>(`/admin/early-access${qs.toString() ? `?${qs}` : ""}`);
  },
  approveEarlyAccess: (id: string) =>
    adminRequest<{ ok: boolean; request: AdminEarlyAccessRequest; invite: { url: string; delivered: boolean; channel: string; previewUrl: string | null } }>(
      `/admin/early-access/${id}/approve`,
      { method: "POST", body: JSON.stringify({}) },
    ),
  rejectEarlyAccess: (id: string, reason?: string) =>
    adminRequest<{ ok: boolean; request: AdminEarlyAccessRequest }>(
      `/admin/early-access/${id}/reject`,
      { method: "POST", body: JSON.stringify({ reason }) },
    ),
  deleteEarlyAccess: (id: string) =>
    adminRequest<{ ok: boolean }>(`/admin/early-access/${id}`, { method: "DELETE" }),

  listUsers: (search?: string) =>
    adminRequest<AdminUser[]>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createUser: (input: { email: string; username: string; password: string; role?: "user" | "admin" | "student" | "teacher"; max_ai_requests?: number }) =>
    adminRequest<{ ok: boolean; user: SafeUser }>(`/admin/users`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  patchUser: (id: string, patch: Partial<{ max_ai_requests: number; ai_requests_used: number; status: "active" | "disabled"; role: "user" | "admin" | "student" | "teacher"; password: string }>) =>
    adminRequest<{ ok: boolean; user: SafeUser }>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteUser: (id: string) => adminRequest<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  getUserLessons: (id: string) =>
    adminRequest<{ user: { id: string; email: string; username: string }; lessons: AdminLesson[] }>(
      `/admin/users/${id}/lessons`,
    ),

  listLessons: (search?: string, status?: string) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (status) qs.set("status", status);
    return adminRequest<AdminLesson[]>(`/admin/lessons${qs.toString() ? `?${qs}` : ""}`);
  },
  getLesson: (id: string) => adminRequest<Record<string, unknown> & { id: string; title: string; parts: unknown[] }>(`/admin/lessons/${id}`),
  deleteLesson: (id: string) => adminRequest<{ ok: boolean }>(`/admin/lessons/${id}`, { method: "DELETE" }),

  loginLogs: (page = 1, limit = 25) =>
    adminRequest<{ items: Record<string, unknown>[]; page: number; limit: number; total: number; totalPages: number }>(
      `/admin/logs/login?page=${page}&limit=${limit}`,
    ),
  aiRequestLogs: (page = 1, limit = 25) =>
    adminRequest<{ items: Record<string, unknown>[]; page: number; limit: number; total: number; totalPages: number }>(
      `/admin/logs/ai-requests?page=${page}&limit=${limit}`,
    ),
  pageLogs: (page = 1, limit = 25) =>
    adminRequest<{ items: Record<string, unknown>[]; page: number; limit: number; total: number; totalPages: number }>(
      `/admin/logs/pages?page=${page}&limit=${limit}`,
    ),

  emailMode: () => adminRequest<{ mode: "smtp" | "ethereal" | "console" }>("/admin/email-mode"),
  sendTestEmail: (to?: string) =>
    adminRequest<{ ok: boolean; mode: string; to: string; delivered: boolean; channel: string; previewUrl: string | null; inviteUrl: string }>(
      `/admin/test-email`,
      { method: "POST", body: JSON.stringify({ to }) },
    ),
};
