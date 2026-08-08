import axios from "axios"
import Cookies from "js-cookie"
import { useAuthStore } from "@/stores/useAuthStore"
import { useLoadingStore } from "@/stores/useLoadingStore"

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

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState()
    const { showLoading } = useLoadingStore.getState()
    showLoading()

    if (token) config.headers.Authorization = `Bearer ${token}`
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

    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = Cookies.get("refreshToken")
        if (!refreshToken) throw new Error("No refresh token")

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
        )
        const { setAuth } = useAuthStore.getState()

        setAuth({
          token: data.token,
          refreshToken: data.refreshToken,
        })

        processQueue(null, data.token)
        isRefreshing = false

        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        isRefreshing = false
        const { logoutLocal } = useAuthStore.getState()
        logoutLocal()
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)

export { api }
