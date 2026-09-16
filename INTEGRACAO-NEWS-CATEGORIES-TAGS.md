# Mapa técnico de integração — News, Categories e Tags

Contrato da API para o frontend consumir. Cobre o **CRUD de notícias**, de
**categorias** e de **tags** — tudo o que falta para o painel deixar de guardar
conteúdo no `localStorage` (`components/admin/admin-store.tsx`) e o portal
público deixar de ler o mock de `lib/news-data.ts`.

Complementa o [`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md), que
já cobre login, refresh, perfil e autores — **os fundamentos (base URL, Bearer
token, CORS, formato de erro) estão lá e valem igual aqui**.

Swagger interativo (com "Try it out"): `{HOST}/docs`.
Última atualização: 2026-09-16.

---

## Índice

- [0. Leia primeiro: as 5 mudanças que quebram o painel atual](#0-leia-primeiro-as-5-mudanças-que-quebram-o-painel-atual)
- [1. A tela de Autores não tem endpoint próprio](#1-a-tela-de-autores-não-tem-endpoint-próprio)
- [2. `NEXT_PUBLIC_API_URL` precisa terminar com barra](#2-next_public_api_url-precisa-terminar-com-barra)
- [3. O contrato do `config`](#3-o-contrato-do-config)
- [4. News](#4-news)
- [5. Categories](#5-categories)
- [6. Tags](#6-tags)
- [7. Capa: upload primeiro, referência depois](#7-capa-upload-primeiro-referência-depois)
- [8. Mapeamento de nomes front ↔ API](#8-mapeamento-de-nomes-front--api)
- [9. Inconsistências do front para corrigir](#9-inconsistências-do-front-para-corrigir)
- [10. Novidades em `/users` (travas de admin)](#10-novidades-em-users-travas-de-admin)
- [11. Resumo das rotas e dos códigos de erro](#11-resumo-das-rotas-e-dos-códigos-de-erro)

---

## 0. Leia primeiro: as 5 mudanças que quebram o painel atual

O que o painel faz hoje **não** funciona contra esta API sem ajuste. Em ordem de
impacto:

| # | Hoje no painel | Passa a ser | Onde |
|---|---|---|---|
| 1 | `author: "Redação"` (texto livre) | **derivado do login** — a notícia é assinada pelo `Author` do usuário autenticado. Enviar `author` no corpo dá `422` | [§4.3](#43-post-news--autenticado) |
| 2 | `image: "/news/foto.png"` (URL em texto) | `cover: { "id": "<uuid do arquivo>" }` — sobe o arquivo antes | [§7](#7-capa-upload-primeiro-referência-depois) |
| 3 | `category: "Política"` (string) | `category: { "id": "<uuid>" }` — referência à entidade | [§5](#5-categories) |
| 4 | `urgent`/`position` como campos da notícia | vão **dentro de `config`** (JSON livre) | [§3](#3-o-contrato-do-config) |
| 5 | `usageCount` enviado no corpo da tag | **contador é read-only** — enviar dá `422 readOnlyField` | [§6](#6-tags) |

E duas mudanças de comportamento que não quebram, mas mudam o que aparece:

- `views` tem **rotas próprias**: a visita se registra em `POST /news/:id/views`
  e a contagem atual se lê em `GET /news/views?ids=`. O `GET /news/:slug` **não
  incrementa mais nada** (ver [§4.6](#46-get-newsviews--público) e
  [§4.7](#47-post-newsidviews--público)).
- `DELETE /news/:id` **arquiva**, não apaga (ver [§4.5](#45-delete-newsid--autor-ou-admin)).

---

## 1. A tela de Autores não tem endpoint próprio

> Esta seção é a que mais economiza tempo. A página de autores prototipada em
> `origin/featAdmin` (`features/admin/authors/`) tem botões de **criar** e
> **excluir** autor, e campos que não existem no modelo. Isso é intencional do
> lado do backend, não uma lacuna: **`Author` é 1:1 com `User`** — criado no
> mesmo instante que o usuário, removido junto com ele. Um autor solto seria um
> autor sem login; um usuário sem autor não teria como assinar notícia.

**Não existem `POST /authors` nem `DELETE /authors/:id`, e não vão existir.**
Os endpoints que atendem aquela tela **já existem** desde a fase de Auth:

| O que a tela do protótipo faz | Endpoint real | Auth |
|---|---|---|
| "Criar autor" | `POST /api/v1/users` — cria `User` **e** `Author` na mesma transação | admin |
| "Editar autor" (nome, foto, bio, slug, isColumnist) | `PATCH /api/v1/authors/:id` — **tudo numa requisição só** | dono ou admin |
| "Excluir autor" | `DELETE /api/v1/users/:id` — remove o par `User`+`Author` | admin |
| "Listar autores" | `GET /api/v1/authors` | público |

> **Mudou:** `name` e `photo` passaram a ser aceitos por `PATCH /authors/:id`.
> Antes eles só se editavam por `PATCH /users/:id` ou `PATCH /auth/me` — e, pior,
> mandá-los para `/authors/:id` respondia `200` **sem gravar nada**. Aqueles dois
> caminhos continuam válidos para administração de usuário; para a tela de
> autores, use só `PATCH /authors/:id`.

### Campo a campo: o que existe de verdade

O `Author` que a API devolve (detalhes em
[`INTEGRACAO-AUTH-AUTHORS.md` §3](./INTEGRACAO-AUTH-AUTHORS.md#3-authors)):

```ts
type Author = {
  id: string           // uuid
  slug: string         // identificador público
  bio: string | null
  isColumnist: boolean
  userId: number       // id do User dono
  name: string         // vem de User.name (achatado, não aninhado)
  photo: { id, path } | null   // vem de User.photo
  createdAt: string
  updatedAt: string
}
```

| Campo do protótipo | Situação |
|---|---|
| `name` | existe; mora no **`User`**, mas é editável por `PATCH /authors/:id` (grava no `User` por baixo) |
| `email` | mora no **`User`**, e **não é devolvido** em rota pública de autor/notícia |
| `role` | mora no **`User`** (`role.id`: `1` admin, `2` user) |
| `avatar` | é o **`photo`** do `User` (objeto `{ id, path }`, não string); editável por `PATCH /authors/:id`, mandando `{ "id": "<id de arquivo>" }` ou `null` |
| `bio`, `isColumnist` | existem no `Author` — `PATCH /authors/:id` |
| `twitter`, `instagram`, `linkedin` | **não existem** no modelo |
| `active` | **não existe** no `Author`. O equivalente é `status` no `User` (`active`/`inactive`) — mas atenção: hoje o login **não** verifica `status`, então isso não bloqueia acesso |

Na prática, aquela tela é a junção de duas coisas que já existem: **convidar
usuário** (admin, `POST /users`) e **editar perfil** (`PATCH /authors/:id`, que
agora cobre nome e foto além dos campos editoriais). Só a criação e a exclusão
precisam passar por `/users`.

---

## 2. `NEXT_PUBLIC_API_URL` precisa terminar com barra

`services/api.ts` chama caminhos relativos **sem barra inicial**
(`"auth/email/login"`, `"news"`). Com `axios`, isso significa que a `baseURL`
precisa terminar com barra **e** já conter o prefixo e a versão:

```dotenv
# ✅ certo
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1/

# ❌ errado — o axios descarta o último segmento e a chamada vira /api/news
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
# ❌ errado — falta prefixo e versão
NEXT_PUBLIC_API_URL=http://localhost:3000/
```

Isso não estava documentado em lugar nenhum; o sintoma de errar é `404` em todas
as rotas, com o console mostrando uma URL "quase certa".

---

## 3. O contrato do `config`

Esta é a parte mais importante da spec para o front, porque é onde ele ganha
autonomia — e, junto, responsabilidade.

### O que é

`config` é um **objeto JSON livre** em cada notícia. O backend:

- **guarda e devolve sem interpretar**: não lê, não filtra, não ordena e não
  valida nenhuma chave de dentro;
- valida **só o tamanho**: máximo **16 KB** do JSON serializado (`422`
  `configTooLarge` acima disso);
- trata `config` como um bloco único: no `PATCH`, o que você manda **substitui**
  o objeto inteiro (não há merge de chaves).

Por que assim: o painel precisa criar e mudar regras de vitrine (posição na home,
ordem, sinalização de última hora) sem exigir migration nem mudança de contrato
no backend a cada ideia nova.

### O preço: unicidade de slot é responsabilidade do front

O backend **não impõe invariante nenhum**. Se duas notícias vierem marcadas como
`destaque`, as duas ficam `destaque` — e a home decide o que fazer com isso. A
lógica que o `admin-store.tsx` já tem hoje (`updateArticlePosition` rebaixando o
ocupante anterior para `normal`) **continua sendo a única garantia**, e precisa
migrar para o fluxo que chama a API: rebaixar o ocupante anterior = um `PATCH`
extra na notícia que sai do slot.

### Convenção de chaves (não é contrato validado)

São os nomes que o painel já usa. Documentados aqui para o front **não
reinventar** — o backend aceitaria qualquer outro nome do mesmo jeito:

```jsonc
{
  "config": {
    // slot na home. Valores usados hoje pelo painel:
    // "destaque" | "topo" | "feed" | "lateral" | "rodape" | "normal"
    "position": "destaque",

    // ordem dentro do slot, para os que aceitam mais de uma notícia
    // ("feed" e "lateral"). O painel hoje ordena pela posição no array do
    // localStorage; com a API, a ordem precisa de um número explícito.
    "positionOrder": 0,

    // sinalização de última hora (o selo vermelho no card)
    "urgent": true
  }
}
```

- Slots que o **front** trata como exclusivos: `destaque`, `topo`, `rodape`.
- Slots que aceitam vários: `feed`, `lateral`.
- `"normal"` (ou `position` ausente) = notícia sem slot fixo, entra no acervo.

### Leia de forma defensiva

Como o `config` passa a carregar layout, um JSON inesperado quebra a home **em
silêncio**. Trate chave ausente ou com valor fora do esperado como default:

```ts
const position = KNOWN_POSITIONS.includes(news.config?.position as Position)
  ? (news.config!.position as Position)
  : 'normal'
const order = Number.isFinite(news.config?.positionOrder)
  ? Number(news.config!.positionOrder)
  : 0
const urgent = news.config?.urgent === true
```

### Duas ressalvas técnicas do armazenamento

O campo é `jsonb` no Postgres. Valores, tipos e aninhamento voltam **idênticos**
(há teste e2e cobrindo round-trip com objeto aninhado, array, `null` e acento),
mas:

1. **A ordem das chaves não é preservada.** Mandar
   `{ "position": "topo", "urgent": true }` pode voltar como
   `{ "urgent": true, "position": "topo" }`. Não dependa da ordem — leia por
   chave.
2. **Chave duplicada no mesmo objeto colapsa** (fica a última). Isso só acontece
   com JSON montado à mão, não com `JSON.stringify` de um objeto.

---

## 4. News

**Forma do objeto**

```ts
type News = {
  id: string                  // uuid
  title: string
  slug: string                // gerado do título quando omitido
  summary: string | null      // é o `excerpt` do painel
  body: string                // markdown — o servidor NÃO renderiza HTML
  cover: { id: string; path: string } | null   // `path` já é URL pública
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null  // ISO; carimbado na 1ª publicação
  category: Category          // objeto completo (sem `newsCount` aqui)
  author: Author              // achatado, sem `user` aninhado, sem e-mail
  tags: Tag[]                 // sem `usageCount` aqui
  views: number               // retrato do momento da leitura — ver §4.6
  config: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}
```

> **`body` é markdown.** O editor do painel já é markdown com toolbar e renderer
> próprio; o backend armazena texto e não converte nada — renderizar HTML no
> servidor abriria XSS sem necessidade. A renderização continua no cliente.

### 4.1 `GET /news` — público

Listagem paginada. Funciona **com e sem** token, e o resultado é diferente:

| Param | Tipo | Default | Observação |
|---|---|---|---|
| `page` | number | `1` | |
| `limit` | number | `15` | teto de `50` |
| `category` | string | — | **slug** da categoria, não o id |
| `tag` | string | — | **slug** da tag |
| `status` | enum | — | `draft` \| `published` \| `archived`. ⚠️ **ignorado sem token** |
| `q` | string | — | busca `ILIKE` em `title` e `summary` (não é full-text) |

**Sem token**, a resposta traz **somente `published`** — e o `?status=` que vier
na query é **ignorado**, não recusado. Rascunho não vaza nem por engano (há teste
e2e). Token inválido ou expirado conta como "sem token": a rota devolve a visão
pública, não `401`.

**Com token**, o `?status=` é respeitado; sem ele, vêm rascunhos, publicadas e
arquivadas juntos.

**Ordenação**: `publishedAt DESC`, e como rascunho não tem `publishedAt`, ele vai
para o **fim** da lista e se ordena por `createdAt DESC`. Para listar rascunhos
no painel, filtre `?status=draft`.

> **Não existe ordenação por slot da vitrine no servidor** — posição vive no
> `config` e quem arranja a home é o front, buscando as publicadas e montando o
> layout no cliente (é o que o painel já faz hoje).

**Response `200`**

```json
{
  "data": [ { "id": "...", "title": "...", "...": "..." } ],
  "hasNextPage": true
}
```

`hasNextPage` é `true` quando a página veio cheia (`data.length === limit`) — é a
mesma convenção de `/users` e `/authors`.

### 4.2 `GET /news/:slug` — público

Detalhe por **slug** (não por id).

- Sem token, notícia `draft` ou `archived` responde **`404`** — não `403`, que já
  contaria que ela existe.
- **Leitura pura e idempotente**: não incrementa `views`.

> **Mudou (2026-09-16):** até aqui este `GET` incrementava `views`. Com o detalhe
> servido de cache, isso contava regeneração de página, não visita. A visita
> agora se registra em [`POST /news/:id/views`](#47-post-newsidviews--público):
> quem só chama este `GET` **deixa de contar visitas**.

**Erros**: `404` `{ "slug": "newsNotFound" }`.

### 4.3 `POST /news` — autenticado

Qualquer usuário do dashboard pode criar (não é privilégio de admin).

**Request**

```json
{
  "title": "Congresso aprova nova reforma",
  "summary": "Após semanas de negociação, o texto foi aprovado.",
  "body": "## Principais pontos\n\n- Simplificação tributária...",
  "status": "published",
  "slug": "congresso-aprova-nova-reforma",
  "cover": { "id": "<uuid de arquivo já enviado>" },
  "category": { "id": "<uuid da categoria>" },
  "tags": [{ "id": "<uuid da tag>" }],
  "config": { "position": "destaque", "positionOrder": 0, "urgent": true }
}
```

- **Obrigatórios**: `title`, `body`, `category`.
- `status` é opcional; o default é **`draft`**.
- `slug` é opcional — gerado do título, com sufixo numérico em caso de colisão
  (`titulo`, `titulo-2`, `titulo-3`...). Se mandar um slug já usado: `422`.
  **`views` é reservado** (colide com `GET /news/views`): mandar dá
  `422 slugAlreadyExists`, e um título "Views" gera `views-2`. Vale também no
  `PATCH`.
- `tags` é opcional; `[]` ou ausente = sem tags.
- **`author` não entra no payload** — é o `Author` do usuário do token.

**Campos recusados** (`422` com código `readOnlyField`): `author`, `views`,
`publishedAt`. São derivados do servidor; enviar qualquer um deles falha alto de
propósito, em vez de ser ignorado em silêncio.

**Response `201`**: a notícia completa, com `author`, `category` e `tags`
resolvidos.

**Erros**

| Status | Corpo | Quando |
|---|---|---|
| `401` | — | sem token |
| `404` | `{ "id": "categoryNotFound" }` | categoria inexistente |
| `422` | `{ "tags": "tagNotExists" }` | qualquer id de tag inválido |
| `422` | `{ "cover": "imageNotExists" }` | arquivo de capa inexistente |
| `422` | `{ "slug": "slugAlreadyExists" }` | slug em uso |
| `422` | `{ "config": "configTooLarge" }` | `config` acima de 16 KB |
| `422` | `{ "author": "readOnlyField" }` | mandou campo derivado |
| `422` | `{ "title": "..." }` | validação de formato |

### 4.4 `PATCH /news/:id` — autor ou admin

Por **id** (não slug). Só o **autor da notícia** ou um **admin**; outro usuário
recebe `403` `{ "id": "cannotManageAnotherAuthorNews" }`.

Todo campo é opcional; o que não vier não é tocado. Dois detalhes de semântica:

- `tags: []` **remove** todas as associações; **omitir** `tags` mantém as atuais.
- `cover: null` remove a capa; omitir mantém.
- `config` substitui o objeto inteiro (não faz merge).

**`publishedAt`**: carimbado quando o `status` passa a `published` pela primeira
vez, e **nunca reescrito** depois. Voltar para `draft` **preserva** o carimbo, e
republicar **não** muda a data original. Ou seja: `publishedAt` é "quando isto
foi publicado pela primeira vez".

### 4.5 `DELETE /news/:id` — autor ou admin

**Arquiva** (`status: "archived"`), não apaga. Responde `204` e é idempotente
(arquivar de novo devolve `204`).

Consequência: a notícia **desaparece das rotas públicas** (`404` no detalhe, fora
da listagem) e **continua visível** para quem está autenticado, com
`status: "archived"`. Não existe "restaurar" explícito — é um
`PATCH { "status": "published" }`.

### 4.6 `GET /news/views` — público

Contagem **atual** de `views` de várias notícias, sem o resto do payload.

O `views` que vem dentro de `GET /news` e `GET /news/:slug` continua lá, mas é o
**retrato do momento em que aquela resposta foi gerada**. Se ela estiver em
cache, o número está congelado junto. Esta rota existe para ser consultada a
cada refresh: é leve (lê só `id` e `views`, sem relações) e responde com
`Cache-Control: no-store`.

**Request**

```
GET /api/v1/news/views?ids=<uuid>,<uuid>,<uuid>
```

| Param | Tipo | Observação |
|---|---|---|
| `ids` | string | **obrigatório**. UUIDs separados por vírgula, **no máximo 100**. Repetidos contam uma vez |

**Response `200`**

```json
{
  "data": [
    { "id": "0b0e7c0e-5d1a-4a8e-9f0e-2f6f8d5c1a11", "views": 128 },
    { "id": "cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae", "views": 42 }
  ]
}
```

- **Ordenada por `views` decrescente** (empate: `publishedAt` mais recente
  primeiro).
- **Só notícias `published`**, com ou sem token. Id inexistente, rascunho ou
  arquivada é **omitido** da resposta: não vira `0` nem `404`. Um id pedido que
  não voltou saiu da vitrine.

**Erros**

| Status | Corpo | Quando |
|---|---|---|
| `422` | `{ "ids": "idsInvalid" }` | `ids` ausente, vazio, ou com item que não é UUID |
| `422` | `{ "ids": "idsTooMany" }` | mais de 100 ids distintos |

Acima de 100 a requisição é **recusada**, não truncada: se a lista fosse cortada
em silêncio, as notícias fora do corte pareceriam não ter contagem.

### 4.7 `POST /news/:id/views` — público

Registra **uma** leitura e devolve a contagem nova. Por **id** (não slug).

- Sem corpo e sem token.
- **Não é idempotente: cada chamada conta.** Chame uma vez por visita. Em React
  18 com `StrictMode`, um efeito roda duas vezes em dev e conta duas visitas.
- A soma é atômica no banco: chamadas simultâneas não perdem contagem.
- Só notícia `published` conta. Rascunho e arquivada respondem `404`, como no
  detalhe.
- Registrar visita **não altera `updatedAt`**, que continua sendo a data da
  última edição.

**Response `200`**

```json
{ "id": "cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae", "views": 43 }
```

**Erros**

| Status | Corpo | Quando |
|---|---|---|
| `400` | — | `:id` não é UUID |
| `404` | `{ "id": "newsNotFound" }` | inexistente, rascunho ou arquivada |

---

## 5. Categories

```ts
type Category = {
  id: string
  name: string             // único
  slug: string             // único, gerado do nome quando omitido
  description: string | null
  color: string | null     // hex: #rgb ou #rrggbb
  active: boolean          // default true
  newsCount?: number       // derivado, só em GET /categories
  createdAt: string
}
```

| Método | Rota | Auth |
|---|---|---|
| `GET` | `/api/v1/categories` | público |
| `POST` | `/api/v1/categories` | autenticado |
| `PATCH` | `/api/v1/categories/:id` | autenticado |
| `DELETE` | `/api/v1/categories/:id` | autenticado |

### `GET /categories`

Params: `page` (`1`), `limit` (`50`, teto `100`), `active` (boolean).
Ordenação: `name ASC`.

- **`newsCount` vem calculado** na própria query (rascunho, publicada e arquivada
  contam — todas apontam para a categoria). É **read-only**: enviar no payload dá
  `422 readOnlyField`.
- **Sem token, só categorias `active: true`** aparecem, e o `?active=` é
  ignorado. Com token, vêm todas e o filtro funciona.

### `POST` / `PATCH`

```json
{
  "name": "Política",
  "slug": "politica",
  "description": "Cobertura política da cidade",
  "color": "#3b82f6",
  "active": true
}
```

Só `name` é obrigatório. `slug` é opcional (gerado do nome, com sufixo em
colisão). `color` valida **formato** hex e nada mais.

**Erros**: `422 { "name": "nameAlreadyExists" }`,
`422 { "slug": "slugAlreadyExists" }`,
`422 { "color": "colorInvalidFormat" }`, `404 { "id": "categoryNotFound" }`.

### `DELETE` só funciona em categoria sem notícia

Categoria com **qualquer** notícia vinculada (inclusive rascunho e arquivada)
responde `422 { "id": "categoryHasNews" }` — não `500` de violação de FK.

> **Para categoria em uso, a saída é `PATCH { "active": false }`**: ela continua
> vinculada às notícias e apenas some das listagens públicas. Vale desenhar a
> tela assim — "desativar" como ação primária e "excluir" só para categoria
> recém-criada por engano.

### Seed

As 8 categorias que o front já usa (`lib/news-data.ts`) vêm criadas pelo
`npm run seed:run:relational`: Política, Economia, Mundo, Tecnologia, Esportes,
Saúde, Cultura, Meio Ambiente. O seed é idempotente e não sobrescreve edições
feitas no painel.

---

## 6. Tags

```ts
type Tag = {
  id: string
  name: string             // único
  slug: string             // único
  description: string | null
  color: string | null     // hex
  usageCount?: number      // derivado, só em GET /tags
  createdAt: string
}
```

| Método | Rota | Auth |
|---|---|---|
| `GET` | `/api/v1/tags` | público |
| `POST` | `/api/v1/tags` | autenticado |
| `PATCH` | `/api/v1/tags/:id` | autenticado |
| `DELETE` | `/api/v1/tags/:id` | autenticado |

- `GET` aceita `page`, `limit` (`50`, teto `100`) e `q` (busca `ILIKE` no nome,
  para autocomplete). Ordenação `name ASC`. Tag não tem `active`.
- **`usageCount` é derivado e read-only**: quantas notícias usam a tag, contado
  no servidor. O protótipo manda `usageCount` no corpo (`tag-dialog.tsx`) —
  **remova**, senão `422 { "usageCount": "readOnlyField" }`. Vale para `POST` e
  `PATCH`.
- `PATCH` existe (divergindo da especificação original do módulo, que previa só
  `GET`/`POST`/`DELETE`): com `description` e `color` editáveis, "apaga e cria"
  perderia as associações N:N com as notícias.
- `DELETE` remove a tag **e** suas associações; as notícias continuam
  publicadas, só perdem a etiqueta. `404 { "id": "tagNotFound" }` se não existir.

> **Nota honesta de escopo**: o site público **não consome tags em lugar nenhum**
> hoje — não há filtro, página nem exibição de tag. A API está pronta e testada,
> mas construída à frente da demanda, porque a especificação do módulo a prevê.
> Vincular tags na notícia (`tags: [{ id }]`) já funciona; usar isso no portal é
> decisão de produto que ainda não foi tomada.

---

## 7. Capa: upload primeiro, referência depois

O painel hoje guarda `image` como string (`/news/economy.png` ou uma URL colada).
A API não aceita URL em texto: `cover` é **referência a um arquivo do acervo**,
mesmo padrão do `photo` do usuário.

**Fluxo em dois passos**

```ts
// 1) sobe o arquivo (multipart, campo `file`, autenticado)
const form = new FormData()
form.append('file', file)
const { data } = await api.post('files/upload', form)
// data.file = { id: '<uuid>', path: 'https://.../arquivo.png' }

// 2) referencia na notícia
await api.post('news', { title, body, category: { id }, cover: { id: data.file.id } })
```

- `POST /api/v1/files/upload` exige token.
- Na resposta da notícia, `cover.path` **já é a URL pública pronta** para o `src`
  de uma `<img>` — não monte URL por conta própria e não guarde `path` como
  fonte da verdade (guarde o `id`).
- Arquivo inexistente no `cover.id`: `422 { "cover": "imageNotExists" }`.
- Duas notícias **podem** apontar para o mesmo arquivo (reaproveitar imagem do
  acervo é permitido).
- CRUD de acervo (listar/renomear/excluir mídia, campo `alt`, dimensões) **não
  existe ainda** — é a fase de Files. A tela de mídias do protótipo (`features/
  admin/media/`) só tem o upload como contraparte real hoje.

---

## 8. Mapeamento de nomes front ↔ API

| Front (hoje) | API | Observação |
|---|---|---|
| `excerpt` | `summary` | mesmo conteúdo, nome diferente |
| `content` | `body` | markdown |
| `image` | `cover: { id, path }` | ver [§7](#7-capa-upload-primeiro-referência-depois) |
| `author` (string) | `author` (objeto `Author`) | derivado do login |
| `category` (string) | `category` (objeto `Category`) | referência por id |
| `status: "Publicado"` | `status: "published"` | |
| `status: "Rascunho"` | `status: "draft"` | |
| — | `status: "archived"` | **existe na API** e o painel ainda não oferece; é o resultado do `DELETE` |
| `urgent` (campo) | `config.urgent` | convenção, não coluna |
| `position` (campo) | `config.position` | convenção, não coluna |
| ordem no array | `config.positionOrder` | precisa ser explícito na API |
| `time: "há 12 min"` | `publishedAt` (ISO) | agora dá para calcular o relativo de verdade |
| `createdAt` (ISO) | `createdAt` (ISO) | ⚠️ ver ressalva abaixo |

### Ressalva sobre `createdAt`/`updatedAt`

Prefira **`publishedAt`** para exibir data de notícia. Os campos `createdAt` e
`updatedAt` de **todas** as entidades do projeto (não só das novas) são gravados
pelo banco em colunas sem fuso horário e podem sair deslocados algumas horas
quando a API roda com `TZ` diferente de UTC — é um comportamento herdado do
boilerplate, registrado para ser corrigido numa tarefa própria. `publishedAt` não
tem esse problema.

---

## 9. Inconsistências do front para corrigir

Encontradas ao auditar o painel; não foram acomodadas no backend de propósito.

1. **Default `"Geral"` na tela de publicação.**
   `features/admin/news/pages/new-news-page.tsx:38` inicializa a categoria com
   `useState<string>("Geral")` — e `"Geral"` **não existe** na lista de 8
   categorias do próprio front. Não foi criada uma categoria "Geral" no seed para
   acomodar isso: o certo é o formulário começar **sem categoria selecionada**
   (obrigando a escolha) ou com a primeira da lista vinda de `GET /categories`.
   (Cuidado para não confundir com o `"Geral / Nenhuma"` do seletor de posição em
   `articles-page.tsx`, que é o rótulo de `position: "normal"` — esse está certo.)
2. **Rodapé mostra 6 das 8 categorias** (`site-footer.tsx`). É escolha de
   exibição, não problema de dado — mas, ao ligar na API, decida se o rodapé
   corta a lista de propósito ou se deve mostrar todas as ativas.

---

## 10. Novidades em `/users` (travas de admin)

Se o painel tiver tela de usuários, três respostas novas podem aparecer — todas
`422`, todas para evitar que o sistema fique sem nenhum admin (sem admin,
ninguém consegue criar nem promover usuário, e a recuperação só acontece mexendo
no banco à mão):

| Corpo | Quando |
|---|---|
| `{ "id": "cannotDeleteSelf" }` | admin tentou se excluir por `DELETE /users/:id`. O caminho para sair da própria conta é `DELETE /auth/me` |
| `{ "id": "cannotDeleteLastAdmin" }` | tentativa de excluir o último admin (vale para `DELETE /users/:id` e `DELETE /auth/me`) |
| `{ "role": "cannotDemoteLastAdmin" }` | `PATCH /users/:id` tentando trocar a role do último admin para `user` |

Sugestão de UX: desabilitar "excluir" na própria linha da lista e mostrar essas
mensagens traduzidas, em vez de um erro genérico.

---

## 11. Resumo das rotas e dos códigos de erro

### Rotas

| Método | Rota | Auth | Observação |
|---|---|---|---|
| `GET` | `/api/v1/news` | público | `?page&limit&category&tag&status&q`; `status` ignorado sem token |
| `GET` | `/api/v1/news/views` | público | `?ids=` (≤ 100); contagem atual, só publicadas; `no-store` |
| `GET` | `/api/v1/news/:slug` | público | leitura pura; `404` para não publicada |
| `POST` | `/api/v1/news/:id/views` | público | registra uma visita; devolve `{ id, views }` |
| `POST` | `/api/v1/news` | autenticado | autor = usuário logado |
| `PATCH` | `/api/v1/news/:id` | autor ou admin | |
| `DELETE` | `/api/v1/news/:id` | autor ou admin | **arquiva** |
| `GET` | `/api/v1/categories` | público | traz `newsCount`; só ativas sem token |
| `POST` | `/api/v1/categories` | autenticado | |
| `PATCH` | `/api/v1/categories/:id` | autenticado | |
| `DELETE` | `/api/v1/categories/:id` | autenticado | recusa categoria em uso |
| `GET` | `/api/v1/tags` | público | traz `usageCount`; `?q=` para autocomplete |
| `POST` | `/api/v1/tags` | autenticado | |
| `PATCH` | `/api/v1/tags/:id` | autenticado | |
| `DELETE` | `/api/v1/tags/:id` | autenticado | remove associações, preserva notícias |
| `POST` | `/api/v1/files/upload` | autenticado | multipart, campo `file` |

Rotas de auth e autores: ver
[`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md).

### Códigos de erro

Formato sempre `{ "status": 4xx, "errors": { "<campo>": "<código>" } }` — o mesmo
que o login já usa.

| Código | Campo | Significado |
|---|---|---|
| `readOnlyField` | `author`, `views`, `publishedAt`, `newsCount`, `usageCount` | campo derivado do servidor; não envie |
| `configTooLarge` | `config` | JSON acima de 16 KB |
| `slugAlreadyExists` | `slug` | slug em uso — inclui `views`, reservado pela rota `GET /news/views` |
| `idsInvalid` | `ids` | `GET /news/views`: `ids` ausente, vazio ou com item que não é UUID |
| `idsTooMany` | `ids` | `GET /news/views`: mais de 100 ids |
| `nameAlreadyExists` | `name` | nome de categoria/tag em uso |
| `colorInvalidFormat` | `color` | fora de `#rgb`/`#rrggbb` |
| `slugInvalidFormat` | `slug` | fora de `minusculas-com-hifen` |
| `categoryHasNews` | `id` | tentou apagar categoria em uso |
| `categoryNotFound` | `id` | categoria inexistente (`404`) |
| `tagNotExists` | `tags` | id de tag inválido no payload da notícia |
| `tagNotFound` | `id` | tag inexistente (`404`) |
| `newsNotFound` | `id` / `slug` | notícia inexistente ou não publicada (`404`) — inclui `POST /news/:id/views` |
| `imageNotExists` | `cover` | arquivo inexistente |
| `cannotManageAnotherAuthorNews` | `id` | `403`: editar/excluir notícia de outro autor |
| `cannotDeleteSelf` / `cannotDeleteLastAdmin` / `cannotDemoteLastAdmin` | `id` / `role` | travas de admin ([§10](#10-novidades-em-users-travas-de-admin)) |

`401` (sem token / token inválido) e `403` (sem permissão) têm corpo simples —
trate pelo status.
