import { create } from "zustand";
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  type SafeUser,
} from "@/lib/api";

const SESSION_KEY = "wb_user";

function saveSession(user: SafeUser) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch {}
}
function loadSession(): SafeUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

interface AuthState {
  user: SafeUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<SafeUser>;
  logout: () => Promise<void>;
  setUser: (user: SafeUser | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,

  async refresh() {
    set({ loading: true, error: null });
    try {
      const user = await fetchMe();
      if (user) {
        console.log("[AUTH] fetchMe OK, saving session", user.username);
        saveSession(user);
        set({ user, initialized: true, loading: false });
      } else {
        console.log("[AUTH] fetchMe returned null, trying sessionStorage fallback");
        const cached = loadSession();
        if (cached) {
          console.log("[AUTH] Fallback to sessionStorage user:", cached.username);
          set({ user: cached, initialized: true, loading: false });
        } else {
          console.log("[AUTH] No sessionStorage fallback either");
          set({ user: null, initialized: true, loading: false });
        }
      }
    } catch (err) {
      console.warn("[AUTH] fetchMe failed:", err);
      const cached = loadSession();
      if (cached) {
        console.log("[AUTH] catch — fallback to sessionStorage user:", cached.username);
        set({ user: cached, initialized: true, loading: false });
      } else {
        console.log("[AUTH] catch — no sessionStorage fallback");
        set({ user: null, initialized: true, loading: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  },

  async login(identifier, password) {
    set({ loading: true, error: null });
    try {
      const user = await loginRequest(identifier, password);
      console.log("[AUTH] Login success, saving to sessionStorage");
      saveSession(user);
      set({ user, loading: false });
      return user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      console.error("[AUTH] Login failed:", msg);
      set({ loading: false, error: msg });
      throw err;
    }
  },

  async logout() {
    console.log("[AUTH] Logout");
    clearSession();
    await logoutRequest();
    set({ user: null });
  },

  setUser(user) { set({ user }); },
}));
