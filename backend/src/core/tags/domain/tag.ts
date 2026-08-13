import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Etiqueta transversal de assunto, N:N com News.
 *
 * ⚠️ Construída à frente da demanda, de propósito: o site público não consome
 * tags em lugar nenhum hoje (não há filtro, página nem exibição) — só existe a
 * tela do painel. A API existe porque a especificação do módulo a prevê.
 */
export class Tag {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: String, example: 'Eleições 2026' })
  name: string;

  @ApiProperty({ type: String, example: 'eleicoes-2026' })
  slug: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: String, nullable: true, example: '#3b82f6' })
  color: string | null;

  /**
   * Derivado e read-only: quantas notícias usam a tag, contado na própria query
   * da listagem. Não é coluna — não existe contador materializado que possa
   * divergir da realidade.
   */
  @ApiPropertyOptional({
    type: Number,
    example: 4,
    description:
      'Quantas notícias usam esta tag. Calculado pelo servidor; recusado ' +
      'com `readOnlyField` se enviado no payload.',
  })
  usageCount?: number;

  @ApiProperty()
  createdAt: Date;
}
