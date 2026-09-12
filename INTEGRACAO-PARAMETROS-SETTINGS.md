# Mapa técnico de integração — Parâmetros do Portal (Settings)

Handoff do front para o back. Descreve o que a tela
`frontend/src/features/admin/settings/pages/params-page.tsx`
(rota `/admin/configuracoes/parametros`) faz hoje e **o contrato mínimo que falta**
para os parâmetros do portal deixarem de ser constantes de build + `localStorage`
e passarem a ser configuração persistida e compartilhada por todos os visitantes.

Complementa o [`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md),
o [`INTEGRACAO-NEWS-CATEGORIES-TAGS.md`](./INTEGRACAO-NEWS-CATEGORIES-TAGS.md) e o
[`INTEGRACAO-FILES-BANNERS.md`](./INTEGRACAO-FILES-BANNERS.md) — **os fundamentos
(base URL, Bearer token, CORS, formato de erro, upload) estão neles e valem igual
aqui**.

Diferente dos outros três, este documento **não descreve uma API já pronta**: o
módulo de settings/parâmetros ainda não existe no backend. Ele é a especificação
do que o front precisa para ligar a tela.

Última atualização: 2026-09-12.

---

## Índice

- [0. Leia primeiro: o que a tela faz hoje](#0-leia-primeiro-o-que-a-tela-faz-hoje)
- [1. Inventário: os 12 parâmetros que precisam ser persistidos](#1-inventário-os-12-parâmetros-que-precisam-ser-persistidos)
- [2. Contrato proposto](#2-contrato-proposto)
- [3. Identidade visual e o logo](#3-identidade-visual-e-o-logo)
- [4. Validação de valores](#4-validação-de-valores)
- [5. Quem consome cada parâmetro](#5-quem-consome-cada-parâmetro)
- [6. Parâmetros de paginação desativados na UI](#6-parâmetros-de-paginação-desativados-na-ui)
- [7. Comportamento atual dos botões Salvar e Restaurar](#7-comportamento-atual-dos-botões-salvar-e-restaurar)
- [8. Decisões pendentes](#8-decisões-pendentes)
- [9. Resumo das rotas e códigos de erro](#9-resumo-das-rotas-e-códigos-de-erro)

---

## 0. Leia primeiro: o que a tela faz hoje

A tela renderiza os parâmetros a partir do metadado `PARAM_META` (label,
descrição, grupo, tipo, `min`/`max`) e dos valores default de
`frontend/src/lib/portal-params.ts`. O que **não** existe é persistência no
servidor.

| # | Hoje no painel | Precisa passar a ser | Onde |
|---|---|---|---|
| 1 | Valores vêm de `lib/portal-params.ts`, **constantes de build** | vêm de `GET /settings` em runtime, com os defaults como fallback | [§2](#2-contrato-proposto) |
| 2 | "Salvar alterações" grava a identidade no `localStorage` (chave `portal-site-identity`) e os demais parâmetros **só em `useState`** | `PATCH /settings`. Hoje os 8 parâmetros numéricos/texto somem no F5; a identidade persiste apenas no browser de quem salvou | [§7](#7-comportamento-atual-dos-botões-salvar-e-restaurar) |
| 3 | O toast diz, com todas as letras, "os valores estão ativos **nesta sessão do browser**" | persistência real no servidor | [§7](#7-comportamento-atual-dos-botões-salvar-e-restaurar) |
| 4 | Logo é uma **URL em texto** (`LOGO_URL`) devolvida pelo `POST /files/upload` | referência ao arquivo (`{ id, path }`), para não quebrar quando a mídia for excluída do acervo | [§3](#3-identidade-visual-e-o-logo) |
| 5 | "Restaurar padrões" só desfaz no browser | endpoint/semântica de reset definida no servidor | [§2](#2-contrato-proposto) |

Ponto importante: **nada disso é lido do servidor hoje**. A home, o header, o
footer e o painel importam as constantes de `lib/portal-params.ts` em tempo de
build (ver [§5](#5-quem-consome-cada-parâmetro)). Ou seja, mesmo que o backend
crie um `GET /settings` amanhã, o portal só passa a refletir os valores quando o
front trocar os imports pelas chamadas da API.

---

## 1. Inventário: os 12 parâmetros que precisam ser persistidos

São exatamente as chaves de `PARAM_META` em
`features/admin/settings/pages/params-page.tsx` (a UI renderiza uma por chave) e
os defaults de `lib/portal-params.ts`:

| Chave | Tipo | Default | Faixa (UI) | Grupo |
|---|---|---|---|---|
| `MIN_NEWS_FOR_MIDDLE_BANNER` | number | `8` | 1–50 | Página inicial — Grade |
| `BANNER_INTERVAL` | number | `8` | 2–20 | Página inicial — Grade |
| `HERO_SECONDARY_COUNT` | number | `2` | 1–4 | Página inicial — Hero |
| `MOST_READ_COUNT` | number | `5` | 3–10 | Página inicial — Sidebar |
| `LATEST_COUNT` | number | `5` | 3–10 | Página inicial — Sidebar |
| `SAW_THIS_BLOCK_SIZE` | number | `5` | 3–10 | Página inicial — Sidebar |
| `RELATED_NEWS_COUNT` | number | `3` | 1–6 | Detalhe de Notícia |
| `WHATSAPP_NUMBER` | string | `"556200000000"` | — | Rodapé do site |
| `SITE_NAME` | string | `"Senador Canedo Hoje"` | — | Identidade Visual |
| `LOGO_URL` / `LOGO` | string (\*) | `""` | — | Identidade Visual |
| `LOGO_ALT` | string | `"Senador Canedo Hoje"` | — | Identidade Visual |
| `SHOW_NAME_WITH_LOGO` | boolean | `false` | — | Identidade Visual |

(\*) `SHOW_NAME_WITH_LOGO` **não está** no `PARAM_META`: é renderizado como
checkbox fixo na seção "Identidade Visual", mas é salvo junto com os demais.

Os nomes são os que o front já usa como chaves de objeto. O backend pode
adotar outro esquema (ex.: `snake_case`, colunas tipadas), desde que o `GET` e o
`PATCH` exponham um objeto **plano e estável** — ver [§2](#2-contrato-proposto).

---

## 2. Contrato proposto

### Rotas

| Método | Rota | Auth | Papel |
|---|---|---|---|
| `GET` | `/api/v1/settings` | **público** | portal lê os parâmetros (home, header, footer) |
| `PATCH` | `/api/v1/settings` | autenticado (sugestão: **admin**) | painel grava; corpo parcial |
| `POST` | `/api/v1/settings/reset` | autenticado (sugestão: **admin**) | "Restaurar padrões" (opcional — ver abaixo) |

**`GET /settings` precisa ser público.** A home é renderizada para visitante
anônimo; se a rota exigir token, o portal não consegue ler os parâmetros.
Cuidado para não confundir com a visão administrativa.

### Response do `GET /settings` (proposta)

O servidor deve devolver **todas as chaves, sempre**, mesclando o que está no
banco sobre os defaults de código. Assim o front nunca precisa lidar com objeto
parcial nem saber o default de cada chave em dois lugares:

```json
{
  "MIN_NEWS_FOR_MIDDLE_BANNER": 8,
  "BANNER_INTERVAL": 8,
  "HERO_SECONDARY_COUNT": 2,
  "MOST_READ_COUNT": 5,
  "LATEST_COUNT": 5,
  "SAW_THIS_BLOCK_SIZE": 5,
  "RELATED_NEWS_COUNT": 3,
  "WHATSAPP_NUMBER": "556200000000",
  "SITE_NAME": "Senador Canedo Hoje",
  "LOGO": { "id": "<uuid>", "path": "https://.../logo.png" },
  "LOGO_ALT": "Senador Canedo Hoje",
  "SHOW_NAME_WITH_LOGO": false,
  "updatedAt": "2026-09-12T12:00:00.000Z",
  "updatedBy": { "id": 1, "name": "Douglas" }
}
```

Regras:

- **Tipos estáveis**: `number` volta como número, `boolean` como boolean. Não
  serializar como string (`"8"`, `"false"`) — o front compara e exibe o valor
  cru nos inputs e no `isDirty`.
- `updatedAt`/`updatedBy` são **read-only** (metadado de auditoria). Mandar no
  `PATCH` deve dar erro, no mesmo espírito do `readOnlyField` dos outros módulos.
- **Não achatar as chaves de logo** em `LOGO_URL`/`LOGO_ID`; um objeto
  `logo: { id, path } | null` espelha `cover`, `photo` e `banner.items[].file`.
  Se o backend preferir manter `LOGO_URL` como string, ver ressalva em
  [§3](#3-identidade-visual-e-o-logo).

### `PATCH /settings`

Corpo parcial: só as chaves enviadas são tocadas. Exemplo do que a tela manda ao
salvar apenas a grade e o WhatsApp:

```json
{
  "MIN_NEWS_FOR_MIDDLE_BANNER": 10,
  "BANNER_INTERVAL": 6,
  "WHATSAPP_NUMBER": "5562999999999"
}
```

- Chave **desconhecida**: sugestão `422 { "errors": { "FOO": "unknownSetting" } }`
  para pegar typo, em vez de ignorar em silêncio (foi o padrão adotado em
  `readOnlyField`).
- Tipo errado / fora da faixa: `422` com código por campo (ver
  [§4](#4-validação-de-valores)).
- `null` explícito: definir claramente — sugestão aceitar apenas em `LOGO`
  (remove o logo, volta para "só texto"). Os demais campos não devem aceitar
  `null` (enviar tipo errado).
- Resposta sugerida: o objeto completo já atualizado (mesmo shape do `GET`),
  para o front atualizar o cache sem um segundo request.

### Reset

Duas opções, com impacto diferente no front:

- **A. `POST /settings/reset`** — o servidor apaga as linhas gravadas e volta
  aos defaults de código. É a semântica mais limpa para "Restaurar padrões".
- **B. Sem endpoint novo** — o front manda `PATCH` com todos os defaults. Não
  exige código no back, mas o front precisa conhecer e enviar todos os valores,
  e a operação se confunde com um save comum.

O botão "Restaurar padrões" já existe e está habilitado apenas quando há
alteração local (`isDirty`); com A, o botão passa a fazer o reset no servidor
(idealmente com confirmação, já que afeta todos os editores).

### Armazenamento (sugestão)

- **Tabela chave/valor** (`settings`: `key` PK, `value jsonb`, `updated_at`,
  `updated_by`) + um **registro de chaves em código** com tipo e faixa. `GET`
  lê as linhas e mescla sobre os defaults; `PATCH` valida chave a chave e faz
  upsert. É a opção que combina melhor com PATCH parcial e auditoria.
- Alternativa: **uma única linha JSONB** com todo o objeto. `GET`/`PATCH` são
  triviais, mas validação, auditoria por chave e concorrência ficam mais
  grossas.

Nos dois casos o contrato externo é o mesmo objeto plano. Não acoplar com o
`config` de notícia (`INTEGRACAO-NEWS-CATEGORIES-TAGS.md §3`): `config` é
por notícia e livre; settings é global e validado.

---

## 3. Identidade visual e o logo

Hoje o front faz upload real e guarda **a URL** como texto:

```ts
// features/admin/settings/pages/params-page.tsx
const uploaded = await uploadSettingsFile(file)   // POST files/upload
setValues((prev) => ({ ...prev, LOGO_URL: uploaded.path }))
```

- O upload já usa `POST /api/v1/files/upload` (multipart, campo `file`),
  com as mesmas travas do back: `jpeg`/`png`/`gif`, até **5 MB**.
- Guardar `path` como fonte da verdade **não tem integridade referencial**: se o
  arquivo for excluído pelo acervo de mídias, o logo quebra em todo o site sem
  aviso. `DELETE /files/:id` hoje checa três referências (notícia, usuário,
  banner) — um logo em settings seria **a quarta** e precisaria entrar na trava
  `fileInUse` (`INTEGRACAO-FILES-BANNERS.md §4`).

Recomendação: adotar `logo: { id: "<uuid>" } | null` como referência, no mesmo
padrão de `cover`/`photo`, e devolver `{ id, path }` resolvido no `GET`. O front
passa a guardar o `id` e a usar `path` só para o `src`; trocar de logo vira um
`PATCH { "logo": { "id": "..." } }`.

Se o backend preferir manter `LOGO_URL` como string, funciona — mas a tela passa
a poder gravar uma URL morta e o tratamento de "só texto" (string vazia) vira o
único estado de remoção.

**SVG**: hoje não é aceito (nem no front, nem no back). Logo de portal costuma
ser SVG; se for para aceitar, o backend precisa liberar `image/svg+xml`
explicitamente e considerar sanitização (SVG carrega script). Decisão em
[§8](#8-decisões-pendentes).

Dimensões (`width`/`height`) **não são necessárias** para o logo — diferente de
mídia de notícia, não há layout dependente disso. O upload atual nem as envia.

---

## 4. Validação de valores

O que o front garante hoje é fraco e **não deve ser a única barreira**:

- Os `min`/`max` dos inputs são atributos HTML: ajudam nas setas, mas não
  impedem digitar/salvar fora da faixa.
- `handleChange` só faz `parseInt`; strings livres (nome, WhatsApp) passam sem
  validação nenhuma.
- O botão "Salvar" só exige `isDirty` (qualquer diferença local).

Portanto, a validação de faixa e formato deve ser **do servidor**:

| Chave | Regra sugerida | Código de erro |
|---|---|---|
| `MIN_NEWS_FOR_MIDDLE_BANNER` | inteiro, 1–50 | `valueOutOfRange` |
| `BANNER_INTERVAL` | inteiro, 2–20 | `valueOutOfRange` |
| `HERO_SECONDARY_COUNT` | inteiro, 1–4 | `valueOutOfRange` |
| `MOST_READ_COUNT` | inteiro, 3–10 | `valueOutOfRange` |
| `LATEST_COUNT` | inteiro, 3–10 | `valueOutOfRange` |
| `SAW_THIS_BLOCK_SIZE` | inteiro, 3–10 | `valueOutOfRange` |
| `RELATED_NEWS_COUNT` | inteiro, 1–6 | `valueOutOfRange` |
| `WHATSAPP_NUMBER` | dígitos apenas (formato internacional, ex. `5562999999999`), 10–15 | `whatsappInvalidFormat` |
| `SITE_NAME` | string não vazia (sugestão; front hoje permite vazio) | `emptyValue` |
| `LOGO` | uuid de arquivo existente, ou `null` | `imageNotExists` |
| `LOGO_ALT` | string, pode ser vazia | — |
| `SHOW_NAME_WITH_LOGO` | boolean | `invalidType` |

Formato de erro: seguir o padrão do projeto — `{ "status": 4xx, "errors": { "<chave>": "<código>" } }`,
com a chave do erro sendo o nome do parâmetro (ex.:
`{ "errors": { "MIN_NEWS_FOR_MIDDLE_BANNER": "valueOutOfRange" } }`).

Observação de UX: se o back **clampasse** em silêncio (como faz em
`?limit=`, ver [§6](#6-parâmetros-de-paginação-desativados-na-ui)), o editor não
saberia que o valor não valeu. Para essa tela, falhar alto com `422` é melhor.

---

## 5. Quem consome cada parâmetro

Todos os consumidores são **do portal** e importam as constantes de
`lib/portal-params.ts` diretamente hoje. Depois da API, cada um precisa ler o
valor em runtime (React Query já é usado no portal; um provider/store hidratado
com `GET /settings` e `staleTime` resolve o caso sem request por componente):

| Parâmetro | Consumidor | Uso |
|---|---|---|
| `MIN_NEWS_FOR_MIDDLE_BANNER` | `features/portal/home/pages/home-page.tsx:77` | exibir ou não o banner do meio |
| `BANNER_INTERVAL` | `features/portal/home/components/featured-grid.tsx:96` | fatiar a grade em blocos |
| `HERO_SECONDARY_COUNT` | `features/portal/home/utils/showcase.ts:104` | cards ao lado do destaque |
| `MOST_READ_COUNT` | `utils/showcase.ts:142` | itens de "Mais lidas" |
| `LATEST_COUNT` | `utils/showcase.ts:146` | itens de "Últimas notícias" |
| `SAW_THIS_BLOCK_SIZE` | `features/portal/home/components/news-sidebar.tsx:33` | itens por bloco "Viu isso?" |
| `RELATED_NEWS_COUNT` | **nenhum hoje** | parâmetro editável sem consumidor — ver nota abaixo |
| `WHATSAPP_NUMBER` | `features/admin/news/components/site-footer.tsx:18` | links `wa.me` do rodapé |
| `SITE_NAME` | `site-header.tsx`, `admin-shell.tsx`, `site-footer.tsx`, `login-page.tsx` | via `useSiteIdentityStore` |
| `LOGO_URL`/`LOGO` | idem | via `useSiteIdentityStore` |
| `LOGO_ALT` | idem | acessibilidade do logo |
| `SHOW_NAME_WITH_LOGO` | `features/portal/home/components/site-header.tsx:24` | mostrar nome ao lado do logo |
| os 5 `*_FETCH_LIMIT` | **nenhum** | comentados na UI — ver [§6](#6-parâmetros-de-paginação-desativados-na-ui) |

> `RELATED_NEWS_COUNT` é editável e validado na UI, mas nenhuma seção de
> notícias relacionadas consome o valor ainda. Decisão de produto: ou o server
> persiste mesmo assim (inofensivo), ou o parâmetro sai da tela até existir o
> consumidor. O front não bloqueia nenhuma das duas.

**Hidratação/SSR**: o `SiteIdentityHydrator` lê o `localStorage` depois do
mount, com os defaults no primeiro render — por isso pode haver um flash do
nome padrão antes de hidratar. Buscar settings no servidor (layout/Server
Component) ou hidratar o store com o `GET /settings` resolve o flash de uma vez
para todos os campos de identidade.

---

## 6. Parâmetros de paginação desativados na UI

`lib/portal-params.ts` ainda define cinco constantes de paginação que **não
aparecem na tela** (bloco comentado no `PARAM_META`) e **não são consumidas por
ninguém**:

| Chave | Valor atual | Teto do back (clamp em código) |
|---|---|---|
| `PORTAL_NEWS_FETCH_LIMIT` | `50` | `50` (`news.controller.ts:69`) |
| `CATEGORIES_FETCH_LIMIT` | `100` | `100` (`categories.controller.ts:68`) |
| `AUTHORS_FETCH_LIMIT` | `50` | sem clamp conhecido |
| `TAGS_FETCH_LIMIT` | `100` | `100` (`tags.controller.ts:56`) |
| `BANNERS_FETCH_LIMIT` | `50` | sem clamp conhecido |

Foram escondidas de propósito: expor um limite que o servidor clampa em silêncio
daria a impressão de que o valor vale em todas as chamadas. Se o backend quiser
esses parâmetros editáveis, é preciso **primeiro** decidir o teto: subir o cap
para o máximo editável, ou documentar que acima do cap o servidor corta. Até
lá, o front mantém a seção fora da UI (o back não precisa fazer nada).

---

## 7. Comportamento atual dos botões Salvar e Restaurar

Referência: `params-page.tsx:205-222`.

**Salvar** (`handleSave`) faz duas coisas:

1. `setSaved({ ...values })` — só React state; some ao recarregar.
2. `setIdentity({ name, logoUrl, logoAlt, showNameWithLogo })` — grava no
   `localStorage` via `useSiteIdentityStore`. É o **único** conjunto que
   persiste hoje, e apenas no browser de quem salvou.

Com a API, o fluxo passa a ser: `PATCH /settings` com as chaves sujas →
atualizar o cache do `GET` → `toast.success` sem o "nesta sessão do browser".

**Restaurar padrões** (`handleReset`) volta `values` e `saved` para o snapshot
`defaults` — e tem uma sutileza que vale registrar:

- Para os parâmetros numéricos/texto, `defaults` são as constantes de
  `lib/portal-params.ts`.
- Para a identidade, `defaults` é lido do **store** (`useSiteIdentityStore.getState()`),
  ou seja, é o último valor salvo no browser, **não** o default de build. Na
  prática, "Restaurar padrões" hoje não devolve o nome/logo originais.
- O reset não chama `setIdentity`: se o usuário restaurar e recarregar, a
  identidade antiga continua no lugar.

O endpoint (ou semântica) de reset do back deve resolver isso de forma única:
reset = defaults de código para **todas** as chaves, inclusive identidade e logo.

O badge "editado" por campo compara `values` com `defaults`. Depois da API, o
mais correto é comparar com o **último valor do servidor** — aí "editado"
significa "ainda não salvo", que é o que o usuário espera.

---

## 8. Decisões pendentes

Perguntas objetivas para fechar antes de implementar:

1. **Armazenamento**: tabela chave/valor com registry de validação, ou linha
   única JSONB? (sugestão: chave/valor — [§2](#2-contrato-proposto))
2. **Permissão de escrita**: admin apenas, ou qualquer autenticado? (config
   global pede admin; notícia hoje aceita qualquer autenticado)
3. **`GET` público** e mesclando defaults no servidor? (sim para os dois; é o
   que o portal precisa)
4. **Reset**: endpoint dedicado ou `PATCH` com defaults?
5. **Logo**: referência (`{ id }`, recomendado — exige a 4ª trava no
   `DELETE /files/:id`) ou string de URL (sem integridade)?
6. **SVG** no logo: aceitar (com sanitização) ou manter jpeg/png/gif?
7. **Paginação** ([§6](#6-parâmetros-de-paginação-desativados-na-ui)): expor os
   `*_FETCH_LIMIT` ou manter desativados?
8. **Cache/ETag** no `GET`: o portal pode cachear com `staleTime`; o back
   fornece `ETag`/`Cache-Control` curto ou o `updatedAt` para revalidação?
9. **Concorrência**: last-write-wins é aceitável (poucos editores)? Se não,
   versionar com `If-Match`/`updatedAt`.
10. **Auditoria**: `updatedBy` no `GET` público? (sugestão: não no público; sim
    na resposta autenticada)
11. **Nomes das chaves**: manter `SCREAMING_SNAKE_CASE` como o front usa, ou o
    back impõe outro esquema e o front adapta? (só precisa ser decidido)

---

## 9. Resumo das rotas e códigos de erro

### Rotas

| Método | Rota | Auth | Observação |
|---|---|---|---|
| `GET` | `/api/v1/settings` | público | todas as chaves, defaults mesclados no servidor |
| `PATCH` | `/api/v1/settings` | autenticado (admin) | parcial; só chaves enviadas |
| `POST` | `/api/v1/settings/reset` | autenticado (admin) | opcional; defaults de código |
| `POST` | `/api/v1/files/upload` | autenticado | já existe; usado pelo logo |

Upload de logo e travas de arquivo em uso: ver
[`INTEGRACAO-FILES-BANNERS.md`](./INTEGRACAO-FILES-BANNERS.md).
Fundamentos de auth e formato de erro: ver
[`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md).

### Códigos de erro (proposta)

| Código | Campo | Significado |
|---|---|---|
| `valueOutOfRange` | chave numérica | fora da faixa da [§4](#4-validação-de-valores) |
| `invalidType` | chave | tipo diferente do esperado (`"8"` em number, `"true"` em boolean) |
| `whatsappInvalidFormat` | `WHATSAPP_NUMBER` | não são só dígitos / fora de 10–15 |
| `emptyValue` | `SITE_NAME` | string vazia onde não pode |
| `unknownSetting` | chave | chave que não existe no registry |
| `readOnlyField` | `updatedAt` / `updatedBy` | metadado de auditoria; não envie |
| `imageNotExists` | `LOGO` | uuid de arquivo inexistente (`INTEGRACAO-NEWS-CATEGORIES-TAGS.md §7`) |
| `fileInUse` | `id` | `DELETE /files/:id` de um arquivo referenciado por settings/notícia/usuário/banner (`INTEGRACAO-FILES-BANNERS.md §4`) |

`401` (sem token) e `403` (sem permissão) seguem o padrão do projeto: trate pelo
status.
