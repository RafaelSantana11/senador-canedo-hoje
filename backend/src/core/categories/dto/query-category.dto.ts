import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class QueryCategoryDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? Number(value) : 50))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Filtra por `active`. **Ignorado sem autenticação**: a listagem pública ' +
      'devolve apenas categorias ativas.',
  })
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
