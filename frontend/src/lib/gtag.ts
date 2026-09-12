// ============================================================
// Google Analytics 4 (GA4) — utilitários reutilizáveis
// ============================================================
// Tipagens globais do gtag que o @next/third-parties expõe no `window`.
// Todas as funções são seguras: apenas chamam `window.gtag` se ele existir
// (ou seja, se o GA realmente está ativo e carregado em produção).

declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (
      command: "config" | "event" | "set" | "consent" | "js",
      ...params: unknown[]
    ) => void
  }
}

// Params genéricos aceitos pelo gtag 'event'.
export type GtagParams = Record<
  string,
  string | number | boolean | undefined | null
>

// Tipos de consentimento exigidos pela LGPD + Consent Mode v2.
export type ConsentState = "granted" | "denied"

// ---------------------------------------------------------------------------
// Gate: GA só deve carregar em produção (e não em preview/staging).
// ---------------------------------------------------------------------------
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function isGaEnabled(): boolean {
  if (!GA_MEASUREMENT_ID) return false
  // Override explícito (útil p/ forçar ativo em um host específico).
  if (process.env.NEXT_PUBLIC_GA_ENABLED === "1") return true
  // Apenas produção. Bloqueia localhost/dev e também preview/staging da Vercel.
  if (process.env.NODE_ENV !== "production") return false
  // Vercel define VERCEL_ENV como 'preview'/'development' fora de produção.
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development"
  )
    return false
  return true
}

// ---------------------------------------------------------------------------
// Envio seguro de eventos.
// ---------------------------------------------------------------------------
function pushToDataLayer(args: unknown[]): void {
  if (typeof window === "undefined") return
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(args)
  }
}

export function event(action: string, params: GtagParams = {}): void {
  if (typeof window === "undefined") return
  const gtag = window.gtag
  if (typeof gtag === "function") {
    // gtag('event', action, params)
    gtag("event", action, params)
  } else {
    // Fallback: empurra direto no dataLayer (mesma mecânica do gtag).
    pushToDataLayer(["event", action, params])
  }
}

// ---------------------------------------------------------------------------
// Consentimento (Consent Mode v2 / LGPD) — coleta mínima.
// ---------------------------------------------------------------------------
// Apenas `analytics_storage` é liberado, e só depois do "Aceitar". Os sinais
// de anúncio (ad_storage, ad_user_data, ad_personalization) permanecem
// negados para sempre: o site não faz remarketing nem personalização de ads.
// O pageview é automático via Enhanced Measurement (mudanças de history),
// então não há helper manual — evita duplicar dados.
export function updateConsent(state: ConsentState): void {
  if (typeof window === "undefined") return
  const args: unknown[] = ["consent", "update", { analytics_storage: state }]
  const gtag = window.gtag
  if (typeof gtag === "function") {
    gtag(...(args as Parameters<NonNullable<Window["gtag"]>>))
  } else {
    pushToDataLayer(args)
  }
}

// ===========================================================================
// Eventos customizados (GA4).
// ===========================================================================

/**
 * scroll_depth — quanto da página foi rolada (25/50/75/100%).
 * Usado apenas na home; a página da matéria não envia esse evento.
 */
export function trackScrollDepth(percent: 25 | 50 | 75 | 100): void {
  event("scroll_depth", { percent_depth: percent })
}

/**
 * share — quando o usuário clica em compartilhar uma matéria.
 */
export function trackShare(params: {
  title?: string
  method?: "navigator" | "copy" | "whatsapp" | "x" | "facebook"
  category?: string
}): void {
  event("share", {
    share_method: params.method,
    content_title: params.title,
    content_category: params.category,
  })
}

/**
 * banner_click — clique em um banner de publicidade.
 * Identifica o criativo (banner_id), a posição na página (banner_position),
 * o nome acessível (banner_name) e o destino (banner_link_url). Nenhum dado
 * pessoal é enviado. Valores são truncados no limite de 100 chars do GA4.
 */
export function trackBannerClick(params: {
  id: string
  position: string
  name?: string | null
  linkUrl?: string | null
}): void {
  event("banner_click", {
    banner_id: params.id,
    banner_position: params.position,
    banner_name: params.name?.slice(0, 100),
    banner_link_url: params.linkUrl?.slice(0, 100),
  })
}
