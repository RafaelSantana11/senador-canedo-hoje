import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';

import { BannerPositionEnum } from '../banner-position.enum';

export class ServeBannersDto {
  /**
   * Lista separada por vírgula: `?positions=top,aside`. Omitido, devolve as
   * quatro posições.
   *
   * Posição desconhecida é **recusada** (`422 positionsInvalid`) em vez de
   * ignorada: `?positions=lateral` respondendo `{}` faria o portal concluir que
   * não há anúncio, quando na verdade o nome estava errado.
   */
  @ApiPropertyOptional({
    type: String,
    example: 'top,aside',
    description: `Lista separada por vírgula. Valores: ${Object.values(
      BannerPositionEnum,
    ).join(', ')}.`,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((position) => position.trim())
          .filter(Boolean)
      : value,
  )
  @IsArray({ message: 'positionsInvalid' })
  @IsEnum(BannerPositionEnum, { each: true, message: 'positionsInvalid' })
  positions?: BannerPositionEnum[];
}
