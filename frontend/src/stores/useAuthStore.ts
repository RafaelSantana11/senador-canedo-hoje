import { create } from "zustand"
import type { AuthUser } from "@/features/admin/auth/types/auth"

type AuthState = {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  setAuth: (payload: { token: string; refreshToken: string; user?: AuthUser | null }) => void
  logoutLocal: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  setAuth: ({ token, refreshToken, user = null }) => set({ token, refreshToken, user }),
  logoutLocal: () => set({ token: null, refreshToken: null, user: null }),
}))
