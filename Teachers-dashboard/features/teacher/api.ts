import { apiRequest } from "../shared/config";

// Alias for backward compat within this file
const request = apiRequest;

import type { TeacherDashboard, TeacherLesson, TeacherExercise, TeacherExam, TeacherSubmission, ClassData } from "./types";

// Re-export types so hooks can import them from this module
export type { TeacherDashboard, TeacherLesson, TeacherExercise, TeacherExam, TeacherSubmission, ClassData } from "./types";

export async function getTeacherDashboard(): Promise<TeacherDashboard> {
  return request("/teacher/dashboard");
}

export async function getClasses(): Promise<{ classes: ClassData }> {
  return request("/teacher/classes");
}

export async function getLessons(status?: string, subjectId?: string): Promise<{ lessons: TeacherLesson[] }> {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (subjectId) qs.set("subjectId", subjectId);
  const q = qs.toString();
  return request(`/teacher/lessons${q ? `?${q}` : ""}`);
}

export async function createLesson(data: any): Promise<{ ok: boolean; lesson: TeacherLesson }> {
  return request("/teacher/lessons", { method: "POST", body: JSON.stringify(data) });
}

export async function updateLesson(id: string, data: any): Promise<{ ok: boolean; lesson: TeacherLesson }> {
  return request(`/teacher/lessons/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteLesson(id: string): Promise<{ ok: boolean }> {
  return request(`/teacher/lessons/${id}`, { method: "DELETE" });
}

export async function getExercises(): Promise<{ exercises: TeacherExercise[] }> {
  return request("/teacher/exercises");
}

export async function createExercise(data: any): Promise<{ ok: boolean; exercise: TeacherExercise }> {
  return request("/teacher/exercises", { method: "POST", body: JSON.stringify(data) });
}

export async function getExams(): Promise<{ exams: TeacherExam[] }> {
  return request("/teacher/exams");
}

export async function createExam(data: any): Promise<{ ok: boolean; exam: TeacherExam }> {
  return request("/teacher/exams", { method: "POST", body: JSON.stringify(data) });
}

export async function getSubmissions(params?: { exerciseId?: string; studentId?: string; status?: string }): Promise<{ submissions: TeacherSubmission[] }> {
  const qs = new URLSearchParams();
  if (params?.exerciseId) qs.set("exerciseId", params.exerciseId);
  if (params?.studentId) qs.set("studentId", params.studentId);
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  return request(`/teacher/submissions${q ? `?${q}` : ""}`);
}

// ── Add Students to Class ─────────────────────────────────────────────────────
// Students are only created after admin approval. Teachers search for an
// already-approved, active student by their student code and add them to
// their own class (a student can belong to more than one teacher's class).
export interface StudentSearchResult {
  id: string;
  studentCode: string;
  username: string;
  email: string;
  schoolYear: { _id: string; name: string; grade?: number } | null;
  section: string;
  alreadyAssigned: boolean;
}

export async function searchStudentByCode(code: string): Promise<{ student: StudentSearchResult }> {
  return request(`/teacher/students/search?code=${encodeURIComponent(code)}`);
}

export async function addStudentByCode(studentCode: string): Promise<{ ok: boolean; studentId: string }> {
  return request("/teacher/students/add", { method: "POST", body: JSON.stringify({ studentCode }) });
}

export async function removeStudentFromClass(id: string): Promise<{ ok: boolean }> {
  return request(`/teacher/students/${id}`, { method: "DELETE" });
}

// ── Teacher-Assigned Challenges ────────────────────────────────────────────────
export async function getTeacherChallenges(): Promise<{ challenges: any[] }> {
  return request("/teacher/challenges");
}

export async function createTeacherChallenge(data: {
  title: string;
  description?: string;
  exerciseId: string;
  rules?: string;
  startDate: string;
  endDate: string;
  rewards?: { xp?: number; coins?: number };
  studentIds?: string[];
}): Promise<{ ok: boolean; challenge: any }> {
  return request("/teacher/challenges", { method: "POST", body: JSON.stringify(data) });
}

export async function gradeSubmission(id: string, data: { teacherFeedback?: string; score?: number }): Promise<{ ok: boolean }> {
  return request(`/teacher/submissions/${id}/feedback`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getAnalytics(classId: string): Promise<any> {
  return request(`/teacher/analytics/${classId}`);
}

export async function generateAILesson(topic: string, subjectId?: string, difficulty?: string): Promise<{ lesson: any }> {
  return request("/ai/generate-lesson", { method: "POST", body: JSON.stringify({ topic, subjectId, difficulty }) });
}

export async function generateAIExercise(topic: string, difficulty?: string, type?: string): Promise<{ exercise: any }> {
  return request("/ai/generate-exercise", { method: "POST", body: JSON.stringify({ topic, difficulty, type }) });
}

// ── Teacher Notifications ─────────────────────────────────────────────────────
export async function sendNotification(data: {
  studentIds: string[];
  type?: string;
  title: string;
  message?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}): Promise<{ ok: boolean; sent: number }> {
  return request("/teacher/notifications", { method: "POST", body: JSON.stringify(data) });
}

export async function getStudentNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  return request("/student/notifications");
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return request(`/student/notifications/${id}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return request("/student/notifications/read-all", { method: "PUT" });
}
