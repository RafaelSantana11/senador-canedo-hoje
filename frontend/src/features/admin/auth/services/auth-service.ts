import { api } from "@/services/api"
import type { LoginPayload, LoginResponse } from "../types/auth"

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/v1/auth/email/login", payload)
  return data
}
