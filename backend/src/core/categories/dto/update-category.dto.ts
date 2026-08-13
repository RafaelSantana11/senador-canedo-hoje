import { PartialType } from '@nestjs/swagger';

import { CreateCategoryDto } from './create-category.dto';

/**
 * Todos os campos opcionais. `newsCount` continua herdando o `@IsAbsent` do
 * DTO de criação — o protótipo do front reenvia o objeto inteiro ao editar, e
 * é justamente aí que o contador voltaria no payload.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
