import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Taxonomia estrutural do portal: toda notícia pertence a exatamente uma
 * categoria. Sem soft delete — a regra de negócio impede apagar categoria em
 * uso, e `active: false` é a saída para tirar da vitrine o que não se pode
 * apagar.
 */
export class Category {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: String, example: 'Política' })
  name: string;

  @ApiProperty({
    type: String,
    example: 'politica',
    description: 'Identificador público na URL. Gerado do nome quando omitido.',
  })
  slug: string;

  @ApiProperty({ type: String, nullable: true, example: 'Cobertura política.' })
  description: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '#3b82f6',
    description: 'Cor de exibição em hex. Só o formato é validado.',
  })
  color: string | null;

  @ApiProperty({
    type: Boolean,
    example: true,
    description:
      'Categoria inativa continua vinculada às notícias e continua visível ' +
      'na listagem autenticada — ela apenas não aparece na listagem pública.',
  })
  active: boolean;

  /**
   * Derivado e read-only: `COUNT` feito na própria query da listagem (não é
   * coluna). Só vem preenchido em `GET /categories`; aninhada dentro de uma
   * notícia, a categoria não carrega contagem.
   */
  @ApiPropertyOptional({
    type: Number,
    example: 12,
    description:
      'Quantas notícias usam esta categoria. Calculado pelo servidor; ' +
      'recusado com `readOnlyField` se enviado no payload.',
  })
  newsCount?: number;

  @ApiProperty()
  createdAt: Date;
}
