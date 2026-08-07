# Mapa técnico de integração — Auth + Authors

Contrato da API para o frontend consumir. Cobre **autenticação** (login, refresh,
logout, recuperação de senha, perfil) e o **CRUD de Authors** (perfis editoriais
/ colunistas).

Objetivo prático: dar ao front tudo o que falta para

1. substituir `frontend/lib/admin-auth.ts`, que hoje é autenticação falsa —
   credenciais fixas `admin@portal.com` / `admin123` e um flag no `localStorage`;
2. trocar o mock de colunistas de `frontend/lib/news-data.ts` por dados reais.

Swagger interativo (com "Try it out"): `{HOST}/docs`.
Última atualização: 2026-08-07.

---

## Índice

- [0. Subindo a API localmente](#0-subindo-a-api-localmente)
- [1. Fundamentos](#1-fundamentos)
- [2. Auth](#2-auth)
- [3. Authors](#3-authors)
- [4. Users (admin) — o "signup" do painel](#4-users-admin--o-signup-do-painel)
- [5. Como substituir o `admin-auth.ts`](#5-como-substituir-o-admin-authts)
- [6. Como substituir o mock de colunistas](#6-como-substituir-o-mock-de-colunistas)
- [7. Resumo das rotas e dos erros](#7-resumo-das-rotas-e-dos-erros)

---

## 0. Subindo a API localmente

Do zero até a API respondendo. São 6 passos; o caminho inteiro leva uns 5
minutos, a maior parte esperando `npm ci` e o `docker compose`.

### Pré-requisitos

| Ferramenta | Versão | Como conferir |
|---|---|---|
| **Node.js** | **22.19.0** (o `package.json` exige `>=22.0.0`) | `node -v` |
| **npm** | `>=10.0.0` — já vem com o Node 22 | `npm -v` |
| **Docker** + Docker Compose v2 | qualquer recente | `docker compose version` |

O repositório tem um [`.nvmrc`](backend/.nvmrc), então com [nvm](https://github.com/nvm-sh/nvm):

```bash
cd backend
nvm install   # instala a versão do .nvmrc na primeira vez
nvm use
```

> ⚠️ Existem **dois lockfiles** no backend (`package-lock.json` e `yarn.lock`) —
> herança do boilerplate. **Use npm**: é o `package-lock.json` que está
> atualizado, e todos os scripts assumem npm. O `yarn.lock` só é usado pelo build
> da imagem Docker de produção.

### 1. Dependências

```bash
cd backend
npm ci
```

`npm ci` (e não `npm install`) porque respeita o lockfile exatamente — evita
subir versões por conta própria e produzir um ambiente diferente do resto do time.

### 2. Arquivo de ambiente

```bash
cp env-example-relational .env
```

O `.env` é **gitignored** — nunca commite. O exemplo já vem com valores que
funcionam localmente; só dois blocos precisam da sua atenção, descritos nos
passos 3 e 4.

### 3. E-mail: aponte para o `maildev` (recomendado no local)

A recuperação de senha depende de envio de e-mail. Localmente, **não use o
Gmail**: o repositório sobe um `maildev`, que é um servidor SMTP falso com
interface web onde a mensagem aparece na hora, sem credencial nenhuma.

No `.env`, ajuste o bloco de e-mail para:

```bash
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_REQUIRE_TLS=false
MAIL_IGNORE_TLS=true
MAIL_USER=
MAIL_PASSWORD=
```

Com `MAIL_USER` vazio, a API nem tenta autenticar — é o que o `maildev` espera.
Os e-mails enviados aparecem em **<http://localhost:1080>**.

> Se em algum momento você precisar testar entrega real (Gmail + senha de app),
> as instruções estão comentadas no próprio `env-example-relational`. Não é
> necessário para a integração.

### 4. Admin do seed

Ainda no `.env`, preencha:

```bash
ADMIN_EMAIL=seu-email@exemplo.com
ADMIN_PASSWORD=uma-senha-sua
```

⚠️ O seed **aborta com erro explícito** se qualquer um dos dois estiver vazio.
Isso é proposital: antes existia um `admin@example.com` / `secret` hardcoded, que
em produção seria credencial padrão conhecida.

Como o e-mail é seu, você também consegue testar o fluxo de recuperação de senha
de ponta a ponta (ver "Primeiro acesso" abaixo).

### 5. Subir as dependências em Docker

```bash
docker compose -f docker-compose-dev.yaml up -d
```

Este é o perfil **"dependências isoladas"**: sobe só a infra, e a API roda no seu
host (com hot reload). Serviços e portas:

| Serviço | Porta | Para quê |
|---|---|---|
| `postgres` | `5432` | banco |
| `maildev` | `1080` (web) / `1025` (SMTP) | ver os e-mails enviados |
| `minio` | `9000` (API) / `9001` (console) | storage S3-compatible, para upload de imagem |
| `redis` | `6379` | não usado ainda |

Confira que subiu tudo:

```bash
docker compose -f docker-compose-dev.yaml ps
```

> Existe também um `docker-compose.yaml` que roda **a API junto**, dentro do
> Docker. Para integrar o front, prefira o `-dev.yaml` acima: você quer a API no
> host, com hot reload e logs à mão.

### 6. Banco: migrations + seed

```bash
npm run migration:run
npm run seed:run:relational
```

O seed cria dois usuários, **cada um já com seu `Author` vinculado**:

| E-mail | Senha | Papel |
|---|---|---|
| o seu `ADMIN_EMAIL` | seu `ADMIN_PASSWORD` | **admin** (`role.id === 1`) |
| `john.doe@example.com` | `secret` | usuário comum (`role.id === 2`) |

O segundo é útil para testar as telas com quem **não** é admin — por exemplo,
confirmar que ele recebe `403` ao tentar editar o perfil de outro autor.

### 7. Rodar a API

```bash
npm run start:dev
```

- API: <http://localhost:3000>
- Health: <http://localhost:3000/health> → deve responder `200`
- **Swagger** (com "Try it out"): <http://localhost:3000/docs>

O Swagger é a forma mais rápida de conferir um payload sem escrever código:
faça login em `POST /auth/email/login`, copie o `token`, clique em
**Authorize** no topo e cole.

### 8. Rodar o front na porta 3001

`next dev` sobe na **3000** por padrão — a mesma porta da API. Rode o front em
outra porta:

```bash
cd frontend
npm ci
npx next dev -p 3001
```

O `env-example-relational` já traz `http://localhost:3001` na lista de
`FRONTEND_DOMAIN`, então o CORS aceita essa origem sem ajuste. **Se você usar
qualquer outra porta**, acrescente-a a `FRONTEND_DOMAIN` no `.env` do backend e
reinicie a API — senão toda chamada do front é bloqueada pelo navegador (o erro
aparece no console como CORS, não como um 4xx da API).

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run start:dev` | API com hot reload |
| `npm run seed:run:relational` | (re)popula os usuários do seed |
| `npm run schema:drop && npm run migration:run && npm run seed:run:relational` | zera o banco e recomeça |
| `docker compose -f docker-compose-dev.yaml down` | derruba a infra (mantém os dados) |
| `docker compose -f docker-compose-dev.yaml down -v` | derruba **e apaga** os volumes |
| `npm run lint` / `npm run build` | checagens |

### Se algo der errado

| Sintoma | Causa provável |
|---|---|
| `ECONNREFUSED ... 5432` no start | o `docker compose ... up -d` não subiu, ou o Postgres ainda está iniciando |
| Seed aborta pedindo `ADMIN_EMAIL`/`ADMIN_PASSWORD` | passo 4 não foi feito |
| Erro de CORS no console do front | a origem do front não está em `FRONTEND_DOMAIN` (passo 8) |
| `EADDRINUSE :3000` | API e front disputando a porta — front vai para a 3001 |
| E-mail não aparece | confira <http://localhost:1080>; se estiver vazio, o bloco `MAIL_*` do passo 3 não foi ajustado |
| `535 Username and Password not accepted` | o `.env` está apontando para o Gmail sem senha de app válida — volte ao passo 3 |

### Primeiro acesso ao painel

Não existe cadastro público: o primeiro admin vem do seed (passo 4/6), e os
demais usuários são criados de dentro do painel, por `POST /users`.

Você já sabe a senha do admin, porque foi você quem definiu `ADMIN_PASSWORD`.
Mas vale exercitar o fluxo de recuperação, que é uma das telas a construir:

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot/password \
  -H 'Content-Type: application/json' \
  -d '{"email":"SEU_ADMIN_EMAIL"}'
```

O e-mail aparece em <http://localhost:1080> com um link
`.../password-change?hash=<jwt>&expires=<ms>`. Como a página `/password-change`
**ainda não existe no front** (construí-la faz parte desta integração — ver 2.7),
copie o valor de `hash` da URL e finalize por linha de comando:

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset/password \
  -H 'Content-Type: application/json' \
  -d '{"hash":"<hash da URL>","password":"sua-senha-nova"}'
```

Pronto — agora dá para logar em `POST /auth/email/login`. O `hash` vale
**30 minutos**.

---

## 1. Fundamentos

### Base URL

```
{HOST}/api/v1
```

`API_PREFIX=api` + versionamento por URI. Em desenvolvimento:
`http://localhost:3000/api/v1`. Exceção: o healthcheck fica fora do prefixo, em
`{HOST}/health`.

### Autenticação: Bearer token no header

**Não há cookies.** O plano original pedia "JWT em cookies" e isso foi
**revertido**: front e API ficam em sites diferentes, cenário em que o cookie da
API é cookie de terceiros — bloqueado por padrão no Safari e particionado no
Firefox. A autenticação simplesmente não funcionaria para parte real dos
usuários.

Toda requisição autenticada leva:

```
Authorization: Bearer <token>
```

O navegador **não** anexa esse header sozinho, então não há superfície de CSRF —
e nada precisa de `credentials: 'include'` no `fetch`.

### CORS

A API só aceita chamadas de navegador vindas das origens listadas na env
`FRONTEND_DOMAIN` do backend (lista separada por vírgula). Hoje, em dev:

```
http://localhost:3000, http://localhost:3001
```

Uma origem fora da lista não recebe o header `Access-Control-Allow-Origin` e o
navegador bloqueia a resposta. **Se o front subir em outra porta ou domínio,
peça para incluí-la** — o sintoma é erro de CORS no console, não um 4xx.

Headers liberados: `Content-Type`, `Authorization`, `x-custom-lang`.
Métodos: `GET, POST, PATCH, PUT, DELETE, OPTIONS`. `credentials` não é
habilitado (não há cookie a enviar).

### Idioma

Os e-mails e as mensagens i18n saem em **português** por padrão. Para forçar
outro idioma numa requisição, mande o header `x-custom-lang: en`.

### Formato dos erros

Erros de validação e de regra de negócio (`422`) seguem sempre esta forma:

```json
{
  "status": 422,
  "errors": {
    "email": "email must be an email",
    "password": "password should not be empty"
  }
}
```

A chave de `errors` é o campo; o valor é a mensagem ou um **código** que o front
pode traduzir (ex.: `emailAlreadyExists`, `incorrectPassword`, `notFound`,
`invalidHash`, `slugAlreadyExists`). `401` e `403` têm corpo mais simples —
sempre trate pelo status.

---

## 2. Auth

### 2.1 `POST /auth/email/login`

Público. Autentica com e-mail e senha.

**Request**

```json
{ "email": "admin@exemplo.com.br", "password": "senha-do-usuario" }
```

**Response `200`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenExpires": 1786112670231,
  "user": {
    "id": 1,
    "email": "admin@exemplo.com.br",
    "provider": "email",
    "socialId": null,
    "name": "Super Admin",
    "legalName": null,
    "photo": null,
    "role": { "id": 1, "name": "Admin" },
    "status": "active",
    "createdAt": "2026-08-07T17:08:54.766Z",
    "updatedAt": "2026-08-07T17:08:54.766Z",
    "deletedAt": null
  }
}
```

- `tokenExpires` é **epoch em milissegundos** (não segundos, não duração) — o
  instante em que o `token` expira. Compare direto com `Date.now()`.
- O `token` (access) vale **15 minutos**; o `refreshToken` vale **30 dias**.
- ⚠️ Esta resposta **não** traz o `author`. Para obtê-lo, chame `GET /auth/me`
  logo após o login (ver 2.4).

**Erros**

| Status | Quando | `errors` |
|---|---|---|
| `422` | e-mail não cadastrado | `{ "email": "notFound" }` |
| `422` | senha errada | `{ "password": "incorrectPassword" }` |
| `422` | payload inválido | mensagens de validação por campo |

**Papéis**: `role.id === 1` é admin, `role.id === 2` é usuário comum. Use isso
para decidir o que mostrar no painel — mas lembre que a autorização real é feita
no servidor.

> Nota de comportamento: um usuário com `status: "inactive"` **consegue logar**
> (decisão mantida). Como não existe cadastro público, todo usuário nasce
> `active`; o status é hoje só informativo.

### 2.2 `POST /auth/refresh`

Renova o par de tokens. **Autentica com o `refreshToken`**, não com o `token`:

```
Authorization: Bearer <refreshToken>
```

Corpo vazio.

**Response `200`**

```json
{ "token": "...", "refreshToken": "...", "tokenExpires": 1786112670231 }
```

**Quando chamar**

- Quando `Date.now() >= tokenExpires` — ou, melhor, um pouco antes (ex.: 60s de
  folga), para não perder uma requisição na virada.
- Ou reativamente: ao receber `401` numa chamada autenticada, tentar o refresh
  uma vez e repetir a requisição original.

**Regra importante — o refresh token é de uso único.** Cada refresh troca o
`hash` da sessão no banco e **invalida o refresh token anterior**. Consequências
práticas:

1. Guarde sempre o `refreshToken` novo que veio na resposta, descartando o antigo.
2. **Serialize os refreshes.** Se duas requisições expirarem juntas e cada uma
   disparar seu próprio refresh com o mesmo token, a segunda recebe `401` e
   desloga o usuário sem motivo. Use uma única promise compartilhada: a primeira
   chamada faz o refresh, as demais aguardam o resultado dela.

**Erros**: `401` se o refresh token for inválido, já usado, expirado, ou se a
sessão tiver sido revogada (logout, troca de senha). `401` aqui significa
**mandar o usuário para a tela de login** — não adianta tentar de novo.

### 2.3 `POST /auth/logout`

Autenticado (`token`). Corpo vazio. Response `204`.

Revoga a sessão no servidor: o `refreshToken` correspondente para de funcionar na
hora. Limpe os tokens do lado do front em seguida.

⚠️ O **access token** continua tecnicamente válido até expirar (até 15 min) —
JWT é stateless e o backend não consulta a sessão a cada requisição, por decisão
de performance. Na prática isso não é problema porque o front descarta o token no
logout, mas não trate o logout como revogação instantânea de tudo.

### 2.4 `GET /auth/me`

Autenticado. Devolve o usuário logado **com o perfil de autor**.

**Response `200`**

```json
{
  "id": 1,
  "email": "admin@exemplo.com.br",
  "provider": "email",
  "socialId": null,
  "name": "Super Admin",
  "legalName": null,
  "photo": null,
  "role": { "id": 1, "name": "Admin" },
  "status": "active",
  "createdAt": "2026-08-07T17:08:54.766Z",
  "updatedAt": "2026-08-07T17:08:54.766Z",
  "deletedAt": null,
  "author": {
    "id": "3f12cbdc-c253-4ffb-a67d-020dba173d20",
    "slug": "super-admin",
    "bio": null,
    "isColumnist": false,
    "userId": 1,
    "name": "Super Admin",
    "photo": null,
    "createdAt": "2026-08-07T17:08:54.766Z",
    "updatedAt": "2026-08-07T17:08:54.766Z"
  }
}
```

Use esta rota como fonte da verdade de "quem está logado": ela valida o token
contra o servidor de verdade, diferente de reler um objeto do `localStorage`.
Guarde `author.id` — na próxima fase ele será o autor pré-preenchido ao criar
notícia.

**Erros**: `401` com token ausente, inválido ou expirado.

### 2.5 `PATCH /auth/me`

Autenticado. Atualiza o próprio usuário.

**Request** (todos os campos opcionais)

```json
{
  "name": "Novo Nome",
  "photo": { "id": "<id de arquivo>" },
  "password": "nova-senha",
  "oldPassword": "senha-atual",
  "email": "novo@exemplo.com.br"
}
```

- Trocar senha **exige** `oldPassword`; sem ele, `422` com
  `{ "oldPassword": "missingOldPassword" }`. Errado: `incorrectOldPassword`.
  Ao trocar a senha, **as outras sessões do usuário são derrubadas** (a atual
  sobrevive).
- Trocar e-mail **não tem efeito imediato**: a API envia um e-mail de
  confirmação para o novo endereço e só troca depois de
  `POST /auth/email/confirm/new` com o `hash` do link.
- ⚠️ Campos editoriais (`bio`, `isColumnist`, `slug`) **não** entram aqui — use
  `PATCH /authors/:id` (seção 3.3).

**Response `200`**: o usuário atualizado (sem o `author`).

### 2.6 `DELETE /auth/me`

Autenticado. Response `204`. Soft delete do usuário **e** do seu autor — o perfil
some das rotas públicas de autores. Depois disso o login falha com `422`.

### 2.7 Recuperação de senha

Fluxo em três passos.

**1) `POST /auth/forgot/password`** — público.

```json
{ "email": "usuario@exemplo.com.br" }
```

Response `204`. A API envia um e-mail com um link para:

```
{FRONTEND_DOMAIN}/password-change?hash=<jwt>&expires=<epoch_ms>
```

Erro `422` `{ "email": "emailNotExists" }` se o e-mail não estiver cadastrado.

> ⚠️ Isso confirma a existência de um e-mail para quem perguntar. Como o cadastro
> é fechado e só há usuários internos, foi mantido — mas vale saber.

**2) O front precisa criar a rota `/password-change`.** ⚠️ **Ela ainda não
existe** — é uma das telas a construir nesta integração. A página lê `hash` e
`expires` da query string, mostra o formulário de nova senha, e pode avisar
"link expirado" comparando `expires` com `Date.now()` antes mesmo de chamar a
API. O `hash` vale **30 minutos**.

**3) `POST /auth/reset/password`** — público.

```json
{ "hash": "<o hash da query string>", "password": "nova-senha" }
```

Response `204`. Efeitos: a senha é trocada e **todas as sessões do usuário são
revogadas** — inclusive as de outros dispositivos. Depois disso, mande o usuário
para o login.

Erro `422` `{ "hash": "invalidHash" }` se o hash for inválido ou tiver expirado.

> Detalhe a considerar no front: o `hash` é um JWT com validade própria e **não é
> invalidado após o uso** — ele continua aceito até expirar (até 30 min). Não
> mantenha o link em histórico/URL visível mais do que o necessário.

### 2.8 Rotas que **não existem** (e por quê)

| Rota | Status | Motivo |
|---|---|---|
| `POST /auth/email/register` | `404` | Cadastro público desabilitado — painel administrativo. Usuários são criados por `POST /users` (admin). |
| `POST /auth/google/login` | `404` | Login social desativado no projeto. |
| `POST /auth/facebook/login` | `404` | Idem. |
| `POST /auth/apple/login` | `404` | Idem. |
| `POST /authors` | `404` | Criaria autor sem usuário, furando o 1:1. |
| `DELETE /authors/:id` | `404` | Idem, pelo outro lado. |

---

## 3. Authors

`Author` é o **perfil editorial** de um usuário do dashboard: o que aparece
publicamente no portal. Relação **1:1 obrigatória** com `User` — todo usuário tem
exatamente um autor, criado automaticamente junto, e não existe autor sem
usuário.

`name` e `photo` moram no `User` (fonte única de verdade) e chegam **achatados**
na resposta do autor — não há objeto `user` aninhado. Isso é deliberado: as rotas
`GET` de autores são **públicas**, e aninhar o usuário arriscaria vazar `email`,
`provider`, `socialId` e `trialStartDate`. Nenhum desses campos aparece em
nenhuma resposta de `/authors` (há teste e2e cobrindo exatamente isso).

**Forma do objeto**

```ts
type Author = {
  id: string          // uuid
  slug: string        // identificador público na URL
  bio: string | null
  isColumnist: boolean
  userId: number      // id do User dono
  name: string        // vem de User.name
  photo: { id: string; path: string } | null  // vem de User.photo; `path` já é URL pública pronta para <img src>
  createdAt: string   // ISO
  updatedAt: string
}
```

### 3.1 `GET /authors` — público

Query params:

| Param | Tipo | Default | Observação |
|---|---|---|---|
| `page` | number | `1` | |
| `limit` | number | `10` | teto de `50` |
| `columnist` | boolean | — | `true` devolve só os colunistas |

**Response `200`**

```json
{
  "data": [ { "id": "...", "slug": "mariana-costa", "...": "..." } ],
  "hasNextPage": false
}
```

`hasNextPage` é `data.length === limit` — paginação "infinita", sem contagem
total. Para saber se há próxima página, é só esse campo.

### 3.2 `GET /authors/:slug` — público

Devolve um `Author` pelo slug. `404` se não existir (ou se o usuário tiver sido
removido).

> **Nesta fase devolve só o perfil.** A listagem de notícias do autor entra junto
> com o módulo de News.

### 3.3 `PATCH /authors/:id` — autenticado

Repare que a rota usa o **`id` (uuid)**, não o slug.

**Request** (todos opcionais)

```json
{ "bio": "Cobre política local há 12 anos.", "isColumnist": true, "slug": "mariana-costa" }
```

**Autorização**: o autor edita o próprio perfil; **admin edita qualquer um**.
Qualquer outro caso é `403` com `{ "id": "cannotEditAnotherAuthor" }`.

Regras do `slug`: só minúsculas, números e hífens (`^[a-z0-9]+(-[a-z0-9]+)*$`),
2 a 80 caracteres, único no sistema.
⚠️ Mudar o slug **quebra links já publicados** para o perfil.

**Erros**

| Status | `errors` | Quando |
|---|---|---|
| `401` | — | sem token |
| `403` | `{ "id": "cannotEditAnotherAuthor" }` | não é dono nem admin |
| `404` | `{ "id": "authorNotFound" }` | id inexistente |
| `422` | `{ "slug": "slugAlreadyExists" }` | slug em uso |
| `422` | `{ "slug": "slugInvalidFormat" }` | formato inválido |

---

## 4. Users (admin) — o "signup" do painel

`POST /users` é o único caminho de criação de usuário exposto. Exige token de
**admin** (`role.id === 1`); qualquer outro usuário recebe `403`.

**Request**

```json
{
  "email": "mariana.costa@exemplo.com.br",
  "password": "senha-inicial",
  "name": "Mariana Costa",
  "photo": { "id": "<id de arquivo>" },
  "role": { "id": 2 },
  "status": "active",
  "author": { "bio": "Cobre política local há 12 anos.", "isColumnist": true }
}
```

- `email`, `password` (mín. 6) e `name` são obrigatórios.
- `role` é opcional — o default é **usuário comum** (`id: 2`).
- `author` é opcional; sem ele o autor nasce com `bio: null` e
  `isColumnist: false`. O `slug` é sempre gerado a partir do `name` (não é
  aceito no payload); homônimos ganham sufixo: `maria-silva`, `maria-silva-2`...

**Response `201`**: o usuário criado, **com o `author` junto** — o front não
precisa de uma segunda chamada para descobrir o slug gerado.

**Erros**: `422` `{ "email": "emailAlreadyExists" }`; `401` sem token; `403` se o
token não for de admin.

Outras rotas admin: `GET /users` (paginado, mesma forma de `data`/`hasNextPage`),
`GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` (soft delete de usuário
**e** autor).

---

## 5. Como substituir o `admin-auth.ts`

O arquivo atual é uma autenticação de mentira: compara `admin@portal.com` /
`admin123` no cliente e grava um flag no `localStorage`. O que muda:

### Onde guardar os tokens

| Token | Onde | Por quê |
|---|---|---|
| `token` (access, 15 min) | **em memória** — variável de módulo ou contexto React | Não persistir em `localStorage`: qualquer XSS o lê. Vida curta o torna barato de perder num reload. |
| `refreshToken` (30 dias) | `localStorage`, **só se** a sessão precisar sobreviver a reload | É o preço de "não deslogar ao atualizar a página". Se não precisar disso, mantenha em memória também. |
| `tokenExpires` | junto do access token | Serve para decidir quando renovar. |

Não use cookie para nada disso — a API não emite nem lê cookies.

### Esqueleto do fluxo

1. **Login** → `POST /auth/email/login`. Guarde `token`/`tokenExpires` em
   memória e `refreshToken` conforme a tabela.
2. **Sessão inicial / reload** → se houver `refreshToken`, chame
   `POST /auth/refresh` para obter um access token novo e então `GET /auth/me`.
   Se qualquer um der `401`, limpe tudo e mostre o login.
3. **Cada requisição** → header `Authorization: Bearer <token>`. Antes de enviar,
   se `Date.now() >= tokenExpires - 60000`, renove primeiro.
4. **Renovação** → uma **única** promise compartilhada por vez (ver 2.2), sempre
   substituindo o `refreshToken` guardado pelo que veio na resposta.
5. **Logout** → `POST /auth/logout` com o access token, depois limpar o estado
   local. Chame a API mesmo que o token pareça expirado; ignore o erro.
6. **`401` em qualquer rota** → tente renovar uma vez; se falhar, deslogue.

### Guarda de rota

Substitua `isAuthenticated()` (leitura de flag no `localStorage`) por "tenho
access token válido em memória **ou** consegui renovar". A verificação
autoritativa é `GET /auth/me` — o servidor decide, não o cliente.

### Telas a construir/ajustar

- **Login** — passa a chamar a API de verdade; sem credenciais no bundle.
- **`/password-change`** — não existe ainda; ver 2.7, passo 2.
- **Guarda das rotas do admin** — conforme acima.

---

## 6. Como substituir o mock de colunistas

O mock atual (`frontend/lib/news-data.ts`, tipo `Columnist`) é consumido por
`frontend/components/news/columnists-section.tsx`. A troca é:

```
GET /api/v1/authors?columnist=true&limit=3
```

Rota **pública** — a home não precisa de token.

**Mapa mock → API**

| Campo do mock | Vem de | Observação |
|---|---|---|
| `id` | `id` | passa a ser uuid (string), não `"c1"` |
| `name` | `name` | achatado do `User` |
| `avatar` | `photo?.path` | já é URL pública completa; use `?? '/placeholder.svg'` — pode ser `null` |
| `role` | **não existe** | ver abaixo |
| `headline` | **não existe** | ver abaixo |

### Os dois campos que a API não devolve

**`role`** (a área editorial exibida sob o nome — "Política & Poder",
"Economia"): **não foi criado** nesta fase, por decisão de produto. Note que o
nome `role` não poderia ser reaproveitado de qualquer forma — no `User`, `role`
significa permissão (`admin`/`user`), e duas coisas com o mesmo nome e sentidos
opostos é bug esperando acontecer. Se o campo for necessário, ele volta como
coluna própria (`editorialArea`) numa fase seguinte.

**`headline`** (a frase de chamada da coluna): **não foi criado**, também por
decisão. Pela natureza, ele muda a cada coluna publicada — tem cara de ser
derivado da **última notícia do autor**, não de um campo fixo que alguém precisa
lembrar de atualizar. Como `News` só existe na próxima fase, a decisão foi
esperar.

**Até lá**, a seção de colunistas tem duas saídas: renderizar sem o subtítulo e
sem a chamada (usando `bio` no lugar da `headline`, que é o campo mais próximo
disponível), ou manter esses dois textos mockados no front enquanto o resto vem
da API. A primeira é a mais honesta; a segunda evita mexer no layout agora.

---

## 7. Resumo das rotas e dos erros

| Método | Rota | Auth | Devolve |
|---|---|---|---|
| `POST` | `/auth/email/login` | público | `token`, `refreshToken`, `tokenExpires`, `user` |
| `POST` | `/auth/refresh` | Bearer **refreshToken** | novo par de tokens |
| `POST` | `/auth/logout` | Bearer | `204` |
| `GET` | `/auth/me` | Bearer | usuário + `author` |
| `PATCH` | `/auth/me` | Bearer | usuário atualizado |
| `DELETE` | `/auth/me` | Bearer | `204` (soft delete de user + author) |
| `POST` | `/auth/forgot/password` | público | `204` (envia e-mail) |
| `POST` | `/auth/reset/password` | público | `204` (revoga sessões) |
| `POST` | `/auth/email/confirm/new` | público | `204` (confirma troca de e-mail) |
| `GET` | `/authors` | **público** | lista paginada, filtro `?columnist=true` |
| `GET` | `/authors/:slug` | **público** | perfil |
| `PATCH` | `/authors/:id` | Bearer (dono ou admin) | autor atualizado |
| `POST` | `/users` | Bearer (admin) | usuário criado **+ author** |
| `GET` | `/users` | Bearer (admin) | lista paginada |
| `GET` | `/users/:id` | Bearer (admin) | usuário |
| `PATCH` | `/users/:id` | Bearer (admin) | usuário atualizado |
| `DELETE` | `/users/:id` | Bearer (admin) | `204` (soft delete de user + author) |

Códigos de erro, por status:

| Status | Significado | O que o front faz |
|---|---|---|
| `401` | token ausente, inválido, expirado ou sessão revogada | tentar refresh uma vez; falhando, deslogar |
| `403` | autenticado, mas sem permissão (não é admin / não é o dono) | mensagem de permissão; **não** deslogar |
| `404` | recurso inexistente — ou rota que não existe (ver 2.8) | tela de não encontrado |
| `422` | validação ou regra de negócio | exibir `errors` campo a campo |
