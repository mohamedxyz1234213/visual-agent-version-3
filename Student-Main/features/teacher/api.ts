import { apiRequest } from "../shared/config";

// Alias for backward compat within this file
const request = apiRequest;

import type { TeacherDashboard, TeacherLesson, TeacherExercise, TeacherExam, TeacherSubmission, ClassData } from "./types";

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
