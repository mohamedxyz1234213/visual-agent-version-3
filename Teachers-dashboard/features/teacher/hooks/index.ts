"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTeacherDashboard,
  getClasses,
  getLessons,
  getExercises,
  getExams,
  getSubmissions,
  searchStudentByCode,
  addStudentByCode,
  removeStudentFromClass,
  getTeacherChallenges,
  createTeacherChallenge,
  type TeacherDashboard,
  type ClassData,
  type TeacherLesson,
  type TeacherExercise,
  type TeacherExam,
  type TeacherSubmission,
  type StudentSearchResult,
} from "../api";

export function useTeacherDashboard() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setData(await getTeacherDashboard()); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useClasses() {
  const [classes, setClasses] = useState<ClassData>({});
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const d = await getClasses(); setClasses(d.classes || {}); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { classes, loading, refresh };
}

export function useTeacherLessons() {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const d = await getLessons(); setLessons(d.lessons || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { lessons, loading, refresh };
}

export function useTeacherExercises() {
  const [exercises, setExercises] = useState<TeacherExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const d = await getExercises(); setExercises(d.exercises || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { exercises, loading, refresh };
}

export function useTeacherExams() {
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const d = await getExams(); setExams(d.exams || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { exams, loading, refresh };
}

export function useTeacherSubmissions() {
  const [submissions, setSubmissions] = useState<TeacherSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const d = await getSubmissions(); setSubmissions(d.submissions || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { submissions, loading, refresh };
}

export function useAddStudent() {
  const [result, setResult] = useState<StudentSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { student } = await searchStudentByCode(code);
      setResult(student);
    } catch (err: any) {
      setError(err.message || "Student not found");
    } finally {
      setLoading(false);
    }
  }, []);

  const add = useCallback(async (code: string) => {
    await addStudentByCode(code);
    setResult(null);
  }, []);

  return { result, error, loading, search, add };
}

export function useRemoveStudent() {
  return useCallback(async (id: string) => {
    await removeStudentFromClass(id);
  }, []);
}

export function useTeacherChallenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const d = await getTeacherChallenges(); setChallenges(d.challenges || []); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (data: Parameters<typeof createTeacherChallenge>[0]) => {
    await createTeacherChallenge(data);
    await refresh();
  }, [refresh]);

  return { challenges, loading, refresh, create };
}
