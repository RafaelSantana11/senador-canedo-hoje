import type { AxiosError } from "axios"
import type { SettingKey } from "../types/settings"

/**
 * Traduz o 422 de settings (`{ errors: { CHAVE: "codigo" } }`) em mensagens
 * exibíveis e no campo que as originou, para o erro aparecer sob o input.
 * Mesmo formato de `admin/news/utils/api-error.ts`, com o campo preservado.
 */

const ERROR_MESSAGES: Record<string, string> = {
  invalidType: "Valor inválido para este parâmetro.",
  valueOutOfRange: "Valor fora da faixa permitida.",
  whatsappInvalidFormat:
    "Use apenas dígitos, no formato internacional (10 a 15 dígitos).",
  emailInvalidFormat: "E-mail inválido.",
  emptyValue: "Informe um valor.",
  valueTooLong: "Texto acima do limite permitido.",
  imageNotExists: "O arquivo do logo não existe mais. Envie novamente.",
  unknownSetting: "Parâmetro desconhecido.",
  readOnlyField: "Campo somente leitura.",
}

type ApiErrorBody = {
  errors?: Record<string, unknown>
  message?: string | string[]
}

/** `"settings"` quando o corpo inteiro é inválido (não é objeto). */
export type SettingsFieldError = {
  field: SettingKey | "settings"
  message: string
}

function messagesFor(value: unknown): string[] {
  const codes = Array.isArray(value) ? value : [value]
  return codes
    .filter((code): code is string => typeof code === "string")
    .map((code) => ERROR_MESSAGES[code] ?? "Não foi possível salvar este parâmetro.")
}

export function settingsFieldErrors(error: unknown): SettingsFieldError[] {
  const data = (error as AxiosError<ApiErrorBody>)?.response?.data
  if (!data?.errors) return []

  return Object.entries(data.errors).flatMap(([field, value]) =>
    messagesFor(value).map((message) => ({
      field: field as SettingsFieldError["field"],
      message,
    })),
  )
}

/** Mensagem única para o toast: o primeiro erro de campo ou o status da resposta. */
export function settingsErrorMessage(error: unknown): string {
  const fieldErrors = settingsFieldErrors(error)
  if (fieldErrors.length > 0) return fieldErrors[0].message

  const response = (error as AxiosError<ApiErrorBody>)?.response
  if (response?.status === 403) {
    return "Só administradores podem alterar os parâmetros."
  }
  if (response?.status === 401) {
    return "Sessão expirada. Entre novamente."
  }
  if (response && typeof response.data?.message === "string") {
    return response.data.message
  }
  return "Não foi possível salvar os parâmetros."
}
