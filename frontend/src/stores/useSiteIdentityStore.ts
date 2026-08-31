import { create } from "zustand"
import {
  SITE_NAME as DEFAULT_SITE_NAME,
  LOGO_URL as DEFAULT_LOGO_URL,
  LOGO_ALT as DEFAULT_LOGO_ALT,
  SHOW_NAME_WITH_LOGO as DEFAULT_SHOW_NAME_WITH_LOGO,
} from "@/lib/portal-params"

export const SITE_IDENTITY_STORAGE_KEY = "portal-site-identity"

export type SiteIdentity = {
  name: string
  logoUrl: string
  logoAlt: string
  showNameWithLogo: boolean
}

type SiteIdentityState = {
  name: string
  logoUrl: string
  logoAlt: string
  showNameWithLogo: boolean
  setIdentity: (patch: Partial<SiteIdentity>) => void
  hydrate: () => void
  resetIdentity: () => void
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function readStoredIdentity(): SiteIdentity {
  const defaults: SiteIdentity = {
    name: DEFAULT_SITE_NAME,
    logoUrl: DEFAULT_LOGO_URL,
    logoAlt: DEFAULT_LOGO_ALT,
    showNameWithLogo: DEFAULT_SHOW_NAME_WITH_LOGO,
  }
  if (!isBrowser()) return defaults
  try {
    const raw = window.localStorage.getItem(SITE_IDENTITY_STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<SiteIdentity>
    return {
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : defaults.name,
      logoUrl:
        typeof parsed.logoUrl === "string" && parsed.logoUrl ? parsed.logoUrl : defaults.logoUrl,
      logoAlt:
        typeof parsed.logoAlt === "string" && parsed.logoAlt ? parsed.logoAlt : defaults.logoAlt,
      showNameWithLogo:
        typeof parsed.showNameWithLogo === "boolean"
          ? parsed.showNameWithLogo
          : defaults.showNameWithLogo,
    }
  } catch {
    return defaults
  }
}

function writeStoredIdentity(identity: SiteIdentity) {
  if (isBrowser()) {
    window.localStorage.setItem(SITE_IDENTITY_STORAGE_KEY, JSON.stringify(identity))
  }
}

// O estado inicial usa os DEFAULTs — idêntico entre server e client — para
// não quebrar a hidratação. A leitura do localStorage é feita apenas no client,
// via `hydrate()`, disparado por um effect no SiteIdentityHydrator.
export const useSiteIdentityStore = create<SiteIdentityState>((set) => ({
  name: DEFAULT_SITE_NAME,
  logoUrl: DEFAULT_LOGO_URL,
  logoAlt: DEFAULT_LOGO_ALT,
  showNameWithLogo: DEFAULT_SHOW_NAME_WITH_LOGO,
  setIdentity: (patch) =>
    set((state) => {
      const next: SiteIdentity = {
        name: patch.name ?? state.name,
        logoUrl: patch.logoUrl ?? state.logoUrl,
        logoAlt: patch.logoAlt ?? state.logoAlt,
        showNameWithLogo: patch.showNameWithLogo ?? state.showNameWithLogo,
      }
      writeStoredIdentity(next)
      return next
    }),
  hydrate: () =>
    set(() => {
      const next = readStoredIdentity()
      return {
        name: next.name,
        logoUrl: next.logoUrl,
        logoAlt: next.logoAlt,
        showNameWithLogo: next.showNameWithLogo,
      }
    }),
  resetIdentity: () =>
    set(() => {
      const next: SiteIdentity = {
        name: DEFAULT_SITE_NAME,
        logoUrl: DEFAULT_LOGO_URL,
        logoAlt: DEFAULT_LOGO_ALT,
        showNameWithLogo: DEFAULT_SHOW_NAME_WITH_LOGO,
      }
      if (isBrowser()) {
        window.localStorage.removeItem(SITE_IDENTITY_STORAGE_KEY)
      }
      return next
    }),
}))
