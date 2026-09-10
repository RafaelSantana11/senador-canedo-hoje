"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import { loginUser } from "../services/auth-service"
import type { AuthUser, LoginPayload } from "../types/auth"

export function useLogin() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: async (payload: LoginPayload): Promise<AuthUser> => {
      const data = await loginUser(payload)
      setAuth({
        token: data.token,
        refreshToken: data.refreshToken,
        tokenExpires: data.tokenExpires,
        user: data.user,
      })

      return data.user
    },
    onSuccess: () => {
      router.replace("/admin")
    },
  })
}
