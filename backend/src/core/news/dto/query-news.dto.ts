import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { NewsStatusEnum } from '../news-status.enum';

export class QueryNewsDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 15 })
  @Transform(({ value }) => (value ? Number(value) : 15))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Slug da categoria (não o id).',
    example: 'politica',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  category?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Slug da tag (não o id).',
    example: 'eleicoes-2026',
  })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  tag?: string;

  @ApiPropertyOptional({
    enum: NewsStatusEnum,
    description:
      '⚠️ **Ignorado sem autenticação**: a listagem pública devolve apenas ' +
      '`published`, mesmo que venha `?status=draft`.',
  })
  @IsOptional()
  @IsEnum(NewsStatusEnum, { message: 'statusInvalid' })
  status?: NewsStatusEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Busca `ILIKE` em título e resumo (não é full-text search).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
