import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { IsAbsent } from '../../../utils/validators/is-absent.validator';

export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryDto {
  @ApiProperty({ type: String, example: 'Política' })
  @IsString({ message: 'nameInvalid' })
  @IsNotEmpty({ message: 'nameRequired' })
  @MaxLength(120, { message: 'nameTooLong' })
  name: string;

  @ApiPropertyOptional({
    type: String,
    example: 'politica',
    description:
      'Opcional: quando omitido, é gerado a partir do nome (com sufixo ' +
      'numérico em caso de colisão).',
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

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean({ message: 'activeInvalid' })
  active?: boolean;

  /**
   * Declarado só para ser recusado: o painel exibe a contagem de notícias, e
   * enviá-la de volta num `POST`/`PATCH` seria o cliente tentando escrever um
   * número que só o servidor sabe. Ver `IsAbsent`.
   */
  @ApiHideProperty()
  @IsAbsent()
  newsCount?: never;
}
