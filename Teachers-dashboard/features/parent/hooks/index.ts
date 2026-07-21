"use client";

import { useState, useEffect, useCallback } from "react";
import { searchStudent, getChildProgress, type ChildProgress } from "../api";

export function useParentSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (studentCode: string, nationalId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchStudent(studentCode, nationalId);
      sessionStorage.setItem("parentToken", result.tempToken);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, loading, error };
}

export function useChildProgress(studentId: string | null) {
  const [data, setData] = useState<ChildProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const token = sessionStorage.getItem("parentToken");
    if (!token) { setLoading(false); return; }
    getChildProgress(studentId, token)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  return { data, loading, error };
}
