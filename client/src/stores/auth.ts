import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string; badgeNumber: string; name: string; email: string;
  role: string; rank?: string; department?: string; station?: string;
}

interface AuthState {
  token: string | null; user: User | null; isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: Boolean(token) }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "sherlock-auth",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
