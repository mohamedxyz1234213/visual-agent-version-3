import { API_BASE } from "../shared/config";
const BASE = API_BASE;

export interface ParentSearchResult {
  ok: boolean;
  tempToken: string;
  studentId: string;
  student: { code: string; username: string };
}

export interface ChildProgress {
  student: {
    code: string;
    username: string;
    xp: number;
    level: number;
    streak: number;
    totalLessonsCompleted: number;
    totalExercisesCompleted: number;
    averageScore: number;
    totalTimeSpent: number;
  };
  progress: any[];
  recentSubmissions: any[];
  achievements: any[];
  consistencyScore: number;
}

export async function searchStudent(studentCode: string, nationalId: string): Promise<ParentSearchResult> {
  const res = await fetch(`${BASE}/parent/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentCode, nationalId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Search failed");
  return data;
}

export async function getChildProgress(studentId: string, token: string): Promise<ChildProgress> {
  const res = await fetch(`${BASE}/parent/child/${studentId}/progress?token=${token}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to load progress");
  return data;
}
