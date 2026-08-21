import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';

import { BannerPositionEnum } from '../banner-position.enum';

export class QueryBannerDto {
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

  @ApiPropertyOptional({ enum: BannerPositionEnum })
  @IsOptional()
  @IsEnum(BannerPositionEnum, { message: 'positionInvalid' })
  position?: BannerPositionEnum;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Query param chega como texto: aceita `true` / `false`.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'activeInvalid' })
  active?: boolean;
}
