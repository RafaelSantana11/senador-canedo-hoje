# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Deploy da demo (GitHub Pages)

O push na `main` que toque `frontend/**` dispara `.github/workflows/deploy-frontend-pages.yml`,
que gera um export estático e publica em https://rafaelsantana11.github.io/senador-canedo-hoje/.

O export é opt-in por env, então `npm run dev` e `npm run build` normais não mudam:

```bash
NEXT_OUTPUT=export NEXT_PUBLIC_BASE_PATH=/senador-canedo-hoje npm run build   # gera out/
```

### Ao mexer em imagens

O Pages serve o site de um subpath (`/senador-canedo-hoje`), e paths absolutos de
`public/` não recebem esse prefixo sozinhos. Regras:

- `<Image>` do `next/image` e `<Link>` — nada a fazer, já são prefixados.
- `<img src="/...">`, `backgroundImage: url(/...)` e URLs em `metadata` — passe por
  `assetPath()` de `@/lib/utils`.

Sem isso a imagem funciona em `dev` e 404 só na demo publicada.

## Google Analytics 4 (LGPD)

A integração usa `@next/third-parties` (gtag.js) + Consent Mode v2. O GA4 só
carrega quando `NEXT_PUBLIC_GA_MEASUREMENT_ID` existe e o ambiente é produção
(ou `NEXT_PUBLIC_GA_ENABLED=1`). O consentimento começa todo `denied`; ao
aceitar, **apenas `analytics_storage` é liberado**. Sinais de anúncio
(`ad_storage`, `ad_user_data`, `ad_personalization`) nunca são concedidos e
`ads_data_redaction` remove identificadores de clique de anúncio das URLs.
Nenhum dado pessoal é enviado: os eventos não carregam nome, e-mail, ID de
usuário ou texto livre. O GA4 anonimiza/descarta o IP na coleta e deriva
país/cidade de forma agregada.

### Variáveis de ambiente

| Variável                        | Padrão | Descrição                                                  |
| ------------------------------- | ------ | ---------------------------------------------------------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | vazio  | Measurement ID (`G-...`). Sem ele, o GA não carrega.        |
| `NEXT_PUBLIC_GA_ENABLED`        | `0`    | `1` força o GA ativo mesmo em dev/preview (útil em testes). |
| `NEXT_PUBLIC_GA_DEBUG`          | `0`    | `1` envia `debug_mode`, habilitando o DebugView.            |

Em produção no host (Vercel/Railway/etc.), defina
`NEXT_PUBLIC_GA_MEASUREMENT_ID`; as outras duas podem ficar de fora.

### Testar localmente

1. Crie uma propriedade em https://analytics.google.com e um data stream do
   tipo Web (Admin → Recolhimento e modificação de dados → Streams de dados).
   Copie o Measurement ID.
2. No `.env`, preencha:
   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GA_ENABLED=1
   NEXT_PUBLIC_GA_DEBUG=1
   ```
3. `npm run dev`, aceite o banner de cookies e acompanhe os hits em
   **Admin → DebugView**. Os eventos aparecem com o parâmetro `debug_mode`.

### Configuração da propriedade (painel do GA, não é código)

- **Enhanced Measurement** ligado, com "Page changes based on browser history
  events" marcado — é o que gera os pageviews na navegação SPA. Não enviamos
  `page_view` manual para não duplicar.
- **Google Signals** ligado (Admin → Recolhimento de dados) para habilitar os
  relatórios demográficos agregados, quando disponíveis (o GA aplica
  thresholding e só inclui usuários que atenderem aos requisitos).
- **Retenção de dados**: 14 meses (Admin → Retenção de dados).

### Onde ver cada métrica

| Dado                              | Relatório                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| Visitantes e novos visitantes     | Relatórios → Aquisição → Visão geral de usuários                  |
| Visualizações de página           | Relatórios → Engajamento → Páginas                                |
| Origem do tráfego                 | Relatórios → Aquisição → Aquisição de tráfego                     |
| Páginas mais acessadas            | Relatórios → Engajamento → Páginas                                |
| Tempo médio e duração das sessões | Relatórios → Engajamento → Visão geral                            |
| País/cidade (aproximado)          | Relatórios → Dados demográficos → Detalhes geográficos            |
| Idioma                            | Relatórios → Dados demográficos → Detalhes demográficos           |
| Tipo de dispositivo               | Relatórios → Tecnologia → Visão geral                             |
| Demográficos anônimos             | Relatórios → Dados demográficos (requer Google Signals)           |
| Cliques em banners                | Engajamento → Eventos → `banner_click` (params via Explorações)   |

O evento de clique em banner envia `banner_id` (ID do arquivo do criativo),
`banner_position` (`top`, `middle`, `aside`, `bottom`), `banner_name` (texto
alternativo) e `banner_link_url` (URL de destino). Para cruzar esses
parâmetros, crie uma Exploração com a dimensão personalizada `banner_id` (a
dimensão precisa ser registrada em Admin → Definições personalizadas).

O evento `scroll_depth` (25/50/75/100%) é enviado **apenas na home**, via
`HomeScrollTracker`. A página da matéria não rastreia scroll.
