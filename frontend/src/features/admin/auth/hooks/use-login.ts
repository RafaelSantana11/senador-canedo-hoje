"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/useAuthStore"
import { getMe, loginUser } from "../services/auth-service"
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

      // A resposta do login não traz o `author` — /auth/me é a fonte da verdade.
      // Falha aqui não derruba o login: o painel segue com o usuário do login.
      try {
        const me = await getMe()
        setAuth({
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpires: data.tokenExpires,
          user: me,
        })
        return me
      } catch {
        return data.user
      }
    },
    onSuccess: () => {
      router.replace("/admin")
    },
  })
}
