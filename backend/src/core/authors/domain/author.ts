import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/infra/files/domain/file';

/**
 * Perfil editorial público de um usuário do dashboard. Relação 1:1 obrigatória
 * com `User` — não existe `Author` órfão nem `User` sem `Author`.
 *
 * ⚠️ Serialização: `name` e `photo` moram no `User` (fonte única de verdade) e
 * chegam aqui **achatados**, copiados pelo mapper. O `User` NÃO é aninhado de
 * propósito: `GET /authors` e `GET /authors/:slug` são rotas públicas, e o
 * domain `User` tem campos sob `@Expose({ groups: ['me','admin'] })` (email,
 * provider, socialId, trialStartDate) que não podem vazar. Achatando, não há
 * caminho por onde vazar — nem se alguém esquecer o `@SerializeOptions`.
 */
export class Author {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'mariana-costa',
    description: 'Identificador público, gerado a partir do nome do usuário.',
  })
  slug: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Repórter de política há 12 anos.',
  })
  bio: string | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description:
      'Marca os autores que aparecem na seção "Colunistas" do portal. ' +
      'É atributo editorial, não permissão de acesso.',
  })
  isColumnist: boolean;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Id do `User` dono deste perfil (relação 1:1).',
  })
  userId: number | string;

  @ApiProperty({
    type: String,
    example: 'Mariana Costa',
    description: 'Copiado de `User.name` — não é coluna da tabela `author`.',
  })
  name: string;

  @ApiPropertyOptional({
    type: () => FileType,
    nullable: true,
    description: 'Copiado de `User.photo` — não é coluna da tabela `author`.',
  })
  photo?: FileType | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
