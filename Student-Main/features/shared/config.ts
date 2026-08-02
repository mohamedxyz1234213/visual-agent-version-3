import { getAuthToken } from "@/lib/authToken";

// Single source of truth for the API base URL
// All feature modules and pages should import from here
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://backend-teaching.vercel.app/api/v1";

// Common fetch wrapper used by all feature API layers
// Extracts specific error messages from JSON body when available
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    // Try to extract a specific error message from the JSON body
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
      else if (body?.message) detail = body.message;
    } catch {
      // Non-JSON error body — fall through to generic message
      try { detail = await res.text(); } catch { /* ignore */ }
    }
    throw new Error(`${res.status} ${detail}`);
  }
  return res.json() as Promise<T>;
}
