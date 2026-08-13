import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryTagDto {
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
    type: String,
    description: 'Busca por parte do nome (`ILIKE`), para o autocomplete.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
