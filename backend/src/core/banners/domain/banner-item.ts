import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/infra/files/domain/file';

/** Um quadro do carrossel de uma campanha. */
export class BannerItem {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: () => FileType })
  file: FileType;

  @ApiProperty({
    type: Number,
    example: 5000,
    description:
      'Tempo em tela, em **milissegundos** — a unidade de `setInterval` e das ' +
      'libs de slider, para não sobrar conversão no consumo.',
  })
  durationMs: number;

  @ApiProperty({ type: String, nullable: true, example: 'https://exemplo.com' })
  linkUrl: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Ordem explícita no carrossel (`order ASC`).',
  })
  order: number;
}
