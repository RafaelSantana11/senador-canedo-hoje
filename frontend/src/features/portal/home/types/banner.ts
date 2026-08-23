export type BannerPosition = "top" | "middle" | "aside" | "bottom"

export const BANNER_POSITIONS: BannerPosition[] = ["top", "middle", "aside", "bottom"]

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
