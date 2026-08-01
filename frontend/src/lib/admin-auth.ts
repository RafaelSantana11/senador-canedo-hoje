"use client"

// Demo-only authentication. No backend — credentials are checked on the
// client and a flag is stored in localStorage. Do NOT use in production.

export const DEMO_EMAIL = "admin@portal.com"
export const DEMO_PASSWORD = "admin123"

const AUTH_KEY = "portal-admin-auth"
const USER_KEY = "portal-admin-user"

export type AdminUser = {
  name: string
  email: string
}

export function login(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
  if (ok && typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_KEY, "true")
    window.localStorage.setItem(
      USER_KEY,
      JSON.stringify({ name: "Editor Chefe", email: DEMO_EMAIL } satisfies AdminUser),
    )
  }
  return ok
}

export function logout() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(AUTH_KEY)
  window.localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(AUTH_KEY) === "true"
}

export function getUser(): AdminUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}
