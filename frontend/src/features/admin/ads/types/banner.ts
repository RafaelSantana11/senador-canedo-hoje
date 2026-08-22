export type BannerPosition = "top" | "middle" | "aside" | "bottom"

export const BANNER_POSITIONS: BannerPosition[] = ["top", "middle", "aside", "bottom"]

export const POSITION_LABELS: Record<BannerPosition, string> = {
  top: "Topo (Leaderboard)",
  middle: "Meio do conteúdo",
  aside: "Lateral (Box)",
  bottom: "Rodapé",
}

export type BannerFile = {
  id: string
  path: string
  type: "image" | "video" | "document" | null
  originalName?: string | null
  mimeType: string | null
  sizeBytes?: number | null
  width: number | null
  height: number | null
  title: string | null
  alt: string | null
  createdAt: string
  updatedAt: string
}

export type BannerItem = {
  id: string
  file: BannerFile
  durationMs: number
  linkUrl: string | null
  order: number
}

export type Banner = {
  id: string
  title: string
  advertiser: string | null
  position: BannerPosition
  active: boolean
  items: BannerItem[]
  createdAt: string
  updatedAt: string
}

export type BannerRoot = {
  data: Banner[]
  hasNextPage: boolean
}

export type BannerFileRef = {
  id: string
  path?: string
}

export type BannerItemPayload = {
  file: BannerFileRef
  durationMs?: number
  linkUrl?: string | null
  order?: number
}

export type BannerPayload = {
  title: string
  advertiser?: string | null
  position: BannerPosition
  active?: boolean
  items?: BannerItemPayload[]
}

// Entrega pública do portal (GET /banners/serve): sem advertiser, active,
// id de campanha ou uploadedBy.
export type PublicBannerImage = {
  id: string
  path: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

export type PublicBannerItem = {
  image: PublicBannerImage
  alt: string | null
  linkUrl: string | null
  durationMs: number
}

export type ServeBannersResponse = Partial<Record<BannerPosition, PublicBannerItem[]>>
