import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/stores/useAuthStore"
import { useLoadingStore } from "@/stores/useLoadingStore"
import { assetPath } from "@/lib/utils"
import type { RefreshResponse } from "@/features/admin/auth/types/auth"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type PaginationParams = {
  page?: number
  limit?: number
  name?: string
  lang?: string // vira x-custom-lang
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

const api = axios.create({
  baseURL: API_URL,
})

// Antecipa a renovação antes de o token expirar, para não perder uma
// requisição na virada (ver 2.2 do contrato).
const REFRESH_SLACK_MS = 60_000

// Rotas públicas de auth: 401 nelas não deve disparar refresh nem deslogar.
const PUBLIC_AUTH_URLS = [
  "auth/email/login",
  "auth/forgot/password",
  "auth/reset/password",
  "auth/email/confirm",
]

// Promise única compartilhada: o refresh token é de uso único, então se duas
// requisições expirarem juntas, só a primeira faz o refresh e as demais
// aguardam o resultado dela (serialização de refreshes — 2.2).
let refreshPromise: Promise<string> | null = null

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function getStoredRefreshToken(): string | null {
  const { refreshToken } = useAuthStore.getState()
  return refreshToken ?? null
}

function redirectToLogin() {
  // assetPath aplica o basePath do deploy (ex.: GitHub Pages).
  if (isBrowser() && window.location.pathname !== assetPath("/login")) {
    window.location.assign(assetPath("/login"))
  }
}

function clearSession() {
  useAuthStore.getState().logoutLocal()
  redirectToLogin()
}

function persistTokens(data: RefreshResponse) {
  useAuthStore.getState().setTokens({
    token: data.token,
    refreshToken: data.refreshToken,
    tokenExpires: data.tokenExpires,
  })
}

// Autentica com o refreshToken (Authorization: Bearer), corpo vazio.
// Guarda sempre o refreshToken NOVO da resposta, descartando o antigo.
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  const currentRefreshToken = getStoredRefreshToken()
  if (!currentRefreshToken) {
    return Promise.reject(new Error("No refresh token"))
  }

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post<RefreshResponse>(
        `${API_URL}auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${currentRefreshToken}` } },
      )
      persistTokens(data)
      return data.token
    } catch (err) {
      // 401 no refresh = sessão inválida/revogada. Não adianta tentar de novo:
      // mandar para a tela de login.
      if ((err as AxiosError)?.response?.status === 401) {
        clearSession()
      }
      throw err
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

api.interceptors.request.use(
  async (config) => {
    const { showLoading } = useLoadingStore.getState()
    showLoading()

    const { token, tokenExpires } = useAuthStore.getState()
    const isPublicAuth = PUBLIC_AUTH_URLS.some((u) => config.url?.includes(u))

    let accessToken = token
    const shouldRefresh =
      !isPublicAuth &&
      Boolean(getStoredRefreshToken()) &&
      (!accessToken || !tokenExpires || Date.now() >= tokenExpires - REFRESH_SLACK_MS)

    if (shouldRefresh) {
      try {
        accessToken = await refreshAccessToken()
      } catch (err) {
        const { hideLoading } = useLoadingStore.getState()
        hideLoading()
        return Promise.reject(err)
      }
    }

    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    return config
  },
  (error) => {
    const { hideLoading } = useLoadingStore.getState()
    hideLoading()
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    const { hideLoading } = useLoadingStore.getState()
    hideLoading()
    return response
  },
  async (error) => {
    const { hideLoading } = useLoadingStore.getState()
    hideLoading()

    const originalRequest = error.config as RetriableRequest | undefined
    const status = error.response?.status as number | undefined
    const url = originalRequest?.url ?? ""
    const isPublicAuth = PUBLIC_AUTH_URLS.some((u) => url.includes(u))

    // Reativo: em 401 numa chamada autenticada, tenta o refresh uma vez e
    // repete a requisição original. Sem refresh token guardado, não há sessão
    // para renovar — só repassa o erro.
    if (status === 401 && originalRequest && !originalRequest._retry && !isPublicAuth) {
      if (!getStoredRefreshToken()) {
        return Promise.reject(error)
      }
      originalRequest._retry = true
      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (err) {
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)

export { api }
