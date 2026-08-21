import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { MediaTypeEnum } from '../media-type.enum';

export class QueryFileDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    enum: MediaTypeEnum,
    description:
      'Filtra por tipo **derivado do mimetype** — não há coluna `type`. ' +
      'Arquivos anteriores à Parte 5 não têm mimetype e só aparecem sem filtro.',
  })
  @IsOptional()
  @IsEnum(MediaTypeEnum, { message: 'typeInvalid' })
  type?: MediaTypeEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Busca `ILIKE` em `originalName` e `title`.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
