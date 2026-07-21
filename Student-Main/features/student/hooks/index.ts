"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getStudentDashboard,
  getLessons,
  getExercises,
  getSubmissions,
  getProgress,
  getAchievements,
  getLeaderboard,
  getNotifications,
  updateSettings,
  type StudentDashboard,
  type Lesson,
  type Exercise,
  type Submission,
  type Achievement,
  type LeaderboardResponse,
  type Notification,
} from "../api";

// ── useStudentDashboard ───────────────────────────────────────────────────────
export function useStudentDashboard() {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getStudentDashboard();
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}

// ── useLessons ────────────────────────────────────────────────────────────────
export function useLessons(params?: { subjectId?: string; difficulty?: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getLessons(params);
      setLessons(d.lessons || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params?.subjectId, params?.difficulty]);

  useEffect(() => { refresh(); }, [refresh]);

  return { lessons, loading, error, refresh };
}

// ── useExercises ──────────────────────────────────────────────────────────────
export function useExercises(params?: { subjectId?: string; difficulty?: string; type?: string }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getExercises(params);
      setExercises(d.exercises || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params?.subjectId, params?.difficulty, params?.type]);

  useEffect(() => { refresh(); }, [refresh]);

  return { exercises, loading, error, refresh };
}

// ── useSubmissions ────────────────────────────────────────────────────────────
export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getSubmissions();
      setSubmissions(d.submissions || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { submissions, loading, refresh };
}

// ── useAchievements ───────────────────────────────────────────────────────────
export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements().then((d) => setAchievements(d.achievements || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { achievements, loading };
}

// ── useLeaderboard ────────────────────────────────────────────────────────────
export function useLeaderboard(type?: string) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(type).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  return { ...data, loading };
}

// ── useNotifications ──────────────────────────────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const d = await getNotifications();
      setNotifications(d.notifications || []);
      setUnreadCount(d.unreadCount || 0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { notifications, unreadCount, loading, refresh };
}

// ── useProgress ───────────────────────────────────────────────────────────────
export function useProgress() {
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgress().then((d) => setProgress(d.progress || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { progress, loading };
}

// ── useChallenges ────────────────────────────────────────────────────────────
import { getChallenges, joinChallenge as apiJoinChallenge } from "../api";
import { getStudentExams, type StudentExam } from "../api";
import type { WeeklyChallenge } from "../types";

export function useChallenges() {
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallenges().then((d) => setChallenges(d.challenges || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const join = useCallback(async (id: string) => {
    await apiJoinChallenge(id);
    setChallenges((prev) => prev.map((c) => c._id === id ? { ...c, isParticipating: true, participantCount: (c.participantCount || 0) + 1 } : c));
  }, []);

  return { challenges, loading, join };
}

// ── useStudentExams ───────────────────────────────────────────────────────────
export function useStudentExams() {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getStudentExams();
      setExams(d.exams || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { exams, loading, error, refresh };
}
