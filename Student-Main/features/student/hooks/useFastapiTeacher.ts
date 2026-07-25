"use client";

import { useState, useCallback } from "react";
import {
  fastapiStartSession,
  fastapiSendVoice,
  fastapiSubmitCode,
} from "@/features/student/fastapi-teacher";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  emotion?: string;
}

export function useFastapiTeacher() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (topic?: string, dialect?: string, language?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fastapiStartSession({ topic, dialect, language });
        setSessionId(data.session_id);
        setMessages([
          {
            role: "assistant",
            text: data.teacher_response.speech,
            emotion: data.teacher_response.emotion,
          },
        ]);
      } catch (e: any) {
        setError(e.message);
        setMessages([
          {
            role: "assistant",
            text: "Welcome! I'm your AI coding teacher. How can I help you today?",
            emotion: "happy",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim() || loading) return;
      const userText = text.trim();
      setMessages((prev) => [...prev, { role: "user", text: userText }]);
      setLoading(true);
      try {
        const data = await fastapiSendVoice({
          session_id: sessionId,
          transcript: userText,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.teacher_response.speech,
            emotion: data.teacher_response.emotion,
          },
        ]);
      } catch (e: any) {
        setError(e.message);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, I encountered an error. Please try again.",
            emotion: "neutral",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading]
  );

  const submitCode = useCallback(
    async (code: string, exerciseId?: string, language?: string) => {
      if (!sessionId || loading) return;
      setLoading(true);
      try {
        const data = await fastapiSubmitCode({
          session_id: sessionId,
          code,
          exercise_id: exerciseId,
          language,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.teacher_response.speech,
            emotion: data.teacher_response.emotion,
          },
        ]);
        return data;
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading]
  );

  const endSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    loading,
    error,
    startSession,
    sendMessage,
    submitCode,
    endSession,
  };
}
