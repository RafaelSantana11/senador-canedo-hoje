// ============================================================
// Gestão de consentimento de cookies (LGPD) persistido em cookie.
// ============================================================
// Este módulo é client-side (usa document/js-cookie). Use apenas em
// componentes com "use client".

import Cookies from "js-cookie"

export const CONSENT_COOKIE = "ga_consent"
export const CONSENT_VERSION = "v1"

// Evento disparado por qualquer botão "gerenciar cookies" (ex: rodapé) para
// reabrir o banner de consentimento. Desacopla o gatilho do AnalyticsProvider.
export const CONSENT_OPEN_EVENT = "ga-consent:open"

export type ConsentChoice = "accepted" | "denied"

export function getConsent(): ConsentChoice | null {
  const raw = Cookies.get(CONSENT_COOKIE)
  if (!raw) return null
  const [choice, version] = raw.split(".")
  if (version !== CONSENT_VERSION) return null
  if (choice === "accepted" || choice === "denied") return choice
  return null
}

export function setConsent(choice: ConsentChoice): void {
  Cookies.set(CONSENT_COOKIE, `${choice}.${CONSENT_VERSION}`, {
    expires: 365,
    sameSite: "Lax",
    secure: typeof location !== "undefined" && location.protocol === "https:",
    path: "/",
  })
}

// Reabre o banner para o usuário revisar ou revogar a escolha (exigência da
// LGPD). O AnalyticsProvider escuta o evento e exibe o diálogo novamente.
export function openConsentPreferences(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}
