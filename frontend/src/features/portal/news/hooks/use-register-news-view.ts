"use client"

import { useEffect, useRef } from "react"
import { registerNewsView } from "../services/news-views-service"

/**
 * Registra a leitura da notícia, uma vez por visita.
 *
 * Só roda no client: o detalhe é servido por ISR, e contar no servidor mediria
 * regeneração de página, não visita. A guarda é por `id` — e não um booleano —
 * porque cobre dois casos com uma regra só:
 *
 * - em dev, o `StrictMode` roda o efeito duas vezes sobre a **mesma** instância
 *   (refs sobrevivem ao ciclo desmonta/monta), e as duas chamadas contariam
 *   duas visitas;
 * - na navegação suave entre notícias, o componente é reaproveitado com outro
 *   `id`; comparar com o último id registrado deixa a nova visita contar.
 *
 * Um remount de verdade (voltar para a mesma notícia depois de sair) zera a
 * ref e conta de novo — que é o comportamento esperado.
 */
export function useRegisterNewsView(id?: string, enabled = true) {
  const lastRegistered = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !id || lastRegistered.current === id) return
    lastRegistered.current = id
    // Fire-and-forget: contador é telemetria e nunca pode derrubar a leitura.
    void registerNewsView(id).catch(() => {})
  }, [id, enabled])
}
