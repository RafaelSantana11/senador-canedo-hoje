import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export const NEWS_VIEWS_MAX_IDS = 100;

export class QueryNewsViewsDto {
  /**
   * Lista separada por vírgula: `?ids=<uuid>,<uuid>`. Repetidos contam uma vez.
   *
   * Acima do teto a requisição é **recusada** (`422 idsTooMany`), não truncada:
   * cortar em silêncio faria o cliente concluir que as notícias de fora do corte
   * não têm contagem.
   *
   * O `= []` cobre o `ids` ausente: sem ele, cada validador abaixo falharia
   * sozinho sobre `undefined` e o erro sairia com o código repetido.
   */
  @ApiProperty({
    type: String,
    example:
      'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae,0b0e7c0e-5d1a-4a8e-9f0e-2f6f8d5c1a11',
    description: `Ids (uuid) separados por vírgula. Máximo de ${NEWS_VIEWS_MAX_IDS}.`,
  })
  @Transform(({ value }) => {
    const raw: unknown[] = Array.isArray(value) ? value : [value];

    return [
      ...new Set(
        raw
          .filter((item): item is string => typeof item === 'string')
          .flatMap((item) => item.split(','))
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];
  })
  @IsArray({ message: 'idsInvalid' })
  @ArrayNotEmpty({ message: 'idsInvalid' })
  @ArrayMaxSize(NEWS_VIEWS_MAX_IDS, { message: 'idsTooMany' })
  @IsUUID(undefined, { each: true, message: 'idsInvalid' })
  ids: string[] = [];
}
