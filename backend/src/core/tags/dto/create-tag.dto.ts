import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { IsAbsent } from '../../../utils/validators/is-absent.validator';
import {
  HEX_COLOR_REGEX,
  SLUG_REGEX,
} from '../../categories/dto/create-category.dto';

export class CreateTagDto {
  @ApiProperty({ type: String, example: 'Eleições 2026' })
  @IsString({ message: 'nameInvalid' })
  @IsNotEmpty({ message: 'nameRequired' })
  @MaxLength(120, { message: 'nameTooLong' })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'eleicoes-2026',
    description: 'Quando omitido, é gerado a partir do nome.',
  })
  @IsOptional()
  @IsString({ message: 'slugInvalid' })
  @MinLength(2, { message: 'slugTooShort' })
  @MaxLength(140, { message: 'slugTooLong' })
  @Matches(SLUG_REGEX, { message: 'slugInvalidFormat' })
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: 'descriptionInvalid' })
  @MaxLength(2000, { message: 'descriptionTooLong' })
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '#3b82f6' })
  @IsOptional()
  @IsString({ message: 'colorInvalid' })
  @Matches(HEX_COLOR_REGEX, { message: 'colorInvalidFormat' })
  color?: string | null;

  /**
   * Declarado só para ser recusado. O protótipo do painel manda
   * `usageCount: 0` ao criar e o valor atual ao editar — enviar contador é
   * escrever um número que só o servidor sabe calcular.
   */
  @ApiHideProperty()
  @IsAbsent()
  usageCount?: never;
}
