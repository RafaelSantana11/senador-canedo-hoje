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

// Dispara o evento ga4_page_view manualmente a cada troca de rota client-side.
// O GoogleAnalytics via Enhanced Measurement já rastreia pageviews por
// mudanças no history (browser). Este helper é um fallback caso você prefira
// enviar manualmente (nesse caso, desative o "Page changes based on browser
// history events" no GA para não duplicar).
export function pageview(path: string, title?: string): void {
  event("page_view", { page_path: path, page_title: title })
}

// ---------------------------------------------------------------------------
// Consentimento (Consent Mode v2 / LGPD).
// ---------------------------------------------------------------------------
// Parâmetros do Consent Mode v2 — os mesmos usados no script de default.
export const CONSENT_DEFAULT = {
  ad_storage: "denied" as ConsentState,
  ad_user_data: "denied" as ConsentState,
  ad_personalization: "denied" as ConsentState,
  analytics_storage: "denied" as ConsentState,
}

export function updateConsent(state: ConsentState): void {
  if (typeof window === "undefined") return
  const args: unknown[] = [
    "consent",
    "update",
    {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    },
  ]
  const gtag = window.gtag
  if (typeof gtag === "function") {
    gtag(...(args as Parameters<NonNullable<Window["gtag"]>>))
  } else {
    pushToDataLayer(args)
  }
}

// ===========================================================================
// Eventos customizados para um site de notícias (GA4).
// As chamadas estão aqui prontas; use-as onde fizer sentido na UI
// (ex.: componente da matéria, botão de share, formulário, etc.).
// ===========================================================================

/**
 * view_article — ao abrir uma matéria.
 * Exemplo de uso (num componente client da página da matéria):
 *   event('view_article', {
 *     article_title: article.title,
 *     article_category: article.category,
 *     article_slug,
 *   })
 */
export function viewArticle(params: {
  title: string
  category: string
  slug?: string
  author?: string
}): void {
  event("view_article", {
    article_title: params.title,
    article_category: params.category,
    article_slug: params.slug,
    article_author: params.author,
  })
}

/**
 * scroll_depth — progresso de leitura (25/50/75/100%).
 * Exemplo de uso: um handler de scroll que detecta os marcos e chama:
 *   trackReadingProgress(percent, { title, category })
 */
export function trackReadingProgress(
  percent: 25 | 50 | 75 | 100,
  params: { title?: string; category?: string } = {}
): void {
  event("scroll_depth", { percent_depth: percent, ...params })
}

/**
 * share — quando o usuário clica em compartilhar uma matéria.
 * Exemplo: no onClick do botão "Compartilhar": trackShare({ title })
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
 * newsletter_signup — quando o usuário se inscreve na newsletter.
 * Exemplo: chamar após o submit bem-sucedido do formulário.
 */
export function trackNewsletterSignup(params?: {
  location?: string
  method?: string
}): void {
  event("newsletter_signup", params)
}

/**
 * outbound_click — cliques em links externos dentro da matéria.
 * Exemplo de uso (handler genérico de clique, ou um wrapper <a>):
 *   trackOutboundClick(href, { title })
 */
export function trackOutboundClick(href: string, params?: GtagParams): void {
  event("outbound_click", { outbound_url: href, ...params })
}
