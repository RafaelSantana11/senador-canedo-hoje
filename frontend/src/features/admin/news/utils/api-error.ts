import type { AxiosError } from "axios"

/**
 * Traduz os erros do backend (`{ errors: { campo: 'chave' } }` ou
 * `{ message: string | string[] }`) em uma mensagem exibível. Retorna `null`
 * quando não há nada útil — o chamador decide o fallback.
 */

const ERROR_MESSAGES: Record<string, string> = {
  titleRequired: "Informe um título.",
  titleInvalid: "Título inválido.",
  titleTooLong: `O título deve ter no máximo 300 caracteres.`,
  slugInvalid: "Slug inválido.",
  slugTooShort: "O slug deve ter no mínimo 2 caracteres.",
  slugTooLong: "O slug deve ter no máximo 320 caracteres.",
  slugInvalidFormat:
    "Slug inválido. Use apenas letras minúsculas, números e hífens (ex.: minha-noticia).",
  slugAlreadyExists: "Já existe uma matéria com este link. Escolha outro slug.",
  summaryInvalid: "Subtítulo inválido.",
  summaryTooLong: "O subtítulo deve ter no máximo 1000 caracteres.",
  bodyRequired: "O conteúdo está vazio.",
  bodyInvalid: "Conteúdo inválido.",
  categoryRequired: "Selecione uma categoria.",
  categoryInvalid: "Categoria inválida.",
  tagRequired: "Tag inválida.",
  tagInvalid: "Tag inválida.",
  coverInvalid: "Imagem de capa inválida.",
  imageNotExists: "A imagem enviada não existe mais. Envie novamente.",
  configInvalid: "Configuração da matéria inválida.",
  configTooLarge: "A configuração da matéria excede o tamanho máximo.",
  statusInvalid: "Status inválido.",
}

type ApiErrorBody = {
  errors?: Record<string, unknown>
  message?: string | string[]
  error?: string
}

function firstCode(value: unknown): string | null {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    for (const inner of Object.values(value)) {
      const code = firstCode(inner)
      if (code) return code
    }
  }
  return null
}

export function newsApiErrorMessage(error: unknown): string | null {
  const data = (error as AxiosError<ApiErrorBody>)?.response?.data
  if (!data) return null

  const code = data.errors ? firstCode(data.errors) : null
  if (code) return ERROR_MESSAGES[code] ?? null

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message
  }
  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.join(" ")
  }
  if (typeof data.error === "string" && data.error.trim()) {
    return data.error
  }
  return null
}
