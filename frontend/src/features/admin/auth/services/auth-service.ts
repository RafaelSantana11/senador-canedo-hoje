import { api } from "@/services/api"
import type { AuthUser, LoginPayload, LoginResponse } from "../types/auth"

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("auth/email/login", payload)
  return data
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("auth/me")
  return data
}

export async function logoutUser(): Promise<void> {
  await api.post("auth/logout")
}
