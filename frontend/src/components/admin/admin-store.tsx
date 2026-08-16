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
import { categories as initialCategories, columnists, featuredArticles, heroArticle, latestNews } from "@/lib/news-data"

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

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  color: string
  active: boolean
  createdAt: string
}

export type Author = {
  id: string
  name: string
  email: string
  role: string
  bio: string
  avatar: string
  twitter?: string
  instagram?: string
  linkedin?: string
  active: boolean
  createdAt: string
}

export type Tag = {
  id: string
  name: string
  slug: string
  color: string
  description: string
  usageCount: number
  createdAt: string
}

export type Media = {
  id: string
  title: string
  url: string
  type: "image" | "video" | "document"
  alt: string
  size: string
  dimensions?: string
  createdAt: string
}

const NEWS_KEY = "portal-admin-news"
const ADS_KEY = "portal-admin-ads"
const CATEGORIES_KEY = "portal-admin-categories"
const AUTHORS_KEY = "portal-admin-authors"
const TAGS_KEY = "portal-admin-tags"
const MEDIA_KEY = "portal-admin-media"

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
      content: a.content ?? a.excerpt ?? "",
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

function seedCategories(): Category[] {
  const colorsMap: Record<string, string> = {
    Política: "#ef4444",
    Economia: "#10b981",
    Mundo: "#3b82f6",
    Tecnologia: "#8b5cf6",
    Esportes: "#f59e0b",
    Saúde: "#06b6d4",
    Cultura: "#ec4899",
    "Meio Ambiente": "#84cc16",
  }

  return initialCategories.map((name, i) => ({
    id: uid(),
    name,
    slug: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
    description: `Notícias e atualizações sobre a categoria ${name}.`,
    color: colorsMap[name] || "#64748b",
    active: true,
    createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
  }))
}

function seedAuthors(): Author[] {
  return [
    ...columnists.map((c, i) => ({
      id: c.id,
      name: c.name,
      email: `${c.name.toLowerCase().replace(/\s+/g, ".")}@portal.com`,
      role: c.role,
      bio: c.headline,
      avatar: c.avatar,
      twitter: `@${c.name.toLowerCase().replace(/\s+/g, "")}`,
      instagram: `@${c.name.toLowerCase().replace(/\s+/g, "")}`,
      active: true,
      createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
    })),
    {
      id: "c4",
      name: "Redação Central",
      email: "redacao@portal.com",
      role: "Equipe Editorial",
      bio: "Conteúdo produzido e checado de forma colaborativa pela equipe de jornalismo do portal.",
      avatar: "/news/hero-congress.png",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]
}

function seedTags(): Tag[] {
  return [
    {
      id: uid(),
      name: "Eleições 2026",
      slug: "eleicoes-2026",
      color: "#ef4444",
      description: "Cobertura de propostas, debates e bastidores das eleições.",
      usageCount: 42,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "Inflação & Mercado",
      slug: "inflacao-mercado",
      color: "#10b981",
      description: "Análises de economia, taxa Selic e impacto no consumidor.",
      usageCount: 28,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "Inteligência Artificial",
      slug: "inteligencia-artificial",
      color: "#8b5cf6",
      description: "Inovações, ferramentas e regulação de IA no Brasil e mundo.",
      usageCount: 35,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "Futebol Regional",
      slug: "futebol-regional",
      color: "#f59e0b",
      description: "Jogos, classificações e reforços nos clubes estaduais.",
      usageCount: 19,
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "Clima & Ecologia",
      slug: "clima-ecologia",
      color: "#06b6d4",
      description: "Reportagens sobre preservação, queimadas e energia limpa.",
      usageCount: 14,
      createdAt: new Date().toISOString(),
    },
  ]
}

function seedMedia(): Media[] {
  return [
    {
      id: uid(),
      title: "Congresso Nacional em Votação",
      url: "/news/hero-congress.png",
      type: "image",
      alt: "Fachada do Congresso Nacional iluminada à noite",
      size: "1.4 MB",
      dimensions: "1920x1080",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: "Painel da Bolsa de Valores",
      url: "/news/economy.png",
      type: "image",
      alt: "Telas com gráficos e indicadores financeiros",
      size: "980 KB",
      dimensions: "1600x900",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: "Ilustração de Inteligência Artificial",
      url: "/news/technology.png",
      type: "image",
      alt: "Redes neurais e robótica",
      size: "2.1 MB",
      dimensions: "1920x1080",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: "Vídeo Boletim Noturno",
      url: "/news/video-1.png",
      type: "video",
      alt: "Apresentador no estúdio de gravação",
      size: "14.5 MB",
      dimensions: "1920x1080",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      title: "Banner SUV Automotivo",
      url: "/news/video-2.png",
      type: "image",
      alt: "Veículo utilitário esportivo em rodovia",
      size: "1.1 MB",
      dimensions: "1200x630",
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
  categories: Category[]
  authors: Author[]
  tags: Tag[]
  media: Media[]
  categoryNames: string[]
  
  // Articles
  addArticle: (data: Omit<AdminArticle, "id" | "createdAt">) => void
  updateArticle: (id: string, data: Omit<AdminArticle, "id" | "createdAt">) => void
  deleteArticle: (id: string) => void
  toggleArticleStatus: (id: string) => void
  moveArticle: (id: string, direction: "up" | "down") => void
  updateArticlePosition: (
    id: string,
    position: "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"
  ) => void

  // Ads
  addAd: (data: Omit<Ad, "id" | "createdAt">) => void
  updateAd: (id: string, data: Omit<Ad, "id" | "createdAt">) => void
  deleteAd: (id: string) => void
  toggleAd: (id: string) => void

  // Categories CRUD
  addCategory: (data: Omit<Category, "id" | "createdAt">) => void
  updateCategory: (id: string, data: Omit<Category, "id" | "createdAt">) => void
  deleteCategory: (id: string) => void
  toggleCategory: (id: string) => void

  // Authors CRUD
  addAuthor: (data: Omit<Author, "id" | "createdAt">) => void
  updateAuthor: (id: string, data: Omit<Author, "id" | "createdAt">) => void
  deleteAuthor: (id: string) => void
  toggleAuthor: (id: string) => void

  // Tags CRUD
  addTag: (data: Omit<Tag, "id" | "createdAt">) => void
  updateTag: (id: string, data: Omit<Tag, "id" | "createdAt">) => void
  deleteTag: (id: string) => void

  // Media CRUD
  addMedia: (data: Omit<Media, "id" | "createdAt">) => void
  updateMedia: (id: string, data: Omit<Media, "id" | "createdAt">) => void
  deleteMedia: (id: string) => void
}

const StoreContext = createContext<AdminStore | null>(null)

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [authorsList, setAuthorsList] = useState<Author[]>([])
  const [tagsList, setTagsList] = useState<Tag[]>([])
  const [mediaList, setMediaList] = useState<Media[]>([])

  useEffect(() => {
    setArticles(read(NEWS_KEY, seedNews))
    setAds(read(ADS_KEY, seedAds))
    setCategoriesList(read(CATEGORIES_KEY, seedCategories))
    setAuthorsList(read(AUTHORS_KEY, seedAuthors))
    setTagsList(read(TAGS_KEY, seedTags))
    setMediaList(read(MEDIA_KEY, seedMedia))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(NEWS_KEY, JSON.stringify(articles))
  }, [articles, ready])

  useEffect(() => {
    if (ready) window.localStorage.setItem(ADS_KEY, JSON.stringify(ads))
  }, [ads, ready])

  useEffect(() => {
    if (ready) window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categoriesList))
  }, [categoriesList, ready])

  useEffect(() => {
    if (ready) window.localStorage.setItem(AUTHORS_KEY, JSON.stringify(authorsList))
  }, [authorsList, ready])

  useEffect(() => {
    if (ready) window.localStorage.setItem(TAGS_KEY, JSON.stringify(tagsList))
  }, [tagsList, ready])

  useEffect(() => {
    if (ready) window.localStorage.setItem(MEDIA_KEY, JSON.stringify(mediaList))
  }, [mediaList, ready])

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

  // Categories CRUD
  const addCategory = useCallback((data: Omit<Category, "id" | "createdAt">) => {
    setCategoriesList((prev) => [
      { ...data, id: uid(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  const updateCategory = useCallback((id: string, data: Omit<Category, "id" | "createdAt">) => {
    setCategoriesList((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setCategoriesList((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const toggleCategory = useCallback((id: string) => {
    setCategoriesList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    )
  }, [])

  // Authors CRUD
  const addAuthor = useCallback((data: Omit<Author, "id" | "createdAt">) => {
    setAuthorsList((prev) => [
      { ...data, id: uid(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  const updateAuthor = useCallback((id: string, data: Omit<Author, "id" | "createdAt">) => {
    setAuthorsList((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)))
  }, [])

  const deleteAuthor = useCallback((id: string) => {
    setAuthorsList((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleAuthor = useCallback((id: string) => {
    setAuthorsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    )
  }, [])

  // Tags CRUD
  const addTag = useCallback((data: Omit<Tag, "id" | "createdAt">) => {
    setTagsList((prev) => [
      { ...data, id: uid(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  const updateTag = useCallback((id: string, data: Omit<Tag, "id" | "createdAt">) => {
    setTagsList((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
  }, [])

  const deleteTag = useCallback((id: string) => {
    setTagsList((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Media CRUD
  const addMedia = useCallback((data: Omit<Media, "id" | "createdAt">) => {
    setMediaList((prev) => [
      { ...data, id: uid(), createdAt: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  const updateMedia = useCallback((id: string, data: Omit<Media, "id" | "createdAt">) => {
    setMediaList((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)))
  }, [])

  const deleteMedia = useCallback((id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const categoryNames = useMemo(
    () => categoriesList.map((c) => c.name),
    [categoriesList]
  )

  const value = useMemo<AdminStore>(
    () => ({
      ready,
      articles,
      ads,
      categories: categoriesList,
      authors: authorsList,
      tags: tagsList,
      media: mediaList,
      categoryNames,
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
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategory,
      addAuthor,
      updateAuthor,
      deleteAuthor,
      toggleAuthor,
      addTag,
      updateTag,
      deleteTag,
      addMedia,
      updateMedia,
      deleteMedia,
    }),
    [
      ready,
      articles,
      ads,
      categoriesList,
      authorsList,
      tagsList,
      mediaList,
      categoryNames,
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
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategory,
      addAuthor,
      updateAuthor,
      deleteAuthor,
      toggleAuthor,
      addTag,
      updateTag,
      deleteTag,
      addMedia,
      updateMedia,
      deleteMedia,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAdminStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider")
  return ctx
}

