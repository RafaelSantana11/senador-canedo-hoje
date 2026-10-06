import { api } from "@/services/api"
import type { Settings, SettingsPatch } from "../types/settings"

// Rotas de settings. `GET` é público no servidor, mas aqui usa-se a instância
// autenticada de propósito: com token o payload ganha `updatedBy` (quem gravou
// por último), que a tela exibe. Escrita é restrita a admin — 403 para os demais.

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get<Settings>("settings")
  return data
}

/**
 * Corpo parcial: só as chaves enviadas são tocadas. A resposta já é o objeto
 * completo atualizado, então o cache é substituído sem um segundo `GET`.
 * Validação é atômica: uma chave inválida recusa a requisição inteira (422).
 */
export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  const { data } = await api.patch<Settings>("settings", patch)
  return data
}

/** Volta TODAS as chaves aos defaults de código (inclusive logo e e-mail). */
export async function resetSettings(): Promise<Settings> {
  const { data } = await api.post<Settings>("settings/reset")
  return data
}
