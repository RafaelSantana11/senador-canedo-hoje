import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FileDto } from 'src/infra/files/dto/file.dto';

export class UpdateAuthorDto {
  /**
   * ⚠️ `name` e `photo` **não são colunas de `author`** — gravam em `User.name` e
   * `User.photo`, a fonte única de verdade (ver `domain/author.ts`). Estão aqui
   * porque a tela de autores edita nome, foto e bio na mesma requisição; sem
   * eles, `whitelist: true` descartava os campos em silêncio e a API respondia
   * `200` com o autor inalterado.
   */
  @ApiPropertyOptional({
    type: String,
    example: 'Mariana Costa',
    description:
      'Nome de exibição do autor. Grava em `User.name`. ' +
      'Mudar o nome NÃO regenera o slug — isso quebraria links já publicados ' +
      'do perfil; para trocar o slug, envie-o no mesmo PATCH.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Repórter de política há 12 anos.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Se o autor aparece na seção "Colunistas" do portal.',
  })
  @IsOptional()
  @IsBoolean()
  isColumnist?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: 'mariana-costa',
    description:
      'Identificador público na URL. Minúsculas, números e hífens. ' +
      'Mudar o slug quebra links já publicados para o perfil.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slugInvalidFormat',
  })
  slug?: string;

  @ApiPropertyOptional({
    type: () => FileDto,
    nullable: true,
    description:
      'Foto do autor. Grava em `User.photo`. Referência a um arquivo já ' +
      'enviado (`POST /api/v1/files/upload`), no formato `{ "id": "<uuid>" }` ' +
      '— não é URL em texto. Envie `null` para remover a foto.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  photo?: FileDto | null;
}
