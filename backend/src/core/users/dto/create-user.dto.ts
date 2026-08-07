import {
  // decorators here
  Transform,
  Type,
} from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  // decorators here
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RoleDto } from '../../roles/dto/role.dto';
import { CreateAuthorDto } from '../../authors/dto/create-author.dto';
import { lowerCaseTransformer } from '../../../utils/transformers/lower-case.transformer';
import { UserStatusEnum } from '../infrastructure/persistence/relational/entities/user.entity';
import { FileDto } from 'src/infra/files/dto/file.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string | null;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  provider?: string;

  socialId?: string | null;

  @ApiProperty({ example: 'John Doe Company', type: String })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'John Doe Company LTDA', type: String })
  @IsString()
  @IsOptional()
  legalName?: string | null;

  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  photo?: FileDto | null;

  @ApiPropertyOptional({ type: RoleDto })
  @IsOptional()
  @Type(() => RoleDto)
  role?: RoleDto | null;

  @ApiPropertyOptional({ enum: UserStatusEnum })
  @IsOptional()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageApiKey?: string | null;

  /**
   * Campos editoriais do `Author` que nasce junto deste usuário. Opcional: se
   * omitido, o autor é criado mesmo assim, com `bio: null` e
   * `isColumnist: false`. O `slug` é gerado a partir do `name`.
   */
  @ApiPropertyOptional({ type: () => CreateAuthorDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAuthorDto)
  author?: CreateAuthorDto;
}
