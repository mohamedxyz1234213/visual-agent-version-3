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
      if (user) saveSession(user);
      set({ user, initialized: true, loading: false });
    } catch (err) {
      const cached = loadSession();
      if (cached) {
        set({ user: cached, initialized: true, loading: false });
      } else {
        set({ user: null, initialized: true, loading: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
  },

  async login(identifier, password) {
    set({ loading: true, error: null });
    try {
      const user = await loginRequest(identifier, password);
      saveSession(user);
      set({ user, loading: false });
      return user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      set({ loading: false, error: msg });
      throw err;
    }
  },

  async logout() {
    clearSession();
    await logoutRequest();
    set({ user: null });
  },

  setUser(user) { set({ user }); },
}));
