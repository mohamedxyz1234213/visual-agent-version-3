const TOKEN_KEY = "wb_token";

export function setAuthToken(token: string) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function getAuthToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function clearAuthToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}
