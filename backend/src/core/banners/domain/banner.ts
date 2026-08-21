import { ApiProperty } from '@nestjs/swagger';

import { BannerPositionEnum } from '../banner-position.enum';
import { BannerItem } from './banner-item';

/**
 * Campanha publicitária — **a visão administrativa**. Tudo aqui é autenticado.
 *
 * ⚠️ `advertiser`, `active` e os ids de campanha **não podem** aparecer na
 * entrega pública: `GET /banners/serve` tem forma própria
 * (`domain/public-banner.ts`) justamente para que não exista caminho por onde
 * este objeto escape para o portal. Mesmo cuidado que a Parte 4 teve com
 * `email` em `GET /news`.
 */
export class Banner {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: String, example: 'Campanha Black Friday' })
  title: string;

  @ApiProperty({ type: String, nullable: true, example: 'AutoMax' })
  advertiser: string | null;

  @ApiProperty({ enum: BannerPositionEnum, example: BannerPositionEnum.top })
  position: BannerPositionEnum;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Único controle de exibição — não há agendamento por data.',
  })
  active: boolean;

  @ApiProperty({
    type: () => [BannerItem],
    description:
      'Itens do carrossel, já em `order ASC`. Gerenciados aninhados no ' +
      'payload da campanha, não por rotas próprias.',
  })
  items: BannerItem[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
