# Mapa técnico de integração — Parâmetros do Portal (Settings)

Contrato **entregue** do módulo de settings do portal: `GET`/`PATCH /api/v1/settings`
e `POST /api/v1/settings/reset`, com os 13 parâmetros e o e-mail de contato
([§4](#4-e-mail-de-contato)). Descreve também o que a tela
`frontend/src/features/admin/settings/pages/params-page.tsx`
(rota `/admin/configuracoes/parametros`) faz **hoje** — ver
[§0](#0-leia-primeiro-o-que-a-tela-faz-hoje).

Complementa o [`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md),
o [`INTEGRACAO-NEWS-CATEGORIES-TAGS.md`](./INTEGRACAO-NEWS-CATEGORIES-TAGS.md) e o
[`INTEGRACAO-FILES-BANNERS.md`](./INTEGRACAO-FILES-BANNERS.md) — **os fundamentos
(base URL, Bearer token, CORS, formato de erro, upload) estão neles e valem igual
aqui**.

⚠️ **A API está pronta, mas o front ainda não a consome.** Diferente dos outros
três documentos, que já descreviam contratos em uso, este chegou a descrever uma
API que ainda não existia — a partir desta entrega ela existe (é o que este
documento descreve), mas `params-page.tsx` continua lendo `lib/portal-params.ts` +
`localStorage`, sem nenhuma chamada a `settings` ([§0](#0-leia-primeiro-o-que-a-tela-faz-hoje)).
A integração do front fica para uma spec própria, à parte.

Última atualização: 2026-09-14 (backend entregue: `GET`/`PATCH`/`reset` de
`settings`, com o e-mail de contato do [§4](#4-e-mail-de-contato)).

---

## Índice

- [0. Leia primeiro: o que a tela faz hoje](#0-leia-primeiro-o-que-a-tela-faz-hoje)
- [1. Inventário: os 13 parâmetros que precisam ser persistidos](#1-inventário-os-13-parâmetros-que-precisam-ser-persistidos)
- [2. Contrato entregue](#2-contrato-entregue)
- [3. Identidade visual e o logo](#3-identidade-visual-e-o-logo)
- [4. E-mail de contato](#4-e-mail-de-contato)
- [5. Validação de valores](#5-validação-de-valores)
- [6. Quem consome cada parâmetro](#6-quem-consome-cada-parâmetro)
- [7. Parâmetros de paginação desativados na UI](#7-parâmetros-de-paginação-desativados-na-ui)
- [8. Comportamento atual dos botões Salvar e Restaurar](#8-comportamento-atual-dos-botões-salvar-e-restaurar)
- [9. Decisões tomadas](#9-decisões-tomadas)
- [10. Resumo das rotas e códigos de erro](#10-resumo-das-rotas-e-códigos-de-erro)

---

## 0. Leia primeiro: o que a tela faz hoje

A tela renderiza os parâmetros a partir do metadado `PARAM_META` (label,
descrição, grupo, tipo, `min`/`max`) e dos valores default de
`frontend/src/lib/portal-params.ts`. O que **não** existe é persistência no
servidor.

| # | Hoje no painel | Precisa passar a ser | Onde |
|---|---|---|---|
| 1 | Valores vêm de `lib/portal-params.ts`, **constantes de build** | vêm de `GET /settings` em runtime, com os defaults como fallback | [§2](#2-contrato-entregue) |
| 2 | "Salvar alterações" grava a identidade no `localStorage` (chave `portal-site-identity`) e os demais parâmetros **só em `useState`** | `PATCH /settings`. Hoje os 8 parâmetros numéricos/texto somem no F5; a identidade persiste apenas no browser de quem salvou | [§8](#8-comportamento-atual-dos-botões-salvar-e-restaurar) |
| 3 | O toast diz, com todas as letras, "os valores estão ativos **nesta sessão do browser**" | persistência real no servidor | [§8](#8-comportamento-atual-dos-botões-salvar-e-restaurar) |
| 4 | Logo é uma **URL em texto** (`LOGO_URL`) devolvida pelo `POST /files/upload` | referência ao arquivo (`{ id, path }`), para não quebrar quando a mídia for excluída do acervo | [§3](#3-identidade-visual-e-o-logo) |
| 5 | "Restaurar padrões" só desfaz no browser | endpoint/semântica de reset definida no servidor | [§2](#2-contrato-entregue) |
| 6 | **Não existe e-mail de contato** — nem no painel, nem no portal | `CONTACT_EMAIL` em `GET`/`PATCH /settings`; por padrão, o e-mail do admin do painel, podendo ser trocado | [§4](#4-e-mail-de-contato) |

Ponto importante: **nada disso é lido do servidor hoje**. A home, o header, o
footer e o painel importam as constantes de `lib/portal-params.ts` em tempo de
build (ver [§6](#6-quem-consome-cada-parâmetro)). Ou seja, mesmo que o backend
crie um `GET /settings` amanhã, o portal só passa a refletir os valores quando o
front trocar os imports pelas chamadas da API.

---

## 1. Inventário: os 13 parâmetros que precisam ser persistidos

São as chaves de `PARAM_META` em
`features/admin/settings/pages/params-page.tsx` (a UI renderiza uma por chave) e
os defaults de `lib/portal-params.ts` — mais o `CONTACT_EMAIL`, que é novo e
ainda não existe em nenhum dos dois (ver [§4](#4-e-mail-de-contato)):

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
| `CONTACT_EMAIL` | string (\*\*) | e-mail do admin do painel, **resolvido no servidor** | — | Rodapé do site |
| `SITE_NAME` | string | `"Senador Canedo Hoje"` | — | Identidade Visual |
| `LOGO_URL` / `LOGO` | string (\*) | `""` | — | Identidade Visual |
| `LOGO_ALT` | string | `"Senador Canedo Hoje"` | — | Identidade Visual |
| `SHOW_NAME_WITH_LOGO` | boolean | `false` | — | Identidade Visual |

(\*) `SHOW_NAME_WITH_LOGO` **não está** no `PARAM_META`: é renderizado como
checkbox fixo na seção "Identidade Visual", mas é salvo junto com os demais.

(\*\*) `CONTACT_EMAIL` é o único parâmetro cujo default **não é constante**: é o
e-mail de um usuário do banco, lido a cada requisição. Por isso ele não pode
entrar em `lib/portal-params.ts` como os demais — o front não tem como saber o
default sem perguntar ao servidor. Regras completas em [§4](#4-e-mail-de-contato).

Os nomes são os que o front já usa como chaves de objeto. O backend pode
adotar outro esquema (ex.: `snake_case`, colunas tipadas), desde que o `GET` e o
`PATCH` exponham um objeto **plano e estável** — ver [§2](#2-contrato-entregue).

---

## 2. Contrato entregue

### Rotas

| Método | Rota | Auth | Papel |
|---|---|---|---|
| `GET` | `/api/v1/settings` | **público** | portal lê os parâmetros (home, header, footer) |
| `PATCH` | `/api/v1/settings` | autenticado, **só admin** | painel grava; corpo parcial |
| `POST` | `/api/v1/settings/reset` | autenticado, **só admin** | "Restaurar padrões" |

**`GET /settings` é público.** A home é renderizada para visitante anônimo, e a
rota não exige token. **Escrita é restrita a admin** — diverge de News/Categories/
Tags/Banners, que qualquer autenticado administra: parâmetro é global e muda o
site para todos os visitantes de uma vez só.

### Response do `GET /settings`

O servidor devolve **todas as chaves, sempre**, mesclando o que está no banco
sobre os defaults de código. O front nunca lida com objeto parcial nem precisa
saber o default de cada chave.

Anônimo (15 chaves — sem `updatedBy`):

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
  "CONTACT_EMAIL": "admin@exemplo.com.br",
  "SITE_NAME": "Senador Canedo Hoje",
  "LOGO": { "id": "<uuid>", "path": "https://.../logo.png", "mimeType": "image/png", "type": "image" },
  "LOGO_ALT": "Senador Canedo Hoje",
  "SHOW_NAME_WITH_LOGO": false,
  "contactEmailIsDefault": true,
  "updatedAt": "2026-09-12T12:00:00.000Z"
}
```

Com token válido, ganha uma 16ª chave, `updatedBy`: `{ "id": 1, "name": "Douglas" }`
— quem gravou por último (por qualquer admin, não necessariamente quem está lendo).
Token ausente ou inválido: a chave fica **ausente** do JSON (não `null`).
`updatedAt` é público e serve de sinal de revalidação para o front; é `null`
enquanto nenhuma chave foi gravada (tabela vazia = tudo default).

Regras:

- **Tipos estáveis**: `number` volta como número, `boolean` como boolean. Nunca
  string (`"8"`, `"false"`) — o front compara e exibe o valor cru nos inputs e no
  `isDirty`.
- `updatedAt`/`updatedBy`/`contactEmailIsDefault` são **read-only** (metadado).
  Mandá-los no `PATCH` dá `422 readOnlyField`, no mesmo espírito dos outros
  módulos.
- `LOGO` é um objeto recortado do acervo — `{ id, path, mimeType, type }` — não
  achatado em `LOGO_URL`/`LOGO_ID`; `null` quando não há logo configurado. Sem
  `originalName`, `sizeBytes`, `uploadedBy` (ver [§3](#3-identidade-visual-e-o-logo)).
  `LOGO_URL` **não existe** no contrato — enviá-lo no `PATCH` é `unknownSetting`.

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

- Chave **desconhecida**: `422 { "errors": { "FOO": "unknownSetting" } }` — pega
  typo (e o `LOGO_URL` antigo), em vez de ignorar em silêncio.
- Tipo errado / fora da faixa: `422` com código por campo (ver
  [§5](#5-validação-de-valores)).
- `null` explícito tem **significado por chave**: em `LOGO` remove o logo; em
  `CONTACT_EMAIL` apaga a personalização e volta a seguir o e-mail do admin (ver
  [§4](#4-e-mail-de-contato)). Nas demais chaves, `null` é `422 invalidType`.
- Corpo que não é um objeto (ex.: array) → `422 { "errors": { "settings": "invalidType" } }`.
- **Validação atômica**: tudo é validado antes de gravar; todos os erros voltam
  juntos num único `422`; uma chave inválida recusa a requisição inteira (nada é
  gravado, nem as chaves válidas do mesmo corpo). `PATCH {}` → `200` sem gravar
  nada.
- Resposta: o objeto completo já atualizado (mesmo shape do `GET` autenticado,
  com `updatedBy`), para o front atualizar o cache sem um segundo request.

### Reset

`POST /settings/reset` — volta **todas** as chaves aos defaults de código
(inclusive `SITE_NAME`, `LOGO` e `CONTACT_EMAIL`, que volta a seguir o admin) e
responde `200` com o objeto completo (`updatedBy` = quem resetou).

O botão "Restaurar padrões" já existe no painel e está habilitado apenas quando
há alteração local (`isDirty`); a integração do front deve trocá-lo por esta
chamada — idealmente com confirmação, já que o reset afeta todos os editores e
todos os visitantes de uma vez.

### Armazenamento

Resolvido internamente como tabela chave/valor (`setting`) mais um registro de
chaves em código com tipo, faixa e default — detalhe de implementação que não
muda o contrato acima. Ver a resposta completa em [§9](#9-decisões-tomadas) (item 1).

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
  aviso. Por isso `LOGO` é a **quarta** referência de `DELETE /files/:id`, junto
  de notícia, usuário e banner (`INTEGRACAO-FILES-BANNERS.md §4`).

**Entregue**: `LOGO: { id: "<uuid>" } | null` como referência, no mesmo padrão
de `cover`/`photo`. O `GET` devolve o recorte `{ id, path, mimeType, type }`
resolvido a partir do acervo — ver [§2](#2-contrato-entregue). O front passa a
guardar o `id` e a usar `path` só para o `src`; trocar de logo vira um
`PATCH { "LOGO": { "id": "..." } }`. O eco `{ id, path }` que o painel recebeu de
volta é aceito no `PATCH` (o `path` é descartado). `LOGO_URL` **não existe** no
contrato — enviá-lo é `422 unknownSetting`.

**SVG**: hoje não é aceito (nem no front, nem no back). Logo de portal costuma
ser SVG; se for para aceitar, o backend precisa liberar `image/svg+xml`
explicitamente e considerar sanitização (SVG carrega script). Decisão em
[§9](#9-decisões-tomadas).

Dimensões (`width`/`height`) **não são necessárias** para o logo — diferente de
mídia de notícia, não há layout dependente disso. O upload atual nem as envia.

---

## 4. E-mail de contato

Parâmetro novo. Hoje **não existe e-mail de contato em lugar nenhum do front**:
nem em `lib/portal-params.ts`, nem no `PARAM_META`, nem em componente do portal
(o "entre em contato" do rodapé abre o WhatsApp). O objetivo é o leitor ter um
endereço para falar com a administração do site.

### Regra de negócio

- **Padrão**: o e-mail do **admin do painel**.
- **Personalizável**: o admin pode trocar por outro endereço (ex.:
  `contato@senadorcanedohoje.com.br`) e, depois, voltar ao padrão.
- Fica **junto dos demais parâmetros**, no front e no back: mesma tela, mesmo
  `GET`/`PATCH /settings`. Não é rota nem tela própria.

**Quem é "o admin do painel"**: o usuário **mais antigo** (menor `id`) com role
`admin`, não excluído e com e-mail preenchido. Na prática é o admin criado pelo
seed (`ADMIN_EMAIL`); a regra só existe para desempatar quando houver mais de
um admin.

O padrão é **resolvido a cada leitura**, não copiado para settings:

- se o admin trocar o próprio e-mail (`PATCH /auth/me`), o contato acompanha sem
  ninguém mexer nos parâmetros;
- se esse admin for excluído, o padrão passa para o próximo admin mais antigo.

Copiar o `ADMIN_EMAIL` do `.env` para o banco foi descartado: congelaria o
endereço no valor do deploy e deixaria de acompanhar a troca de e-mail do admin.

### `GET /settings`

Devolve sempre o **valor efetivo** e um metadado dizendo de onde ele veio:

```json
{
  "CONTACT_EMAIL": "admin@exemplo.com.br",
  "contactEmailIsDefault": true
}
```

| Situação | `CONTACT_EMAIL` | `contactEmailIsDefault` |
|---|---|---|
| Nunca personalizado | e-mail do admin do painel | `true` |
| Personalizado | o endereço gravado | `false` |
| Nenhum admin com e-mail (não deveria acontecer: a API impede remover o último admin) | `null` | `true` |

- O **portal** só precisa de `CONTACT_EMAIL`, pronto para `mailto:`. Não precisa
  saber que existe um admin por trás. Se vier `null`, esconder o contato.
- O **painel** usa `contactEmailIsDefault` para indicar "padrão: e-mail do
  administrador" e para decidir se mostra a ação de voltar ao padrão.
- `contactEmailIsDefault` é **read-only**: enviar no `PATCH` dá
  `422 readOnlyField`, como `updatedAt`/`updatedBy`.

### `PATCH /settings`

| Corpo | Efeito |
|---|---|
| `{ "CONTACT_EMAIL": "contato@exemplo.com.br" }` | grava o endereço personalizado (normalizado: sem espaços nas pontas, minúsculas) |
| `{ "CONTACT_EMAIL": null }` | apaga a personalização e **volta a seguir o e-mail do admin** |
| `{ "CONTACT_EMAIL": "" }` | `422 emailInvalidFormat` — string vazia **não** é "voltar ao padrão"; para isso, `null` |

- Atenção à diferença com o `LOGO`: lá `null` significa "sem logo"; aqui `null`
  significa "padrão". Não existe o estado "sem e-mail de contato" configurável
  pelo painel.
- Gravar explicitamente o **mesmo endereço do admin** conta como personalização
  (`contactEmailIsDefault: false`): o valor fica fixo e deixa de acompanhar uma
  troca futura de e-mail do admin. Para seguir o admin, mande `null`.
- O reset ([§2](#reset)) também volta o contato para o padrão.

### ⚠️ Exposição do e-mail do admin

`GET /settings` é público. Com o padrão, o **e-mail de login do admin** fica
visível para qualquer visitante — no portal e na própria API. É o comportamento
pedido, mas esse é o endereço que, junto com a senha, abre o painel: vira alvo
de phishing e de tentativa de login. Recomendação para produção: cadastrar um
endereço dedicado de contato logo após o deploy.

---

## 5. Validação de valores

O que o front garante hoje é fraco e **não deve ser a única barreira**:

- Os `min`/`max` dos inputs são atributos HTML: ajudam nas setas, mas não
  impedem digitar/salvar fora da faixa.
- `handleChange` só faz `parseInt`; strings livres (nome, WhatsApp) passam sem
  validação nenhuma.
- O botão "Salvar" só exige `isDirty` (qualquer diferença local).

Portanto, a validação de faixa e formato é **do servidor** — esta é a validação
efetivamente implementada:

| Chave | Regra | Código de erro |
|---|---|---|
| `MIN_NEWS_FOR_MIDDLE_BANNER` | inteiro, 1–50 | `invalidType`, `valueOutOfRange` |
| `BANNER_INTERVAL` | inteiro, 2–20 | `invalidType`, `valueOutOfRange` |
| `HERO_SECONDARY_COUNT` | inteiro, 1–4 | `invalidType`, `valueOutOfRange` |
| `MOST_READ_COUNT` | inteiro, 3–10 | `invalidType`, `valueOutOfRange` |
| `LATEST_COUNT` | inteiro, 3–10 | `invalidType`, `valueOutOfRange` |
| `SAW_THIS_BLOCK_SIZE` | inteiro, 3–10 | `invalidType`, `valueOutOfRange` |
| `RELATED_NEWS_COUNT` | inteiro, 1–6 | `invalidType`, `valueOutOfRange` |
| `WHATSAPP_NUMBER` | `trim`; só dígitos (formato internacional, ex. `5562999999999`), 10–15 | `invalidType`, `whatsappInvalidFormat` |
| `CONTACT_EMAIL` | `trim` + minúsculas; e-mail válido; até 254 caracteres; ou `null` (volta ao padrão — [§4](#4-e-mail-de-contato)) | `invalidType`, `emailInvalidFormat` |
| `SITE_NAME` | `trim`; não vazia; **até 120 caracteres** | `invalidType`, `emptyValue`, `valueTooLong` |
| `LOGO` | objeto `{ id }` com uuid de arquivo existente, ou `null` (remove) | `invalidType`, `imageNotExists` |
| `LOGO_ALT` | `trim`; pode ser vazia; **até 255 caracteres** | `invalidType`, `valueTooLong` |
| `SHOW_NAME_WITH_LOGO` | boolean | `invalidType` |

`valueTooLong` é limite do servidor que a proposta original não tinha (decisão 13
— [§9](#9-decisões-tomadas)): `SITE_NAME` até 120 caracteres, `LOGO_ALT` até 255,
ambos depois do `trim`. Inteiro é `typeof === 'number' && Number.isInteger` —
`"8"` (string) e `8.5` são `invalidType`, não arredondados nem convertidos.

Formato de erro: o padrão do projeto — `{ "status": 422, "errors": { "<chave>": "<código>" } }`,
com a chave do erro sendo o nome do parâmetro (ex.:
`{ "errors": { "MIN_NEWS_FOR_MIDDLE_BANNER": "valueOutOfRange" } }`). Ver também
`readOnlyField` e `unknownSetting` em [§10](#10-resumo-das-rotas-e-códigos-de-erro).

Observação de UX: se o back **clampasse** em silêncio (como faz em
`?limit=`, ver [§7](#7-parâmetros-de-paginação-desativados-na-ui)), o editor não
saberia que o valor não valeu. Para essa tela, falhar alto com `422` é melhor.

---

## 6. Quem consome cada parâmetro

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
| `CONTACT_EMAIL` | **nenhum hoje** | e-mail para o leitor falar com a administração (sugestão: `mailto:` no rodapé) — ver [§4](#4-e-mail-de-contato) |
| `SITE_NAME` | `site-header.tsx`, `admin-shell.tsx`, `site-footer.tsx`, `login-page.tsx` | via `useSiteIdentityStore` |
| `LOGO_URL`/`LOGO` | idem | via `useSiteIdentityStore` |
| `LOGO_ALT` | idem | acessibilidade do logo |
| `SHOW_NAME_WITH_LOGO` | `features/portal/home/components/site-header.tsx:24` | mostrar nome ao lado do logo |
| os 5 `*_FETCH_LIMIT` | **nenhum** | comentados na UI — ver [§7](#7-parâmetros-de-paginação-desativados-na-ui) |

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

## 7. Parâmetros de paginação desativados na UI

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

## 8. Comportamento atual dos botões Salvar e Restaurar

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

## 9. Decisões tomadas

As 12 perguntas da versão anterior deste documento, respondidas. Todas
reversíveis; o racional completo está em `.specs/tasks-parte-6.md` (gitignored,
interno ao backend).

1. **Armazenamento**: tabela chave/valor (`setting`: `key` PK, `value jsonb`
   NULL, `updatedAt`, `updated_by_id` → `user`) + um registro de chaves em
   código com tipo, faixa e default. Sem seed nem linha inicial — tabela vazia
   é tudo default. `value` NULL significa "sem personalização" (reset e
   `PATCH { chave: null }` gravam NULL, não apagam a linha).
2. **Permissão de escrita**: **só admin** (diverge de News/Categories/Tags/
   Banners, que qualquer autenticado administra) — parâmetro é global.
3. **`GET` público**, com defaults mesclados no servidor: **sim para os dois**.
4. **Reset**: endpoint dedicado, `POST /settings/reset`, `200` com o objeto
   completo.
5. **Logo**: referência `{ id }`, recortada para `{ id, path, mimeType, type }`
   no `GET` — é a 4ª trava de `DELETE /files/:id` (`INTEGRACAO-FILES-BANNERS.md §4`).
6. **SVG** no logo: **não** — upload continua jpeg/png/gif, sem mudança em
   `infra/files`.
7. **Paginação**: os `*_FETCH_LIMIT` **ficam fora** do registro — enviá-los no
   `PATCH` é `422 unknownSetting`. Sem mudança nesta entrega.
8. **Cache/ETag**: **não há** — o `updatedAt` no `GET` basta para o `staleTime`
   do front.
9. **Concorrência**: **last-write-wins**, com upsert numa instrução só
   (`INSERT … ON CONFLICT (key) DO UPDATE`), atômico sem transação explícita.
10. **Auditoria**: `updatedBy` **ausente** no `GET` anônimo (não `null` — a
    chave não existe no JSON); presente com token e nas respostas de
    `PATCH`/reset.
11. **Nomes das chaves**: `SCREAMING_SNAKE_CASE`, como o front já usa; metadado
    em camelCase (`updatedAt`, `updatedBy`, `contactEmailIsDefault`).
12. **E-mail de contato — onde aparece no portal**: segue em aberto, é decisão
    de front/produto; o back só entrega o valor ([§4](#4-e-mail-de-contato)).

Mais uma, que a proposta original não tinha:

13. **Limites de tamanho** (`valueTooLong`): `SITE_NAME` até 120 caracteres,
    `LOGO_ALT` até 255, ambos depois do `trim` — ver [§5](#5-validação-de-valores).

---

## 10. Resumo das rotas e códigos de erro

### Rotas

| Método | Rota | Auth | Observação |
|---|---|---|---|
| `GET` | `/api/v1/settings` | público | todas as chaves, defaults mesclados no servidor |
| `PATCH` | `/api/v1/settings` | autenticado, só admin | parcial; só chaves enviadas |
| `POST` | `/api/v1/settings/reset` | autenticado, só admin | defaults de código, para todas as chaves |
| `POST` | `/api/v1/files/upload` | autenticado | já existe; usado pelo logo |

Upload de logo e travas de arquivo em uso: ver
[`INTEGRACAO-FILES-BANNERS.md`](./INTEGRACAO-FILES-BANNERS.md).
Fundamentos de auth e formato de erro: ver
[`INTEGRACAO-AUTH-AUTHORS.md`](./INTEGRACAO-AUTH-AUTHORS.md).

### Códigos de erro

| Código | Campo | Significado |
|---|---|---|
| `valueOutOfRange` | chave numérica | fora da faixa da [§5](#5-validação-de-valores) |
| `invalidType` | chave | tipo diferente do esperado (`"8"` em number, `8.5` em inteiro, `"true"` em boolean, `null` em chave não anulável) |
| `whatsappInvalidFormat` | `WHATSAPP_NUMBER` | não são só dígitos (depois do `trim`) / fora de 10–15 |
| `emailInvalidFormat` | `CONTACT_EMAIL` | não é um e-mail válido, é `""` ou passa de 254 caracteres |
| `emptyValue` | `SITE_NAME` | vazia (ou só espaços) onde não pode |
| `valueTooLong` | `SITE_NAME` (>120), `LOGO_ALT` (>255) | passou do limite do servidor, depois do `trim` |
| `unknownSetting` | chave | chave que não existe no registro (inclusive `LOGO_URL` e os `*_FETCH_LIMIT`) |
| `readOnlyField` | `updatedAt` / `updatedBy` / `contactEmailIsDefault` | metadado; não envie |
| `imageNotExists` | `LOGO` | `id` que não é uuid, ou uuid de arquivo inexistente no acervo |
| `fileInUse` | `id` | `DELETE /files/:id` de um arquivo referenciado por settings/notícia/usuário/banner (`INTEGRACAO-FILES-BANNERS.md §4`) |

Corpo do `PATCH` que não é objeto (ex.: array): `422 { "errors": { "settings": "invalidType" } }`
— fora do formato `{ "errors": { "<chave>": "<código>" } }` de todos os outros,
porque não há chave de parâmetro para apontar.

`401` (sem token) e `403` (sem permissão) seguem o padrão do projeto: trate pelo
status.
