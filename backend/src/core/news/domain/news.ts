import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/infra/files/domain/file';

import { Author } from '../../authors/domain/author';
import { Category } from '../../categories/domain/category';
import { Tag } from '../../tags/domain/tag';
import { NewsStatusEnum } from '../news-status.enum';

/**
 * ⚠️ Serialização em rota pública: `author` é o domain `Author`, que já chega
 * **achatado** (`name` e `photo` copiados do `User`, sem aninhar o `User`). É o
 * que impede `email`, `provider`, `socialId` e `trialStartDate` de vazarem por
 * dentro de uma notícia — a mesma armadilha que `GET /authors` teve.
 * Se algum dia `author` passar a carregar o `User`, este comentário é o aviso:
 * a rota pública de notícias vaza junto.
 */
export class News {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({ type: String })
  title: string;

  @ApiProperty({
    type: String,
    example: 'congresso-aprova-nova-reforma',
    description:
      'Gerado do título quando omitido, com sufixo em caso de colisão.',
  })
  slug: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Resumo / linha fina. É o `excerpt` do painel.',
  })
  summary: string | null;

  @ApiProperty({
    type: String,
    description: 'Conteúdo em **markdown** — o servidor não renderiza HTML.',
  })
  body: string;

  @ApiPropertyOptional({ type: () => FileType, nullable: true })
  cover?: FileType | null;

  @ApiProperty({ enum: NewsStatusEnum, example: NewsStatusEnum.published })
  status: NewsStatusEnum;

  @ApiProperty({
    type: Date,
    nullable: true,
    description:
      'Carimbado na primeira publicação e preservado depois — republicar ou ' +
      'voltar para rascunho não reescreve a data original.',
  })
  publishedAt: Date | null;

  @ApiProperty({ type: () => Category })
  category: Category;

  @ApiProperty({ type: () => Author })
  author: Author;

  @ApiProperty({ type: () => [Tag] })
  tags: Tag[];

  @ApiProperty({
    type: Number,
    description:
      'Retrato do momento da leitura — sob cache, fica defasado. A contagem ' +
      'atual vem de `GET /news/views`; a visita se registra em ' +
      '`POST /news/:id/views`.',
  })
  views: number;

  @ApiProperty({
    type: Object,
    nullable: true,
    description:
      'Objeto JSON livre (≤ 16 KB) que o backend guarda e devolve sem ' +
      'interpretar. Carrega as regras de vitrine que o front define.',
  })
  config: Record<string, unknown> | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
