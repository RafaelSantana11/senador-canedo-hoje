# Formatação de matérias com IA (Google Gemini)

Botão **"Formatar com IA"** no editor de notícias do painel. Ele envia o texto
bruto da matéria para o Google Gemini (camada gratuita do AI Studio) e
substitui o conteúdo do editor pelo Markdown jornalístico já formatado:
parágrafos curtos, intertítulos, citações, listas, ortografia e pontuação.

Diferente dos outros `INTEGRACAO-*.md`, este recurso **não passa pelo backend
NestJS**: a chamada ao Gemini acontece num route handler do próprio Next. A
chave da API fica **somente no servidor** — nunca vai ao browser.

Última atualização: 2026-09-13.

---

## Índice

- [1. Como funciona](#1-como-funciona)
- [2. Como ativar](#2-como-ativar)
- [3. Como usar](#3-como-usar)
- [4. Erros e o que fazer](#4-erros-e-o-que-fazer)
- [5. Manutenção](#5-manutenção)

---

## 1. Como funciona

```text
Browser (editor)                Next (servidor)                  Google
┌──────────────────┐   POST   ┌──────────────────────┐   HTTPS   ┌──────────┐
│ new-news-page.tsx│ ───────► │ /api/format-news     │ ────────► │  Gemini  │
│  (botão + toasts)│          │  lê GEMINI_API_KEY   │           │  API     │
│  troca `content` │ ◄─────── │  monta o prompt      │ ◄──────── │          │
└──────────────────┘ {content}└──────────────────────┘  Markdown └──────────┘
```

### Arquivos envolvidos

| Camada            | Arquivo                                                              | Papel                                                                                     |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Botão e estado    | `frontend/src/features/admin/news/pages/new-news-page.tsx`            | Botão no header, loading, toasts e substituição do `content`                               |
| Cliente           | `frontend/src/features/admin/news/services/format-news-service.ts`    | `formatNewsContent()` — faz o POST e traduz a resposta em códigos de erro (`FormatNewsError`) |
| Servidor          | `frontend/src/app/api/format-news/route.ts`                           | Lê a chave, monta o prompt, chama o Gemini e devolve `{ content }`                         |
| Configuração      | `frontend/.env`                                                       | `GEMINI_API_KEY` (obrigatória) e `GEMINI_FORMAT_MODEL` (opcional)                          |

### O que a IA faz (regras do prompt)

O `SYSTEM_INSTRUCTION` em `route.ts` instrui o modelo a:

- corrigir ortografia, gramática e pontuação no **português do Brasil**, com tom
  jornalístico, impessoal e objetivo;
- dividir o texto em parágrafos curtos (2 a 4 frases), separados por linha em branco;
- usar `##` e `###` para intertítulos **apenas quando o texto tiver seções distintas**;
- reservar `>` para **citações diretas que já existem** no original (sem inventar falas);
- usar listas (`-` / `1.`) apenas para enumerações já existentes;
- usar `**negrito**` com moderação;
- **não inventar, remover nem distorcer** fatos, nomes, números, datas ou declarações;
- não usar tabelas, HTML, blocos de código, imagens, links novos ou emojis;
- responder **somente com o Markdown final** (se o modelo envolver em cercas
  ```` ``` ````, o servidor remove).

### Limites técnicos

| Item                      | Valor                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| Tamanho máximo do texto   | 20.000 caracteres (acima disso → HTTP 413 `contentTooLong`)           |
| Timeout da chamada        | 60 segundos                                                           |
| Geração                   | `temperature: 0.35`, `topP: 0.95`, `maxOutputTokens: 8192`            |
| Modelo padrão             | `gemini-2.5-flash-lite` (troque com `GEMINI_FORMAT_MODEL`)            |
| Título/subtítulo          | Enviados apenas como **contexto** para a IA; não são alterados por ela |

---

## 2. Como ativar

### 2.1 Criar a chave gratuita

1. Acesse **https://aistudio.google.com/apikey** com uma conta Google.
2. Clique em **Create API key** e copie a chave.
3. Não é necessário cartão de crédito — a camada gratuita tem cota por minuto e
   por dia, por modelo (suficiente para uso editorial normal).

### 2.2 Configurar no projeto

No `frontend/.env`:

```bash
# Google Gemini — formatação de matérias com IA.
GEMINI_API_KEY=cole-a-chave-aqui

# Opcional: modelo usado na formatação (padrão: gemini-2.5-flash-lite).
# GEMINI_FORMAT_MODEL=gemini-2.5-flash
```

- **Reinicie o `npm run dev`** — variáveis de ambiente são lidas na subida do servidor.
- Em produção (Vercel/Railway/Docker), defina `GEMINI_API_KEY` nas variáveis do
  host. O nome **não** leva o prefixo `NEXT_PUBLIC_`, justamente para não expor a
  chave ao browser.
- O `.env` é ignorado pelo git (`frontend/.gitignore`), então a chave não é commitada.

### 2.3 Confirmar que ativou

- **Sem chave:** clicar no botão mostra o toast
  _"IA não configurada. Crie uma chave grátis em aistudio.google.com/apikey…"_
  (o endpoint responde HTTP 503 `missingApiKey`).
- **Com chave:** o botão vira _"Formatando…"_ com spinner e, ao terminar, aparece
  _"Conteúdo formatado com IA."_

Para testar o endpoint direto:

```bash
curl -X POST http://localhost:3001/api/format-news \
  -H 'Content-Type: application/json' \
  -d '{"content":"texto bruto da materia para formatar","title":"Título opcional"}'
# → { "content": "## Intertítulo\n\nTexto formatado..." }
```

---

## 3. Como usar

1. No painel, abra **Publicar** (`/admin/newNews`) ou edite uma matéria existente.
2. Escreva ou cole o texto bruto na área de conteúdo do editor.
3. Clique em **Formatar com IA** (botão com ícone de brilho, no topo da página,
   ao lado de "Rascunho" e "Publicar").
4. Espere o spinner — o conteúdo do editor é substituído pelo texto formatado.
5. Revise na pré-visualização (abas **Card** e **Página**) e ajuste o que quiser.
6. **Salvar rascunho** ou **Salvar e publicar** normalmente.

Observações:

- O botão substitui **todo o conteúdo** do editor. Se quiser comparar com o
  original, guarde o texto bruto fora do editor antes de aplicar.
- Funciona tanto em matéria nova quanto em edição; título e subtítulo atuais
  entram só como contexto e permanecem intactos.
- O texto precisa ter conteúdo (vazio → toast "Escreva o conteúdo antes de formatar.").
- Capa, tags, categoria, posição e urgência não são tocados pela IA.
- Se o texto já estiver bem formatado, o modelo devolve com ajustes mínimos.

---

## 4. Erros e o que fazer

| HTTP | `error`               | Mensagem exibida (resumo)                     | Causa / solução                                                        |
| ---- | --------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 503  | `missingApiKey`       | "IA não configurada…"                         | `GEMINI_API_KEY` ausente/vazia no `.env`; configure e reinicie o servidor |
| 400  | `emptyContent`        | "Escreva o conteúdo antes de formatar."       | Texto vazio                                                            |
| 413  | `contentTooLong`      | "O conteúdo é longo demais…"                  | Acima de 20.000 caracteres; divida a matéria                           |
| 502  | `providerError`       | "A IA não conseguiu formatar agora."          | Gemini recusou (ex.: HTTP 429 de cota, chave inválida) — veja o log do servidor |
| 502  | `providerUnreachable` | "Não foi possível falar com a IA…"            | Timeout ou falha de rede até o Google                                  |
| 502  | `emptyResult`         | "A IA não devolveu texto."                    | Resposta vazia/bloqueada pelo modelo; tente de novo                    |
| —    | `networkError`        | "Falha de rede ao chamar a IA."               | O browser não conseguiu alcançar `/api/format-news`                    |

Os erros do Gemini aparecem no console do servidor com o prefixo `[format-news]`
(status e trecho da resposta). A chave nunca é logada.

---

## 5. Manutenção

- **Trocar o modelo:** defina `GEMINI_FORMAT_MODEL` no `.env`
  (ex.: `gemini-2.5-flash` para mais qualidade, com cota gratuita menor).
- **Ajustar o estilo da formatação:** edite o `SYSTEM_INSTRUCTION` em
  `frontend/src/app/api/format-news/route.ts`.
- **Trocar de provedor** (Groq, OpenRouter, etc.): reescreva apenas o route
  handler. `format-news-service.ts` e o botão na página não mudam — o contrato
  interno é só `POST { content, title?, summary? }` → `{ content }`.
- **Referência oficial:** https://ai.google.dev/gemini-api/docs —
  endpoint usado: `POST /v1beta/models/{model}:generateContent` com header
  `x-goog-api-key`.
