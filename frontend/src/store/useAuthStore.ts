import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

export type Role = "admin" | "seller" | "customer";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: { id: number; name: string; slug: Role };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,

      setHydrated: () => set({ hasHydrated: true }),

      setAuth: (user, token) => {
        set({ user, token });
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      },

      logout: () => {
        set({ user: null, token: null });
        delete axios.defaults.headers.common["Authorization"];
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
          const res = await axios.get(`${apiUrl}/user`);
          set({ user: res.data, isLoading: false });
        } catch {
          set({ user: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: "shopdee-auth",
      partialize: (state: AuthState) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

