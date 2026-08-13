# News, Categories e Tags — decisões do módulo de conteúdo

> Documento **deste projeto** (não vem do boilerplate). Registra as decisões que
> não se leem no código sem contexto, para quem for mexer nestes módulos depois.
>
> Contrato das rotas para o frontend: **`INTEGRACAO-NEWS-CATEGORIES-TAGS.md`**,
> na raiz do repositório. Aqui ficam só as razões.

## Onde está o quê

```
src/core/categories/   CRUD de categorias  (domain/ dto/ infrastructure/persistence/…)
src/core/tags/         CRUD de tags
src/core/news/         CRUD de notícias
src/utils/validators/  IsAbsent (campo derivado) e MaxJsonSize (teto do config)
```

Mesma estrutura de `src/core/authors/`: `domain/` (o objeto que sai na resposta),
`dto/` (o que entra), `infrastructure/persistence/relational/` (entidade, mapper,
repositório) com uma classe abstrata de repositório entre service e TypeORM.

Tabelas criadas pela migration `AddNewsCategoriesTags`: `category`, `tag`, `news`
e a junção `news_tags`. Índices em `news.slug` (único), `news.status`,
`news.category_id` e `news.author_id` — as colunas por onde a listagem filtra.

## ⚠️ `config` é um blob opaco — não promova nada dele para coluna

`news.config` é `jsonb` sem schema. Ele carrega as **regras de vitrine** do
portal: qual matéria ocupa qual espaço na home, em que ordem, e a marcação de
última hora.

**O backend não interpreta nada disso.** Não existe coluna para essas regras, e
nenhuma query deste módulo lê, filtra ou ordena por chave de dentro do `config`.
A única validação é de **tamanho** (16 KB, via `MaxJsonSize` no DTO).

Por que: dar ao front liberdade de criar e mudar regras de layout sem exigir
migration nem mudança de contrato a cada ideia nova.

Consequências aceitas conscientemente (não são descuido):

- **Não há garantia de unicidade de espaço.** Duas notícias marcadas como
  destaque ficam as duas marcadas. Quem garante é o cliente que monta a home.
- Filtrar por esses valores exigiria consulta a `jsonb`
  (`config->>'position' = '...'`), que funciona no Postgres mas não é o caminho
  previsto: o front busca as publicadas e arranja no cliente.
- Um JSON inesperado quebra a home **em silêncio**, então a spec de integração
  pede leitura defensiva no cliente.

> Se aparecer um caso concreto que pareça exigir coluna (validar o valor da
> posição, impor unicidade no servidor, filtrar por última hora numa query), isso
> é **decisão de produto a rediscutir**, não um `andWhere` a acrescentar. A
> decisão atual é o oposto e foi tomada com o preço na mesa.

Ressalva técnica do `jsonb`: valores, tipos e aninhamento voltam idênticos, mas a
**ordem das chaves não é preservada** e chave duplicada no mesmo objeto colapsa.
Está documentado na spec de integração.

## Rota pública x rota autenticada na mesma URL

`GET /news`, `GET /news/:slug` e `GET /categories` usam
`AuthGuard(['jwt','anonymous'])`: abrem sem token, mas populam `request.user`
quando o token vem. É o que permite a mesma rota devolver menos para o visitante.

Regras que dependem disso:

- **Sem token, `?status=` é ignorado** e a listagem de notícias devolve só
  `published`. Ignorar (em vez de recusar) evita quebrar link compartilhado com
  query antiga.
- Notícia não publicada responde **`404`** para o visitante, não `403` — `403` já
  contaria que ela existe.
- **Categoria `active: false` some das listagens públicas** e o `?active=` do
  visitante é ignorado, senão `?active=false` seria porta para ver o que está
  fora do ar.
- Token inválido ou expirado cai no ramo anônimo (visão pública), não em `401`.

⚠️ **Serialização**: `News.author` é o domain `Author`, que chega **achatado**
(`name`/`photo` copiados do `User`, sem aninhar o `User`). É o que impede `email`,
`provider`, `socialId` e `trialStartDate` de vazarem numa notícia pública. Se
alguém fizer `author` carregar o `User`, a rota pública vaza junto — há teste e2e
cobrindo (`test/user/news.e2e-spec.ts`).

## Contadores são derivados, nunca colunas

Contagem de notícias por categoria (`newsCount`) e uso da tag (`usageCount`) saem
de `loadRelationCountAndMap` na própria query da listagem — uma agregação para a
página inteira, não um `COUNT` por linha (cuidado com N+1 ao mexer).

No DTO, os dois campos existem só para serem **recusados** com
`422 readOnlyField` (decorator `IsAbsent`), junto de `author`, `views` e
`publishedAt` em News. Recusar em vez de ignorar é deliberado: o `whitelist: true`
do ValidationPipe global apaga propriedade sem decorator em silêncio, e silêncio
faz o cliente acreditar que gravou um número que ele não gravou.

## Ciclo de vida

- **`DELETE /news/:id` arquiva** (`status: archived`), não apaga. A coluna
  `deletedAt` existe na tabela como saída de exceção (conteúdo indevido), mas a
  API não a usa.
- **`publishedAt`** é carimbado na primeira transição para `published` e **nunca
  reescrito**: voltar para rascunho preserva o carimbo e republicar não muda a
  data original.
- **`views`** incrementa com `UPDATE ... SET views = views + 1` (atômico) e só em
  notícia publicada. Falha no incremento é logada e **não** derruba a resposta.
- **`DELETE /categories/:id` recusa categoria em uso** (`422 categoryHasNews`),
  checado no service. Não se deixa o erro de FK subir: violação de constraint
  vira `500` com mensagem de driver, inútil para o cliente. Para categoria em uso
  a saída é `active: false`.

## Armadilha da junção `news_tags`

Das duas FKs da tabela de junção, o TypeORM gera `ON DELETE CASCADE` só na do
lado dono (`news_id`); a de `tag_id` sai como `NO ACTION`. Por isso
`TagsRelationalRepository.remove()` apaga as associações **explicitamente** antes
da tag, na mesma transação — sem isso, apagar tag em uso viraria violação de FK.

`NewsEntity` é o lado dono (`@JoinTable`) de propósito: é de lá que
`entity.tags = [...]` + `save()` sincroniza a junção, que é como o `PATCH`
substitui o conjunto de tags.

## Autorização

- Criar notícia: **qualquer** usuário autenticado do dashboard.
- Editar/excluir notícia: **o autor dela ou um admin** (mesma regra de
  `PATCH /authors/:id`).
- Categories e Tags: **qualquer** usuário autenticado gerencia. Só administração
  de *usuários* é privativa de admin.

## Travas contra lockout de admin

Entregues junto deste módulo, em `UsersService`:

- `DELETE /users/:id` não apaga o próprio usuário autenticado
  (`422 cannotDeleteSelf`) — para isso existe `DELETE /auth/me`.
- Nenhum caminho remove ou rebaixa o **último admin**:
  `422 cannotDeleteLastAdmin` (vale para `DELETE /users/:id` e `DELETE /auth/me`,
  porque a trava está no service, não no controller) e
  `422 cannotDemoteLastAdmin` no `PATCH /users/:id` que troca a role.

`status` do usuário **não** faz parte dessa conta: `AuthService.validateLogin` não
verifica `status`, então um admin `inactive` continua logando e continua sendo
saída de recuperação. Se um dia o login passar a barrar `inactive`, desativar o
último admin vira lockout e precisa entrar na mesma trava.

## Fora de escopo (não é esquecimento)

CRUD de acervo de mídia (Files) e Banners; busca full-text (o `?q=` é `ILIKE`);
vídeos; ordenação por posição no servidor. Tags têm API pronta e testada mas
**nenhum consumo no site público** ainda.
