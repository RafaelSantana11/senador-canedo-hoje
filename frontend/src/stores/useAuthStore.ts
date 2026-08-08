import { create } from "zustand"
import type { AuthUser } from "@/features/admin/auth/types/auth"

export const AUTH_STORAGE_KEYS = {
  refreshToken: "portal-admin-refresh-token",
  user: "portal-admin-user",
} as const

type SetAuthPayload = {
  token: string
  refreshToken: string
  tokenExpires: number
  user?: AuthUser | null
}

type SetTokensPayload = {
  token: string
  refreshToken: string
  tokenExpires: number
}

type AuthState = {
  token: string | null
  refreshToken: string | null
  tokenExpires: number | null
  user: AuthUser | null
  setAuth: (payload: SetAuthPayload) => void
  setTokens: (payload: SetTokensPayload) => void
  setUser: (user: AuthUser | null) => void
  logoutLocal: () => void
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function persistRefreshToken(refreshToken: string | null) {
  if (!isBrowser()) return
  if (refreshToken) {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken)
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken)
  }
}

function persistUser(user: AuthUser | null) {
  if (!isBrowser()) return
  if (user) {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.user)
  }
}

// Lê o localStorage de forma síncrona no module scope. Assim o store já nasce
// com a sessão restaurada ANTES do primeiro render — os effects do AdminShell
// nunca enxergam `refreshToken === null` e não há flash para o /login (a
// hydratação via useEffect rodava depois dos effects dos filhos).
function readStoredAuth() {
  if (!isBrowser()) return { refreshToken: null as string | null, user: null as AuthUser | null }
  const refreshToken = window.localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken)
  let user: AuthUser | null = null
  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEYS.user)
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as AuthUser
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.user)
    }
  }
  return { refreshToken, user }
}

const storedAuth = readStoredAuth()

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: storedAuth.refreshToken,
  tokenExpires: null,
  user: storedAuth.user,
  setAuth: ({ token, refreshToken, tokenExpires, user = null }) => {
    persistRefreshToken(refreshToken)
    persistUser(user)
    set({ token, refreshToken, tokenExpires, user })
  },
  setTokens: ({ token, refreshToken, tokenExpires }) => {
    persistRefreshToken(refreshToken)
    set({ token, refreshToken, tokenExpires })
  },
  setUser: (user) => {
    persistUser(user)
    set({ user })
  },
  logoutLocal: () => {
    persistRefreshToken(null)
    persistUser(null)
    set({ token: null, refreshToken: null, tokenExpires: null, user: null })
  },
}))
