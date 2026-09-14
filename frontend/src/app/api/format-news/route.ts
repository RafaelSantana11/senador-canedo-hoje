/**
 * Formata o texto de uma matéria em Markdown jornalístico usando o Gemini
 * (camada gratuita do Google AI Studio).
 *
 * A chave fica só no servidor (`GEMINI_API_KEY`); o browser nunca a vê. Sem a
 * chave o endpoint responde 503 `missingApiKey` e o editor mostra as
 * instruções de configuração.
 */

const GEMINI_MODEL =
  process.env.GEMINI_FORMAT_MODEL?.trim() || "gemini-2.5-flash-lite"

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const MAX_CONTENT_CHARS = 20_000
const REQUEST_TIMEOUT_MS = 60_000

const SYSTEM_INSTRUCTION = `Você é um editor de um portal de notícias brasileiro. Formate o texto bruto recebido em Markdown, sem alterar o conteúdo jornalístico.

Regras obrigatórias:
- Responda SOMENTE com o Markdown final. Não use cercas de código, comentários ou explicações.
- Não invente, remova nem distorça fatos, nomes, números, datas ou declarações. Preserve o sentido integral do original.
- Trabalhe no português do Brasil: corrija ortografia, gramática e pontuação, com tom jornalístico, impessoal e objetivo.
- Divida o texto em parágrafos curtos (2 a 4 frases), separados por uma linha em branco.
- Use "## " para intertítulos e "### " para subtítulos APENAS quando o texto tiver seções distintas. Não repita o título da matéria no corpo.
- Reserve "> " para citações diretas que já existam no texto original, mantendo as palavras exatas de quem fala.
- Use listas ("- " ou "1. ") somente para enumerações que já existam no texto.
- Use **negrito** com moderação, apenas para destacar informações essenciais.
- Não use tabelas, HTML, blocos de código, imagens, links novos ou emojis.
- Se o texto já estiver bem formatado, devolva-o com ajustes mínimos.`

type FormatNewsBody = {
  content?: unknown
  title?: unknown
  summary?: unknown
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return Response.json({ error: "missingApiKey" }, { status: 503 })
  }

  let body: FormatNewsBody
  try {
    body = (await request.json()) as FormatNewsBody
  } catch {
    return Response.json({ error: "invalidBody" }, { status: 400 })
  }

  const content = typeof body.content === "string" ? body.content.trim() : ""
  if (!content) {
    return Response.json({ error: "emptyContent" }, { status: 400 })
  }
  if (content.length > MAX_CONTENT_CHARS) {
    return Response.json({ error: "contentTooLong" }, { status: 413 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const summary = typeof body.summary === "string" ? body.summary.trim() : ""

  // Título/linha fina entram apenas como contexto para desambiguar o texto.
  const context = [
    title && `Título da matéria: ${title}`,
    summary && `Linha fina: ${summary}`,
  ]
    .filter(Boolean)
    .join("\n")

  const userText = context
    ? `${context}\n\nTexto bruto para formatar:\n\n${content}`
    : `Texto bruto para formatar:\n\n${content}`

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0.35,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error(
        "[format-news] Gemini respondeu",
        response.status,
        detail.slice(0, 500)
      )
      return Response.json({ error: "providerError" }, { status: 502 })
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] }
        finishReason?: string
      }[]
      promptFeedback?: { blockReason?: string }
    }

    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim()

    if (!text) {
      console.error(
        "[format-news] resposta vazia do Gemini",
        data.promptFeedback?.blockReason ??
          data.candidates?.[0]?.finishReason ??
          "sem motivo"
      )
      return Response.json({ error: "emptyResult" }, { status: 502 })
    }

    // Alguns modelos insistem em envolver a resposta em cercas de código.
    const markdown = text
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim()

    return Response.json({ content: markdown || text })
  } catch (error) {
    console.error("[format-news] falha na chamada ao Gemini", error)
    return Response.json({ error: "providerUnreachable" }, { status: 502 })
  }
}
