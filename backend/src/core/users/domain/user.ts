import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../roles/domain/role';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatusEnum } from '../infrastructure/persistence/relational/entities/user.entity';
import { FileType } from 'src/infra/files/domain/file';
import { Author } from '../../authors/domain/author';

const idType = Number;

export class User {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'Doe Inc.',
    nullable: true,
  })
  legalName?: string | null;

  @ApiProperty({
    type: () => FileType,
    nullable: true,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  /**
   * Perfil editorial 1:1. Não é coluna de `user` — é preenchido pelo service
   * onde o front precisa dele: na resposta do signup (`POST /users`) e em
   * `GET /auth/me`, para exibir quem está logado e pré-preencher o autor ao
   * criar notícia (Parte 4).
   */
  @ApiPropertyOptional({
    type: () => Author,
    nullable: true,
  })
  author?: Author | null;

  @ApiProperty({
    enum: UserStatusEnum,
    example: UserStatusEnum.ACTIVE,
  })
  status: UserStatusEnum;

  @ApiProperty({
    type: Date,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  trialStartDate: Date | null;

  @ApiProperty({
    type: String,
    nullable: true,
  })
  @Expose({ groups: ['me', 'admin'] })
  @Exclude({ toPlainOnly: true })
  messageApiKey: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
