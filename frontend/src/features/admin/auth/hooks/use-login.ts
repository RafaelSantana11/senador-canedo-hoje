"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { useAuthStore } from "@/stores/useAuthStore"
import { loginUser } from "../services/auth-service"
import type { LoginPayload } from "../types/auth"

export function useLogin() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data) => {
      Cookies.set("refreshToken", data.refreshToken, { expires: 7, path: "/" })
      setAuth({ token: data.token, refreshToken: data.refreshToken, user: data.user })
      router.replace("/admin")
    },
  })
}
