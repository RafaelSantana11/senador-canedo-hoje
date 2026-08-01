"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { categories, featuredArticles, heroArticle, latestNews } from "@/lib/news-data"

export type AdminArticle = {
  id: string
  title: string
  excerpt: string
  content: string
  category: string
  image: string
  author: string
  status: "Publicado" | "Rascunho"
  urgent: boolean
  createdAt: string
  position?: "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"
}

export type AdPlacement = "Topo (Leaderboard)" | "Lateral (Box)" | "Rodapé"

export type Ad = {
  id: string
  title: string
  advertiser: string
  image: string
  link: string
  placement: AdPlacement
  active: boolean
  createdAt: string
}

const NEWS_KEY = "portal-admin-news"
const ADS_KEY = "portal-admin-ads"

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function seedNews(): AdminArticle[] {
  const source = [heroArticle, ...featuredArticles, ...latestNews]
  return source.map((a, i) => {
    let position: "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal" = "normal"
    if (a.id === "hero") position = "destaque"
    else if (a.id === "f1") position = "topo"
    else if (a.id === "f2") position = "feed"
    else if (a.id === "f3") position = "lateral"
    else if (a.id === "l1") position = "rodape"

    return {
      id: a.id,
      title: a.title,
      excerpt: a.excerpt ?? "",
      content: a.excerpt ?? "",
      category: a.category,
      image: a.image,
      author: a.author ?? "Redação",
      status: "Publicado",
      urgent: Boolean(a.urgent),
      createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
      position,
    }
  })
}

function seedAds(): Ad[] {
  return [
    {
      id: uid(),
      title: "Campanha Institucional",
      advertiser: "Banco Horizonte",
      image: "/news/economy.png",
      link: "https://example.com",
      placement: "Topo (Leaderboard)",
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: "Novo SUV 2026",
      advertiser: "AutoMax",
      image: "/news/video-2.png",
      link: "https://example.com",
      placement: "Lateral (Box)",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]
}

function read<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback()
  const raw = window.localStorage.getItem(key)
  if (!raw) {
    const seeded = fallback()
    window.localStorage.setItem(key, JSON.stringify(seeded))
    return seeded
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback()
  }
}

type AdminStore = {
  ready: boolean
  articles: AdminArticle[]
  ads: Ad[]
  categories: string[]
  addArticle: (data: Omit<AdminArticle, "id" | "createdAt">) => void
  updateArticle: (id: string, data: Omit<AdminArticle, "id" | "createdAt">) => void
  deleteArticle: (id: string) => void
  toggleArticleStatus: (id: string) => void
  moveArticle: (id: string, direction: "up" | "down") => void
  updateArticlePosition: (
    id: string,
    position: "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"
  ) => void
  addAd: (data: Omit<Ad, "id" | "createdAt">) => void
  updateAd: (id: string, data: Omit<Ad, "id" | "createdAt">) => void
  deleteAd: (id: string) => void
  toggleAd: (id: string) => void
}

const StoreContext = createContext<AdminStore | null>(null)

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => {
    setArticles(read(NEWS_KEY, seedNews))
    setAds(read(ADS_KEY, seedAds))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(NEWS_KEY, JSON.stringify(articles))
  }, [articles, ready])

  useEffect(() => {
    if (ready) window.localStorage.setItem(ADS_KEY, JSON.stringify(ads))
  }, [ads, ready])

  const addArticle = useCallback((data: Omit<AdminArticle, "id" | "createdAt">) => {
    setArticles((prev) => [
      { ...data, id: uid(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  const updateArticle = useCallback(
    (id: string, data: Omit<AdminArticle, "id" | "createdAt">) => {
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
    },
    [],
  )

  const deleteArticle = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleArticleStatus = useCallback((id: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "Publicado" ? "Rascunho" : "Publicado" }
          : a,
      ),
    )
  }, [])

  const moveArticle = useCallback((id: string, direction: "up" | "down") => {
    setArticles((prev) => {
      const idx = prev.findIndex((a) => a.id === id)
      if (idx < 0) return prev
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }, [])

  const updateArticlePosition = useCallback(
    (
      id: string,
      position: "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"
    ) => {
      setArticles((prev) =>
        prev.map((a) => {
          // Unique position enforcement: if position is a unique layout slot, demote previous occupant to "normal"
          const isUniquePosition =
            position === "destaque" || position === "topo" || position === "rodape"
          if (isUniquePosition && a.position === position && a.id !== id) {
            return { ...a, position: "normal" as const }
          }
          if (a.id === id) {
            return { ...a, position }
          }
          return a
        })
      )
    },
    []
  )

  const addAd = useCallback((data: Omit<Ad, "id" | "createdAt">) => {
    setAds((prev) => [
      { ...data, id: uid(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  const updateAd = useCallback((id: string, data: Omit<Ad, "id" | "createdAt">) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
  }, [])

  const deleteAd = useCallback((id: string) => {
    setAds((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleAd = useCallback((id: string) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)))
  }, [])

  const value = useMemo<AdminStore>(
    () => ({
      ready,
      articles,
      ads,
      categories,
      addArticle,
      updateArticle,
      deleteArticle,
      toggleArticleStatus,
      moveArticle,
      updateArticlePosition,
      addAd,
      updateAd,
      deleteAd,
      toggleAd,
    }),
    [
      ready,
      articles,
      ads,
      addArticle,
      updateArticle,
      deleteArticle,
      toggleArticleStatus,
      moveArticle,
      updateArticlePosition,
      addAd,
      updateAd,
      deleteAd,
      toggleAd,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAdminStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider")
  return ctx
}
