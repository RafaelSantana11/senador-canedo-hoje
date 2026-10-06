/**
 * portal-params.ts
 *
 * Parâmetros de comportamento do portal. Todos os valores são constantes
 * configuráveis pela equipe editorial — altere aqui e o efeito se propaga
 * em todo o front sem precisar caçar magic numbers espalhados no código.
 */

// ─────────────────────────────────────────────────────────────
//  Home — conteúdo & grade
// ─────────────────────────────────────────────────────────────

/** Quantidade mínima de notícias para o banner "middle" aparecer na grade */
export const MIN_NEWS_FOR_MIDDLE_BANNER = 8

/** Quantas notícias cabem em cada bloco da grade antes de intercalar um banner */
export const BANNER_INTERVAL = 8

/** Notícias secundárias ao lado do hero */
export const HERO_SECONDARY_COUNT = 2

/** Quantidade de itens na seção "Mais lidas" */
export const MOST_READ_COUNT = 5

/** Quantidade de itens na seção "Últimas notícias" */
export const LATEST_COUNT = 5

/** Itens por bloco "Viu isso?" antes de inserir um banner aside */
export const SAW_THIS_BLOCK_SIZE = 5

// ─────────────────────────────────────────────────────────────
//  Detalhes de notícia
// ─────────────────────────────────────────────────────────────

/** Notícias relacionadas exibidas no rodapé de uma matéria */
export const RELATED_NEWS_COUNT = 3

// ─────────────────────────────────────────────────────────────
//  Arquivos — listagens de categoria e tag
// ─────────────────────────────────────────────────────────────

/** Notícias por página nos hubs `/categoria/[slug]` e `/tag/[slug]`. */
export const ARCHIVE_PAGE_SIZE = 12

// ─────────────────────────────────────────────────────────────
//  API — limites de paginação
// ─────────────────────────────────────────────────────────────

/** Notícias carregadas em uma única requisição no portal */
export const PORTAL_NEWS_FETCH_LIMIT = 50

/** Categorias carregadas por requisição (geralmente tudo de uma vez) */
export const CATEGORIES_FETCH_LIMIT = 100

/** Autores carregados por requisição */
export const AUTHORS_FETCH_LIMIT = 50

/** Tags carregadas por requisição */
export const TAGS_FETCH_LIMIT = 100

/** Banners carregados por requisição */
export const BANNERS_FETCH_LIMIT = 50

// ─────────────────────────────────────────────────────────────
//  Identidade Visual — Logo & Nome do Site
// ─────────────────────────────────────────────────────────────

/** Nome do site exibido no header, footer e painel administrativo */
export const SITE_NAME = "Senador Canedo Hoje"

/** URL da imagem do logo (caminho relativo como /logo.png ou URL absoluta).
 *  Quando vazio, apenas o texto do nome do site é exibido. */
export const LOGO_URL = ""

/** Texto alternativo do logo (acessibilidade) */
export const LOGO_ALT = "Senador Canedo Hoje"

/** Exibir o nome do site ao lado do logo no header da home */
export const SHOW_NAME_WITH_LOGO = false

// ─────────────────────────────────────────────────────────────
//  Footer / Contato
// ─────────────────────────────────────────────────────────────

/** Número de WhatsApp (formato internacional, apenas dígitos) usado nos
 *  links "Anuncie conosco" e "Entre em contato" do rodapé do portal.
 *  Ex.: 5562912345678 (55 + DDD 62 + número) */
export const WHATSAPP_NUMBER = "556200000000"

// ─────────────────────────────────────────────────────────────
//  Identidade editorial — dados factuais (JSON-LD, feed e llms.txt)
// ─────────────────────────────────────────────────────────────

/** Cidade de atuação do portal (usada em `areaServed`/`address`). */
export const SITE_CITY = "Senador Canedo"

/** UF da cidade de atuação (usada em `addressRegion`). */
export const SITE_REGION = "GO"

/** País do portal no formato ISO 3166-1 alpha-2 (usado em `addressCountry`). */
export const SITE_COUNTRY = "BR"

/** Perfis oficiais do portal (redes sociais) publicados em `sameAs` no
 *  JSON-LD. Vazio = bloco omitido. Ex.: "https://instagram.com/senadorcanedohoje" */
export const SITE_SOCIAL_LINKS: string[] = []
