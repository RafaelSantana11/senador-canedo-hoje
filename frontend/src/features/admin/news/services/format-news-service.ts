import { assetPath } from "@/lib/utils"

export type FormatNewsInput = {
  content: string
  title?: string
  summary?: string
}

/** Códigos devolvidos pelo route handler `/api/format-news`. */
export type FormatNewsErrorCode =
  | "missingApiKey"
  | "invalidBody"
  | "emptyContent"
  | "contentTooLong"
  | "providerError"
  | "providerUnreachable"
  | "emptyResult"
  | "networkError"

export class FormatNewsError extends Error {
  constructor(readonly code: FormatNewsErrorCode | string) {
    super(code)
    this.name = "FormatNewsError"
  }
}

/**
 * Pede ao servidor que formate o conteúdo em Markdown jornalístico (Gemini).
 * A chave da API nunca chega ao browser: a chamada externa acontece no route
 * handler `/api/format-news`.
 */
export async function formatNewsContent(
  input: FormatNewsInput
): Promise<string> {
  let response: Response
  try {
    response = await fetch(assetPath("/api/format-news"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  } catch {
    throw new FormatNewsError("networkError")
  }

  if (!response.ok) {
    let code = "providerError"
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) code = data.error
    } catch {
      // Resposta sem JSON — mantém o código genérico.
    }
    throw new FormatNewsError(code)
  }

  const data = (await response.json().catch(() => null)) as {
    content?: string
  } | null
  if (!data?.content?.trim()) throw new FormatNewsError("emptyResult")
  return data.content.trim()
}
