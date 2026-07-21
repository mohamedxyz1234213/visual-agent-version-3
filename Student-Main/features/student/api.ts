import type {
  StudentDashboard,
  Lesson,
  Exercise,
  Submission,
  Achievement,
  LeaderboardResponse,
  Notification,
  WeeklyChallenge,
  AvatarSession,
  AvatarMessage,
  ConceptMastery,
  AdaptivePathResponse,
} from "./types";

export type {
  StudentDashboard,
  Lesson,
  Exercise,
  Submission,
  Achievement,
  LeaderboardResponse,
  Notification,
  WeeklyChallenge,
}

import { apiRequest } from "../shared/config";

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getStudentDashboard(): Promise<StudentDashboard> {
  return apiRequest<StudentDashboard>("/student/dashboard");
}

// ── Lessons ───────────────────────────────────────────────────────────────────
export async function getLessons(params?: {
  subjectId?: string;
  difficulty?: string;
}): Promise<{ lessons: Lesson[] }> {
  const qs = new URLSearchParams();
  if (params?.subjectId) qs.set("subjectId", params.subjectId);
  if (params?.difficulty) qs.set("difficulty", params.difficulty);
  const query = qs.toString();
  return apiRequest(`/student/lessons${query ? `?${query}` : ""}`);
}

export async function getLesson(id: string): Promise<{ lesson: Lesson }> {
  return apiRequest(`/student/lessons/${id}`);
}

export async function completeLesson(
  id: string,
  timeSpent?: number
): Promise<{ ok: boolean; xpEarned: number; leveledUp: boolean; newLevel: number }> {
  return apiRequest(`/student/lessons/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({ timeSpent }),
  });
}

// ── Exercises ─────────────────────────────────────────────────────────────────
export async function getExercises(params?: {
  subjectId?: string;
  difficulty?: string;
  type?: string;
}): Promise<{ exercises: Exercise[] }> {
  const qs = new URLSearchParams();
  if (params?.subjectId) qs.set("subjectId", params.subjectId);
  if (params?.difficulty) qs.set("difficulty", params.difficulty);
  if (params?.type) qs.set("type", params.type);
  const query = qs.toString();
  return apiRequest(`/student/exercises${query ? `?${query}` : ""}`);
}

export async function getExercise(id: string): Promise<{ exercise: Exercise }> {
  return apiRequest(`/student/exercises/${id}`);
}

export async function submitExercise(
  id: string,
  data: { code: string; language?: string; timeSpent?: number }
): Promise<{
  ok: boolean;
  submission: { id: string; status: string; score: number; results: any[] };
  xpEarned: number;
}> {
  return apiRequest(`/student/exercises/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Submissions ───────────────────────────────────────────────────────────────
export async function getSubmissions(): Promise<{ submissions: Submission[] }> {
  return apiRequest("/student/submissions");
}

// ── Progress ──────────────────────────────────────────────────────────────────
export async function getProgress(): Promise<{ progress: any[] }> {
  return apiRequest("/student/progress");
}

// ── Achievements ──────────────────────────────────────────────────────────────
export async function getAchievements(): Promise<{ achievements: Achievement[] }> {
  return apiRequest("/student/achievements");
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function getLeaderboard(
  type?: string,
  limit?: number,
  timeframe?: string
): Promise<LeaderboardResponse> {
  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (limit) qs.set("limit", String(limit));
  if (timeframe) qs.set("timeframe", timeframe);
  const query = qs.toString();
  return apiRequest(`/gamification/leaderboard${query ? `?${query}` : ""}`);
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  return apiRequest("/student/notifications");
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return apiRequest(`/student/notifications/${id}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiRequest("/student/notifications/read-all", { method: "PUT" });
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<{ settings: any }> {
  return apiRequest("/student/settings");
}

export async function updateSettings(settings: any): Promise<{ ok: boolean; settings: any }> {
  return apiRequest("/student/settings", {
    method: "PUT",
    body: JSON.stringify({ preferences: settings }),
  });
}

// ── Gamification ──────────────────────────────────────────────────────────────
export async function getChallenges(): Promise<{ challenges: WeeklyChallenge[] }> {
  return apiRequest("/gamification/challenges");
}

export async function joinChallenge(id: string): Promise<{ ok: boolean; message: string }> {
  return apiRequest(`/gamification/challenges/${id}/join`, { method: "POST" });
}

export async function submitChallenge(
  id: string,
  data: { score: number; time: number }
): Promise<{ ok: boolean; rank: number; xpEarned: number; coinsEarned: number }> {
  return apiRequest(`/gamification/challenges/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Avatar Teacher ────────────────────────────────────────────────────────────
export async function startAvatarSession(data: {
  topic?: string;
  dialect?: string;
  subjectId?: string;
  lessonId?: string;
}): Promise<AvatarSession> {
  return apiRequest("/ai/avatar/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendAvatarMessage(data: {
  sessionId: string;
  content: string;
  type?: string;
}): Promise<AvatarMessage> {
  return apiRequest("/ai/avatar/message", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function endAvatarSession(data: {
  sessionId: string;
  rating?: number;
}): Promise<{ sessionId: string; summary: string; xpEarned: number; duration: number }> {
  return apiRequest("/ai/avatar/end", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

// ── AI Feedback ───────────────────────────────────────────────────────────────
export async function getAIFeedback(
  submissionId: string
): Promise<{ feedback: { text: string; details: any } }> {
  return apiRequest("/ai/feedback", {
    method: "POST",
    body: JSON.stringify({ submissionId }),
  });
}

// ── Adaptive Learning Onboarding ─────────────────────────────────────────────
export async function getOnboardingStatus(): Promise<{
  onboardingCompleted: boolean;
  learningProfile: any;
  completedAt: string | null;
}> {
  return apiRequest("/student/adaptive-onboarding-status");
}

export async function submitOnboarding(data: {
  learningStyle: string;
  pacing: string;
  practiceFrequency: string;
  problemSolvingApproach: string;
  experienceLevel: string;
}): Promise<{ ok: boolean; learningProfile: any; message: string }> {
  return apiRequest("/student/adaptive-onboarding", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Adaptive Learning Path ────────────────────────────────────────────────────
export async function getAdaptivePath(): Promise<AdaptivePathResponse> {
  return apiRequest("/student/adaptive-path");
}


