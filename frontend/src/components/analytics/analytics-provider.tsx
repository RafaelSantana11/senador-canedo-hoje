"use client"

import { useEffect, useState, useCallback, useSyncExternalStore } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Button } from "@/components/ui/button"
import { isGaEnabled, updateConsent, GA_MEASUREMENT_ID } from "@/lib/gtag"
import { getConsent, setConsent, type ConsentChoice } from "@/lib/consent"

// Script de Consent Mode v2 injetado ANTES do gtag carregar. Define o dataLayer
// e o `gtag` global, e registra o consentimento padrão como 'denied', para que
// o GA4 só crie cookies depois que o usuário aceitar (conformidade LGPD).
// `ads_data_redaction` remove identificadores de clique de anúncio das URLs.
const CONSENT_DEFAULT_SCRIPT = `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',personalization_storage:'denied',wait_for_update:500});gtag('set','ads_data_redaction',true);`

// NEXT_PUBLIC_GA_DEBUG=1 habilita o DebugView (usado em testes locais).
const GA_DEBUG_MODE = process.env.NEXT_PUBLIC_GA_DEBUG === "1"

// `true` somente depois da hidratação. O SSR não tem acesso ao cookie, então
// sem esse gate o banner (já aceito) seria enviado no HTML a cada carregamento
// e voltaria a piscar antes do React hidratar.
const subscribe = () => () => {}
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

export function AnalyticsProvider() {
  const hydrated = useHydrated()
  const [enabled] = useState(() => isGaEnabled())
  const [consent, setConsentState] = useState<ConsentChoice | null>(() =>
    typeof document === "undefined" ? null : getConsent()
  )
  // O banner só aparece quando o GA está ativo, o cliente hidratou e o
  // usuário ainda não decidiu (cookie `ga_consent` ausente ou expirado).
  const visible = enabled && hydrated && consent === null

  // Se o visitante já aceitou anteriormente, libera só analytics_storage.
  // Sinais de anúncio nunca são concedidos (coleta mínima).
  useEffect(() => {
    if (enabled && consent === "accepted") updateConsent("granted")
  }, [enabled, consent])

  const handleConsent = useCallback(
    (choice: ConsentChoice) => {
      setConsent(choice)
      setConsentState(choice)
      if (choice === "accepted") updateConsent("granted")
      else updateConsent("denied")
    },
    []
  )

  if (!enabled) return null

  return (
    <>
      {/* Consent Mode v2 default (denied). Deve vir antes do <GoogleAnalytics>. */}
      <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID!} debugMode={GA_DEBUG_MODE} />

      {visible && (
        <div
          role="dialog"
          aria-label="Consentimento de cookies"
          className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-5 shadow-lg"
        >
          <p className="text-sm text-foreground">
            Este site usa cookies para medir audiência e melhorar a experiência
            de navegação. Ao continuar usando o site fora desta janela de
            consentimento, não tratamos seus dados para fins analíticos.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => handleConsent("accepted")}
              className="flex-1"
            >
              Aceitar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConsent("denied")}
              className="flex-1"
            >
              Recusar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
