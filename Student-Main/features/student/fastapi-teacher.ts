const FASTAPI_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8001";

export interface FastapiTeacherResponse {
  speech: string;
  emotion: string;
  next_action: string;
  lesson_state: string;
  enable_microphone: boolean;
  show_code_editor: boolean;
  progress: Record<string, any> | null;
  student_feedback: string | null;
}

export interface FastapiSessionStartResponse {
  session_id: string;
  teacher_response: FastapiTeacherResponse;
  audio_bytes: string | null;
}

export interface FastapiVoiceResponse {
  session_id: string | null;
  teacher_response: FastapiTeacherResponse;
  audio_bytes: string | null;
}

export interface FastapiCodeResponse {
  execution_result: {
    output: string;
    error: string | null;
    execution_time_ms: number | null;
    passed: boolean | null;
  } | null;
  teacher_response: FastapiTeacherResponse;
  audio_bytes: string | null;
}

export interface FastapiStateResponse {
  session_id: string | null;
  active: boolean;
  teacher_response: FastapiTeacherResponse;
  lesson_plan: Record<string, any> | null;
  progress: Record<string, any> | null;
  audio_bytes: string | null;
}

async function fastapiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${FASTAPI_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {}
    throw new Error(`${res.status} ${detail}`);
  }
  return res.json();
}

export async function fastapiStartSession(data?: {
  topic?: string;
  dialect?: string;
  language?: string;
}): Promise<FastapiSessionStartResponse> {
  return fastapiRequest("/session/start", {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export async function fastapiSendVoice(data: {
  session_id: string;
  transcript: string;
  language?: string;
}): Promise<FastapiVoiceResponse> {
  return fastapiRequest("/voice", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fastapiSubmitCode(data: {
  session_id: string;
  code: string;
  exercise_id?: string;
  language?: string;
}): Promise<FastapiCodeResponse> {
  return fastapiRequest("/code", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fastapiGetState(session_id?: string): Promise<FastapiStateResponse> {
  const qs = session_id ? `?session_id=${encodeURIComponent(session_id)}` : "";
  return fastapiRequest(`/state${qs}`);
}
