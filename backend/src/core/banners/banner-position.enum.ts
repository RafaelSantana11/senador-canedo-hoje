/**
 * Posições fixas da vitrine publicitária (`context.md` 4.7). Enum, não texto
 * livre: o portal tem um número conhecido de espaços e a entrega pública agrupa
 * por eles.
 *
 * ⚠️ O protótipo do painel usa **rótulos legíveis** (`"Topo (Leaderboard)"`,
 * `"Lateral (Box)"`, `"Rodapé"`) como valor do campo `placement`. Esses rótulos
 * são apresentação e não trafegam na API — o mapeamento está documentado em
 * `INTEGRACAO-FILES-BANNERS.md`. `middle` não tem equivalente no protótipo.
 */
export enum BannerPositionEnum {
  top = 'top',
  middle = 'middle',
  aside = 'aside',
  bottom = 'bottom',
}

export const BANNER_POSITIONS = Object.values(BannerPositionEnum);
