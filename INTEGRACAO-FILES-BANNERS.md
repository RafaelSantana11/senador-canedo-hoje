# Mapa técnico de integração — Files e Banners

Contrato da API para o frontend consumir. Cobre o **acervo de mídias** (o CRUD de
arquivos, que até agora só tinha upload) e os **banners publicitários** — os dois
últimos módulos da fase de conteúdo.

Complementa o [`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md) e o
[`INTEGRACAO-NEWS-CATEGORIES-TAGS.md`](./INTEGRACAO-NEWS-CATEGORIES-TAGS.md) —
**os fundamentos (base URL, Bearer token, CORS, formato de erro) estão no
primeiro e valem igual aqui**. O segundo já cobria o upload no contexto da capa
de notícia ([§7](./INTEGRACAO-NEWS-CATEGORIES-TAGS.md#7-capa-upload-primeiro-referência-depois));
o que este documento acrescenta é tudo o que vem **depois** do upload.

Swagger interativo (com "Try it out"): `{HOST}/docs`.
Última atualização: 2026-08-21.

---

## Índice

- [0. Leia primeiro: o que quebra o painel atual](#0-leia-primeiro-o-que-quebra-o-painel-atual)
- [1. A tela de Mídias: de URL digitada para upload real](#1-a-tela-de-mídias-de-url-digitada-para-upload-real)
- [2. O objeto `File`](#2-o-objeto-file)
- [3. Rotas de Files](#3-rotas-de-files)
- [4. Excluir arquivo: a regra das três referências](#4-excluir-arquivo-a-regra-das-três-referências)
- [5. A tela de Publicidades: de `Ad` para `Banner`](#5-a-tela-de-publicidades-de-ad-para-banner)
- [6. Os objetos `Banner` e `BannerItem`](#6-os-objetos-banner-e-banneritem)
- [7. Rotas administrativas de Banners](#7-rotas-administrativas-de-banners)
- [8. A entrega pública: `GET /banners/serve`](#8-a-entrega-pública-get-bannersserve)
- [9. Mapeamento de nomes front ↔ API](#9-mapeamento-de-nomes-front--api)
- [10. Nota honesta de escopo](#10-nota-honesta-de-escopo)
- [11. Resumo das rotas e dos códigos de erro](#11-resumo-das-rotas-e-dos-códigos-de-erro)

---

## 0. Leia primeiro: o que quebra o painel atual

O que o painel prototipado em `origin/featAdmin` faz hoje **não** funciona contra
esta API sem ajuste. Em ordem de impacto:

| # | Hoje no painel | Passa a ser | Onde |
|---|---|---|---|
| 1 | Mídia: usuário **digita uma URL** (`media-dialog.tsx`, campo "URL / Caminho da Mídia") | **upload real** — `POST /files/upload` devolve um `id`, e é o `id` que se referencia | [§1](#1-a-tela-de-mídias-de-url-digitada-para-upload-real) |
| 2 | `size: "1.4 MB"` e `dimensions: "1920x1080"` digitados como texto | `sizeBytes: 1468006` e `width`/`height` **números**, vindos do servidor — a formatação é do front | [§2](#2-o-objeto-file) |
| 3 | `type` escolhido num `<Select>` ("Imagem/Vídeo/Documento") | **derivado do `mimeType`**, read-only. Enviar dá `422 readOnlyField` | [§2](#2-o-objeto-file) |
| 4 | Publicidade: `image: "/news/video-2.png"` (URL em texto) | `items: [{ file: { id } }]` — carrossel de arquivos do acervo | [§5](#5-a-tela-de-publicidades-de-ad-para-banner) |
| 5 | `placement: "Topo (Leaderboard)"` (rótulo legível) | `position: "top"` (enum de 4 valores) | [§5](#5-a-tela-de-publicidades-de-ad-para-banner) |
| 6 | `link: "https://..."` na campanha | `linkUrl` **por item** do carrossel, não por campanha | [§6](#6-os-objetos-banner-e-banneritem) |
| 7 | Excluir mídia é sempre possível | **arquivo em uso não pode ser apagado** — `422 fileInUse` | [§4](#4-excluir-arquivo-a-regra-das-três-referências) |

E uma mudança que só afeta ambiente de desenvolvimento:

> ⚠️ **`FILE_DRIVER=local`: a rota que serve o binário mudou** de
> `GET /api/v1/files/:path` para `GET /api/v1/files/download/:path`, porque a
> antiga colidia com o novo `GET /api/v1/files/:id` (as duas são curinga de um
> segmento — quem registrasse primeiro capturava a outra). **O front não precisa
> fazer nada**: `path` continua chegando como URL pronta, e a migration reescreve
> os caminhos já gravados. Só não monte essa URL à mão.

---

## 1. A tela de Mídias: de URL digitada para upload real

A tela prototipada (`features/admin/media/`) trata mídia como um registro de
texto: o usuário digita título, **URL**, tipo, alt, tamanho e dimensões. Nada
disso sobe arquivo nenhum — e nenhum desses valores é verificável.

Contra a API, o fluxo é outro, em **dois passos**:

```ts
// 1) sobe o binário (multipart, campo `file`, autenticado)
const form = new FormData()
form.append('file', file)
// opcionais: o navegador sabe as dimensões antes de enviar
form.append('width', String(img.naturalWidth))
form.append('height', String(img.naturalHeight))

const { data } = await api.post('files/upload', form)
// data.file = { id, path, originalName, mimeType, sizeBytes, width, height, type, ... }

// 2) o metadado editável vem depois, por PATCH
await api.patch(`files/${data.file.id}`, {
  title: 'Fachada do Congresso',
  alt: 'Fachada do Congresso Nacional ao entardecer',
})
```

O que muda campo a campo no formulário de mídia:

| Campo do protótipo | Situação na API |
|---|---|
| `title` | ✅ existe, **editável** por `PATCH /files/:id` |
| `alt` | ✅ existe, **editável** por `PATCH /files/:id` |
| `url` (digitado) | ❌ vira o **upload**. O que se guarda é o `id`; `path` é derivado e read-only |
| `type` (`<Select>`) | ❌ **derivado do `mimeType`**. Tire o seletor do formulário — enviar dá `422 readOnlyField` |
| `size` (`"1.4 MB"`) | ❌ vira `sizeBytes` (número, do servidor). Formate na exibição |
| `dimensions` (`"1920x1080"`) | ❌ vira `width` e `height` (números separados) |
| — | ➕ `originalName`, `mimeType`, `uploadedBy`, `createdAt` são novos e read-only |

**Limites do upload** (já valiam antes): só `jpg`, `jpeg`, `png`, `gif`, máximo
**5 MB**, token obrigatório. Arquivo fora disso dá
`422 { "file": "cantUploadFileType" }`; acima do limite, `413`.

### Sobre `width`/`height` serem opcionais

O servidor **não lê o binário** para descobrir dimensão — isso exigiria uma
dependência de processamento de imagem, e nos drivers de produção o backend nem
chega a ver os bytes (o `multer-s3` transmite direto para o bucket; no fluxo
pré-assinado o navegador envia sem passar pela API). Por isso `width`/`height`
são **declarados pelo cliente** no upload e ficam `null` quando não enviados.

No navegador sai de graça:

```ts
const bitmap = await createImageBitmap(file)
form.append('width', String(bitmap.width))
form.append('height', String(bitmap.height))
```

Não enviar não quebra nada — só deixa as duas colunas nulas. E, uma vez enviados,
não podem ser editados por `PATCH` (lá não haveria binário com que conferir).

---

## 2. O objeto `File`

```ts
type File = {
  id: string                  // uuid — é ISTO que se referencia em cover/photo/items
  path: string                // URL pública PRONTA para o src de uma <img>
  type: 'image' | 'video' | 'document' | null   // derivado do mimeType
  originalName: string | null
  mimeType: string | null     // ex.: "image/png"
  sizeBytes: number | null    // BYTES, número — não string formatada
  width: number | null        // pixels, declarado no upload
  height: number | null
  title: string | null        // editável
  alt: string | null          // editável
  uploadedBy?: {              // só em rota autenticada de acervo (ver abaixo)
    id: string
    slug: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}
```

Três avisos que economizam depuração:

1. **`path` já é a URL final.** Não concatene host, não guarde `path` como fonte
   da verdade — guarde o `id`. Trocar de storage/CDN muda `path` sem avisar.
2. **`type` é `null` para o acervo antigo.** Arquivos enviados antes desta fase
   não têm `mimeType` gravado (não havia coluna). Eles continuam funcionando;
   apenas aparecem sem tipo e **não** são retornados por `?type=image`. Se a tela
   filtra por tipo, trate `null` como "outros/desconhecido".
3. **`uploadedBy` só aparece nas rotas autenticadas do acervo** (`GET /files`,
   `GET /files/:id`, `PATCH /files/:id`). Dentro de `news.cover`, de `user.photo`
   e da entrega pública de banners, a propriedade **não vem** — é deliberado, não
   é bug: é dado administrativo e a rota pública de notícias não deve carregá-lo.

---

## 3. Rotas de Files

| Método | Rota | Auth | Observação |
|---|---|---|---|
| `POST` | `/api/v1/files/upload` | autenticado | multipart, campo `file` + `width`/`height` opcionais |
| `GET` | `/api/v1/files` | autenticado | acervo paginado |
| `GET` | `/api/v1/files/:id` | autenticado | `:id` **precisa ser uuid** |
| `PATCH` | `/api/v1/files/:id` | autenticado | só `title` e `alt` |
| `DELETE` | `/api/v1/files/:id` | autenticado | ver [§4](#4-excluir-arquivo-a-regra-das-três-referências) |

Qualquer usuário autenticado do painel gerencia o acervo — não é privilégio de
admin (só administração de *usuários* é).

### `GET /files`

Params: `page` (`1`), `limit` (`20`, teto `50`), `type`
(`image`/`video`/`document`), `q` (busca `ILIKE` em `originalName` **e** `title`).
Ordenação: `createdAt DESC`.

Resposta no mesmo formato de paginação das outras listagens:

```json
{ "data": [ /* File[] */ ], "hasNextPage": true }
```

### `PATCH /files/:id`

Aceita **exatamente dois** campos:

```json
{ "title": "Fachada do Congresso", "alt": "Fachada ao entardecer" }
```

Qualquer outro campo do `File` é derivado e responde
`422 { "<campo>": "readOnlyField" }` — vale para `path`, `type`, `originalName`,
`mimeType`, `sizeBytes`, `width`, `height` e `uploadedBy`. É recusa, não silêncio:
mandar `sizeBytes` e receber `200` faria o painel acreditar que gravou.

### `GET /files/:id` exige uuid

`:id` é validado como uuid; qualquer outra coisa responde **`400`**. Isso é o que
mantém a rota do acervo separada do serving de binário do driver `local`
(`/files/download/:path`), sem depender de ordem de registro.

---

## 4. Excluir arquivo: a regra das três referências

`DELETE /api/v1/files/:id` apaga **de verdade** — o registro no banco e o objeto
no storage. Não há soft delete de arquivo, e não há "lixeira".

Por isso existe uma trava: **um arquivo em uso não pode ser apagado**. Hoje três
coisas referenciam um arquivo, e as três são checadas:

| Quem usa | Campo |
|---|---|
| Notícia | `cover` |
| Usuário | `photo` |
| Item de banner | `items[].file` |

Resposta quando o arquivo está em uso:

```json
{
  "status": 422,
  "errors": { "id": "fileInUse" },
  "usedBy": { "news": 2, "users": 0, "banners": 1 }
}
```

O código do erro continua no formato de sempre (`errors.<campo>`); o `usedBy` vem
**ao lado**, com a contagem por origem, para o painel poder dizer onde.

### Como exibir isso

Não mostre "erro ao excluir". Monte a frase a partir do `usedBy`:

```ts
const partes: string[] = []
if (usedBy.news)    partes.push(`${usedBy.news} notícia(s)`)
if (usedBy.users)   partes.push(`${usedBy.users} usuário(s)`)
if (usedBy.banners) partes.push(`${usedBy.banners} banner(s)`)

toast.error(
  `Esta imagem está em uso em ${partes.join(', ')} e não pode ser excluída. ` +
  `Troque a imagem nesses lugares antes de apagá-la.`
)
```

O caminho para liberar o arquivo é sempre o mesmo: **remover a referência**
(trocar a capa da notícia, trocar a foto do usuário, tirar o item do carrossel ou
apagar a campanha). Feito isso, o `DELETE` passa.

> Notícia **arquivada** e usuário **excluído** ainda contam: o vínculo continua no
> banco. Isso é intencional — se não contassem, o `DELETE` passaria pela regra e
> morreria numa violação de chave estrangeira, devolvendo `500` em vez de uma
> mensagem exibível.

---

## 5. A tela de Publicidades: de `Ad` para `Banner`

A tela prototipada (`features/admin/ads/`) modela uma campanha como **uma
imagem só**:

```ts
type Ad = { id, title, advertiser, image, link, placement, active, createdAt }
```

Na API, uma campanha é **um carrossel**: um `Banner` com N `BannerItem`. Um `Ad`
do protótipo vira **um `Banner` com exatamente um `BannerItem`** — o modelo
suporta mais, o front ainda não precisa usar.

### Mapeamento de `placement` → `position`

O protótipo usa rótulos legíveis; a API usa um enum de **quatro** valores.
Guarde o enum e mostre o rótulo:

| Protótipo (`placement`) | API (`position`) |
|---|---|
| `"Topo (Leaderboard)"` | `top` |
| `"Lateral (Box)"` | `aside` |
| `"Rodapé"` | `bottom` |
| _(não existe no protótipo)_ | `middle` |

`middle` existe no modelo desde a especificação do projeto e não tem rótulo no
front — decida se a tela passa a oferecê-lo (algo como "Meio do conteúdo") ou se
fica fora do seletor por enquanto.

### Campo a campo

| Campo do protótipo | Situação na API |
|---|---|
| `title` | ✅ igual |
| `advertiser` | ✅ igual (texto livre, opcional) — **não** há cadastro de anunciantes |
| `active` | ✅ igual (default `true`) |
| `placement` | ❌ vira `position` (enum). Enviar `placement` dá `422 readOnlyField` |
| `image` (URL em texto) | ❌ vira `items: [{ file: { id } }]`. Enviar `image` dá `422 readOnlyField` |
| `link` | ❌ vira `items[].linkUrl` — é **por item**, não por campanha. Enviar `link` dá `422 readOnlyField` |
| — | ➕ `items[].durationMs` (tempo em tela) e `items[].order` (ordem no carrossel) |

Os três campos antigos são **recusados**, não ignorados, justamente para o painel
não achar que salvou a imagem.

### O que **não** existe (e não está previsto)

- **Agendamento**: não há data de início/fim de campanha. `active` é o único
  controle.
- **Métricas**: não há contagem de impressões nem de cliques.
- **Cadastro de anunciantes**: `advertiser` é uma string na campanha.

---

## 6. Os objetos `Banner` e `BannerItem`

```ts
type Banner = {
  id: string
  title: string
  advertiser: string | null
  position: 'top' | 'middle' | 'aside' | 'bottom'
  active: boolean
  items: BannerItem[]        // já em order ASC
  createdAt: string
  updatedAt: string
}

type BannerItem = {
  id: string
  file: File                 // objeto completo (§2), com o path já em URL pública
  durationMs: number         // MILISSEGUNDOS em tela — default 5000
  linkUrl: string | null     // destino do clique
  order: number              // posição no carrossel
}
```

Detalhes que valem lembrar:

- **`durationMs` é milissegundo**, não segundo — é a unidade de `setInterval` e
  das libs de slider, para não sobrar conversão no consumo. Aceita de `500` a
  `300000`.
- **`order` é explícito.** Omitir num item faz ele cair para o **índice no array
  enviado**, ou seja, a ordem em que o painel montou a lista. Reordenar é mandar
  a lista de novo com outros `order` — não é preciso recriar item.
- O `alt` da imagem mora no **arquivo** (`file.alt`), não no item. Um mesmo
  arquivo reaproveitado em duas campanhas carrega o mesmo texto alternativo.

---

## 7. Rotas administrativas de Banners

| Método | Rota | Auth |
|---|---|---|
| `GET` | `/api/v1/banners` | autenticado |
| `GET` | `/api/v1/banners/:id` | autenticado |
| `POST` | `/api/v1/banners` | autenticado |
| `PATCH` | `/api/v1/banners/:id` | autenticado |
| `DELETE` | `/api/v1/banners/:id` | autenticado |

`GET /banners` aceita `page` (`1`), `limit` (`20`, teto `50`), `position` e
`active` (`true`/`false`). Ordenação: `createdAt DESC`.

### `POST /banners`

```json
{
  "title": "Campanha Black Friday",
  "advertiser": "AutoMax",
  "position": "top",
  "active": true,
  "items": [
    {
      "file": { "id": "cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae" },
      "durationMs": 4000,
      "linkUrl": "https://automax.com.br/black-friday",
      "order": 0
    }
  ]
}
```

Só `title` e `position` são obrigatórios. `items` pode vir vazio (campanha em
montagem). Arquivo inexistente em qualquer item:
`422 { "items": "imageNotExists" }`.

### `PATCH /banners/:id`: `items` substitui a lista inteira

Mesma semântica de `tags` em News, que o front já conhece:

| Payload | Efeito |
|---|---|
| `items` **omitido** | mantém o carrossel atual |
| `items: [ ... ]` | **substitui** a lista inteira pela enviada |
| `items: []` | esvazia o carrossel |

Não existe rota para adicionar/remover um item isolado — o carrossel é
gerenciado junto da campanha, num payload só. É o que evita estado meio-salvo no
painel ("a imagem subiu, mas a campanha não").

### `DELETE /banners/:id`

Apaga a campanha **e seus itens**. Os **arquivos permanecem no acervo** — e
voltam a ser excluíveis, se nada mais os referenciar. Responde `204`;
`404 { "id": "bannerNotFound" }` se não existir.

---

## 8. A entrega pública: `GET /banners/serve`

É a rota que o **portal** consome. Pública, sem token.

```
GET /api/v1/banners/serve
GET /api/v1/banners/serve?positions=top,aside
```

Sem `positions`, devolve as quatro. A resposta é um mapa **posição → lista**:

```json
{
  "top": [
    {
      "image": {
        "id": "cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae",
        "path": "https://cdn.exemplo.com/a1b2c3.png",
        "type": "image",
        "mimeType": "image/png",
        "alt": "Anúncio AutoMax — SUV 2026",
        "width": 1200,
        "height": 300
      },
      "alt": "Anúncio AutoMax — SUV 2026",
      "linkUrl": "https://automax.com.br/black-friday",
      "durationMs": 4000
    }
  ],
  "aside": []
}
```

Quatro garantias desta rota:

1. **Achata as campanhas.** Se houver três banners ativos em `top`, os itens dos
   três vêm numa lista só, ordenada por `order` — inclusive intercalados entre
   campanhas. O portal roda **um carrossel por posição** e não precisa saber que
   existem campanhas por trás.
2. **Só banner `active`.** Desativar uma campanha a tira do ar imediatamente.
3. **Posição vazia devolve `[]`, nunca `404`.** Vitrine sem anúncio não é erro —
   não trate como falha, apenas não renderize o espaço (ou renderize o
   placeholder).
4. **Não vem dado administrativo.** Nada de `advertiser`, `active`, id da
   campanha ou `uploadedBy`. Se a tela precisar de algum desses, ela é
   administrativa e deve usar `GET /banners` com token.

Posição desconhecida é **recusada**, não ignorada:
`?positions=lateral` → `422 { "positions": "positionsInvalid" }`. Ignorar em
silêncio faria o portal concluir que não há anúncio quando o nome só estava
errado.

### Esboço de consumo

```tsx
const { data } = await api.get('banners/serve', { params: { positions: 'top,aside' } })

// carrossel simples de uma posição
function BannerCarousel({ items }: { items: PublicBannerItem[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (items.length < 2) return
    const t = setTimeout(() => setI((v) => (v + 1) % items.length), items[i].durationMs)
    return () => clearTimeout(t)
  }, [i, items])

  if (!items.length) return null            // posição vazia: não renderize
  const item = items[i]
  const img = <img src={item.image.path} alt={item.alt ?? ''} />
  return item.linkUrl
    ? <a href={item.linkUrl} target="_blank" rel="noreferrer sponsored">{img}</a>
    : img
}
```

---

## 9. Mapeamento de nomes front ↔ API

### Mídias (`Media` → `File`)

| Front (hoje) | API | Observação |
|---|---|---|
| `url` | `path` | read-only; guarde o `id`, não o `path` |
| `type` | `type` | **derivado do `mimeType`**, não editável |
| `size: "1.4 MB"` | `sizeBytes: 1468006` | número em bytes; formate na exibição |
| `dimensions: "1920x1080"` | `width` / `height` | dois números |
| `title`, `alt` | `title`, `alt` | os únicos editáveis |
| — | `originalName`, `mimeType`, `uploadedBy` | novos, read-only |

### Publicidades (`Ad` → `Banner`)

| Front (hoje) | API | Observação |
|---|---|---|
| `image` | `items[].file.id` | referência ao acervo |
| `link` | `items[].linkUrl` | por item, não por campanha |
| `placement` | `position` | rótulo → enum, ver [§5](#5-a-tela-de-publicidades-de-ad-para-banner) |
| `advertiser`, `title`, `active` | iguais | |
| — | `items[].durationMs`, `items[].order` | novos |

---

## 10. Nota honesta de escopo

**O portal público ainda não consome banners.**
`components/news/ad-banner.tsx` é um placeholder estático: renderiza uma caixa
tracejada com "Publicidade / Anuncie aqui" e não busca nada. A API está pronta e
testada, mas construída **à frente do consumo** — a mesma situação de Tags na
fase anterior.

Ligar o portal é substituir aquele componente por um que consuma
`GET /banners/serve` (esboço no [§8](#8-a-entrega-pública-get-bannersserve)),
mantendo o placeholder atual como estado vazio. É trabalho de front, não de API,
e é decisão de produto quando fazer.

Do lado do painel, o oposto: **a tela de mídias e a de publicidades existem no
protótipo e são incompatíveis com esta API** — ver [§1](#1-a-tela-de-mídias-de-url-digitada-para-upload-real)
e [§5](#5-a-tela-de-publicidades-de-ad-para-banner). Essas duas precisam de
ajuste antes de sair do `localStorage`.

---

## 11. Resumo das rotas e dos códigos de erro

### Rotas

| Método | Rota | Auth | Observação |
|---|---|---|---|
| `POST` | `/api/v1/files/upload` | autenticado | multipart, campo `file`; `width`/`height` opcionais |
| `GET` | `/api/v1/files` | autenticado | `?page&limit&type&q`; `createdAt DESC` |
| `GET` | `/api/v1/files/:id` | autenticado | `:id` uuid, senão `400` |
| `PATCH` | `/api/v1/files/:id` | autenticado | só `title` e `alt` |
| `DELETE` | `/api/v1/files/:id` | autenticado | recusa arquivo em uso; `204` quando apaga |
| `GET` | `/api/v1/files/download/:path` | público | **só no driver `local`** (dev); não monte esta URL à mão |
| `GET` | `/api/v1/banners/serve` | **público** | `?positions=top,aside`; entrega do portal |
| `GET` | `/api/v1/banners` | autenticado | `?page&limit&position&active` |
| `GET` | `/api/v1/banners/:id` | autenticado | |
| `POST` | `/api/v1/banners` | autenticado | itens aninhados |
| `PATCH` | `/api/v1/banners/:id` | autenticado | `items` substitui a lista |
| `DELETE` | `/api/v1/banners/:id` | autenticado | apaga campanha e itens; arquivos ficam |

### Códigos de erro

Formato sempre `{ "status": 4xx, "errors": { "<campo>": "<código>" } }` — o mesmo
das fases anteriores. `DELETE /files/:id` acrescenta um `usedBy` **ao lado** de
`errors` (ver [§4](#4-excluir-arquivo-a-regra-das-três-referências)).

| Código | Campo | Significado |
|---|---|---|
| `fileInUse` | `id` | `422`: arquivo referenciado por notícia, usuário ou banner. Vem com `usedBy` |
| `fileNotFound` | `id` | `404`: arquivo inexistente |
| `readOnlyField` | `path`, `type`, `originalName`, `mimeType`, `sizeBytes`, `width`, `height`, `uploadedBy` | campo derivado do servidor; não envie no `PATCH /files/:id` |
| `readOnlyField` | `image`, `link`, `placement` | campos do protótipo de publicidade que não existem na API |
| `titleInvalid` / `titleTooLong` / `altInvalid` / `altTooLong` | `title`, `alt` | validação de metadado (`title` ≤ 260, `alt` ≤ 1000) |
| `widthInvalid` / `heightInvalid` | `width`, `height` | no upload: precisa ser inteiro entre 1 e 100000 |
| `cantUploadFileType` | `file` | extensão fora de jpg/jpeg/png/gif |
| `selectFile` | `file` | upload sem arquivo |
| `imageNotExists` | `items` | id de arquivo inválido no payload do banner |
| `bannerNotFound` | `id` | `404`: campanha inexistente |
| `positionInvalid` | `position` | fora de `top`/`middle`/`aside`/`bottom` |
| `positionsInvalid` | `positions` | posição desconhecida em `GET /banners/serve` |
| `titleRequired` / `titleTooLong` | `title` | campanha sem título ou acima de 200 caracteres |
| `durationMsInvalid` | `durationMs` | fora de 500–300000 ms |
| `orderInvalid` | `order` | não é inteiro ≥ 0 |
| `linkUrlTooLong` | `linkUrl` | acima de 2048 caracteres |
| `advertiserTooLong` | `advertiser` | acima de 200 caracteres |
| `activeInvalid` | `active` | não é booleano |

`413` (arquivo acima de 5 MB), `400` (id fora do formato uuid), `401` (sem token)
e `403` (sem permissão) têm corpo simples — trate pelo status.
