import {
  BANNER_INTERVAL,
  HERO_SECONDARY_COUNT,
  LATEST_COUNT,
  LOGO_ALT,
  MIN_NEWS_FOR_MIDDLE_BANNER,
  MOST_READ_COUNT,
  RELATED_NEWS_COUNT,
  SAW_THIS_BLOCK_SIZE,
  SHOW_NAME_WITH_LOGO,
  SITE_NAME,
  WHATSAPP_NUMBER,
} from "@/lib/portal-params"

/**
 * Visão pública de `GET /settings`: todas as chaves com os defaults mesclados
 * no servidor. O payload anônimo não traz `updatedBy` (que só existe com token)
 * — o portal não precisa dele.
 */
export type PublicSettingsLogo = {
  id: string
  path: string
  mimeType?: string | null
  type?: string | null
}

export type PublicSettings = {
  MIN_NEWS_FOR_MIDDLE_BANNER: number
  BANNER_INTERVAL: number
  HERO_SECONDARY_COUNT: number
  MOST_READ_COUNT: number
  LATEST_COUNT: number
  SAW_THIS_BLOCK_SIZE: number
  RELATED_NEWS_COUNT: number
  WHATSAPP_NUMBER: string
  /** `null` quando não há admin com e-mail — nesse caso o contato é escondido. */
  CONTACT_EMAIL: string | null
  SITE_NAME: string
  /** `null` = sem logo; o header cai no nome do site. */
  LOGO: PublicSettingsLogo | null
  LOGO_ALT: string
  SHOW_NAME_WITH_LOGO: boolean
  /** Read-only: o e-mail veio do admin do painel, não de uma personalização. */
  contactEmailIsDefault: boolean
  updatedAt: string | null
}

/**
 * Fallback de build, usado enquanto o `GET /settings` não resolveu (ou se ele
 * falhar): o portal nunca fica sem identidade nem quebra por causa de settings.
 */
export const DEFAULT_PORTAL_SETTINGS: PublicSettings = {
  MIN_NEWS_FOR_MIDDLE_BANNER,
  BANNER_INTERVAL,
  HERO_SECONDARY_COUNT,
  MOST_READ_COUNT,
  LATEST_COUNT,
  SAW_THIS_BLOCK_SIZE,
  RELATED_NEWS_COUNT,
  WHATSAPP_NUMBER,
  CONTACT_EMAIL: null,
  SITE_NAME,
  LOGO: null,
  LOGO_ALT,
  SHOW_NAME_WITH_LOGO,
  contactEmailIsDefault: true,
  updatedAt: null,
}
