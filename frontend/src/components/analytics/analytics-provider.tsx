"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Link from "next/link"
import { GoogleAnalytics } from "@next/third-parties/google"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isGaEnabled, updateConsent, GA_MEASUREMENT_ID } from "@/lib/gtag"
import {
  getConsent,
  setConsent,
  CONSENT_OPEN_EVENT,
  type ConsentChoice,
} from "@/lib/consent"

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
  // `true` quando o usuário pede para revisar a escolha ("gerenciar cookies").
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  // O banner aparece na primeira visita (sem decisão) ou quando reaberto pelo
  // rodapé, permitindo revisar e revogar o consentimento a qualquer momento.
  const visible = enabled && hydrated && (consent === null || open)

  // Se o visitante já aceitou anteriormente, libera só analytics_storage.
  // Sinais de anúncio nunca são concedidos (coleta mínima).
  useEffect(() => {
    if (enabled && consent === "accepted") updateConsent("granted")
  }, [enabled, consent])

  // Reabre o banner quando qualquer "gerenciar cookies" dispara o evento.
  useEffect(() => {
    if (!enabled) return
    const handleOpen = () => setOpen(true)
    window.addEventListener(CONSENT_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, handleOpen)
  }, [enabled])

  // Ao reabrir, move o foco para o diálogo e devolve ao gatilho ao fechar.
  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => triggerRef.current?.focus()
  }, [open])

  const handleConsent = useCallback((choice: ConsentChoice) => {
    setConsent(choice)
    setConsentState(choice)
    setOpen(false)
    if (choice === "accepted") updateConsent("granted")
    else updateConsent("denied")
  }, [])

  // Esc fecha apenas quando já existe uma decisão salva (reabertura).
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && consent !== null) setOpen(false)
  }

  if (!enabled) return null

  return (
    <>
      {/* Consent Mode v2 default (denied). Deve vir antes do <GoogleAnalytics>. */}
      <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID!} debugMode={GA_DEBUG_MODE} />

      {visible && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Consentimento de cookies"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-background p-5 shadow-lg outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-foreground">
              Usamos cookies para medir audiência e entender como o site é
              usado. Não usamos seus dados para anúncios nem os vendemos, e
              recusar não muda sua experiência. Detalhes na{" "}
              <Link
                href="/politica-de-privacidade"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                Política de Privacidade
              </Link>
              .
            </p>
            {consent !== null && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fechar"
                className="-mt-1 -mr-1 shrink-0"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {consent !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Escolha atual: {consent === "accepted" ? "aceito" : "recusado"}.
              Você pode alterar abaixo.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3 max-md:flex-col-reverse sm:flex-row sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleConsent("denied")}
              className="h-14 flex-1 rounded-xl text-base font-semibold max-md:py-2 sm:h-9 sm:rounded-lg sm:text-sm sm:font-medium"
            >
              Recusar
            </Button>
            <Button
              onClick={() => handleConsent("accepted")}
              className="h-14 flex-1 rounded-xl text-base font-semibold max-md:py-2 sm:h-9 sm:rounded-lg sm:text-sm sm:font-medium"
            >
              Aceitar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
