import { PartialType } from '@nestjs/swagger';

import { CreateTagDto } from './create-tag.dto';

/**
 * `PATCH` existe divergindo da especificação original do módulo (que previa só
 * GET/POST/DELETE): com `description` e `color` editáveis, "apaga e cria"
 * deixaria de ser equivalente — perderia as associações N:N da tag com as
 * notícias.
 */
export class UpdateTagDto extends PartialType(CreateTagDto) {}
