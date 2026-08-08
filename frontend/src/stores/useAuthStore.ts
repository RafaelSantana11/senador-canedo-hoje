import { create } from "zustand"

type AuthState = {
  token: string | null
  refreshToken: string | null
  setAuth: (payload: { token: string; refreshToken: string }) => void
  logoutLocal: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  setAuth: ({ token, refreshToken }) => set({ token, refreshToken }),
  logoutLocal: () => set({ token: null, refreshToken: null }),
}))
