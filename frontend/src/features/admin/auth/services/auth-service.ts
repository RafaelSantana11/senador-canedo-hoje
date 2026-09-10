import { api } from "@/services/api"
import type { AuthUser, LoginPayload, LoginResponse } from "../types/auth"

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("auth/email/login", payload)
  return data
}

let meRequest: Promise<AuthUser> | null = null

export function getMe(): Promise<AuthUser> {
  if (!meRequest) {
    meRequest = api
      .get<AuthUser>("auth/me")
      .then(({ data }) => data)
      .finally(() => {
        meRequest = null
      })
  }
  return meRequest
}

export async function logoutUser(): Promise<void> {
  await api.post("auth/logout")
}
