import { apiRequest } from "../shared/config";

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
  return apiRequest<ParentSearchResult>("/parent/search", {
    method: "POST",
    body: JSON.stringify({ studentCode, nationalId }),
  });
}

export async function getChildProgress(studentId: string, token: string): Promise<ChildProgress> {
  return apiRequest<ChildProgress>(`/parent/child/${studentId}/progress?token=${token}`);
}
