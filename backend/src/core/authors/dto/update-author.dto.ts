import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAuthorDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Repórter de política há 12 anos.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Se o autor aparece na seção "Colunistas" do portal.',
  })
  @IsOptional()
  @IsBoolean()
  isColumnist?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'mariana-costa',
    description:
      'Identificador público na URL. Minúsculas, números e hífens. ' +
      'Mudar o slug quebra links já publicados para o perfil.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slugInvalidFormat',
  })
  slug?: string;
}
