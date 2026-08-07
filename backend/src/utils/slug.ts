/**
 * Converte um texto livre em slug de URL: minúsculas, sem acentos, separado por
 * hífens. Usado para gerar o `slug` do `Author` a partir do `User.name`.
 *
 * Não garante unicidade — quem chama precisa resolver colisão (ver
 * `AuthorsService.generateUniqueSlug`, que sufixa com `-2`, `-3`, ...).
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    // remove os diacríticos que o NFD separou (é -> e + U+0301)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    // o slice pode ter deixado um hífen solto no fim
    .replace(/-+$/g, '');
