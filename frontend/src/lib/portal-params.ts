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
//  Footer / Contato
// ─────────────────────────────────────────────────────────────

/** Número de WhatsApp (formato internacional, apenas dígitos) usado nos
 *  links "Anuncie conosco" e "Entre em contato" do rodapé do portal.
 *  Ex.: 5562912345678 (55 + DDD 62 + número) */
export const WHATSAPP_NUMBER = "556200000000"
