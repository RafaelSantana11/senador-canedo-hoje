import { PartialType } from '@nestjs/swagger';

import { CreateNewsDto } from './create-news.dto';

/**
 * Todo campo é opcional; o que não vier não é tocado.
 *
 * Dois pontos de contrato que valem lembrar:
 * - `tags: []` **remove** todas as associações; omitir `tags` mantém as atuais.
 * - `cover: null` remove a capa; omitir mantém.
 * - `author`, `views` e `publishedAt` continuam recusados (herdados do DTO de
 *   criação) — nem editando é possível reescrever quem assina ou o contador.
 */
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
