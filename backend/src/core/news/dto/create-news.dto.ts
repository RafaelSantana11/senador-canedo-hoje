import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { FileDto } from '../../../infra/files/dto/file.dto';
import { IsAbsent } from '../../../utils/validators/is-absent.validator';
import { MaxJsonSize } from '../../../utils/validators/max-json-size.validator';
import { SLUG_REGEX } from '../../categories/dto/create-category.dto';
import { NewsStatusEnum } from '../news-status.enum';

/** 16 KB. Campo livre sem teto é convite a payload abusivo. */
export const CONFIG_MAX_BYTES = 16 * 1024;

export class CategoryRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsString({ message: 'categoryInvalid' })
  @IsNotEmpty({ message: 'categoryRequired' })
  id: string;
}

export class TagRefDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsString({ message: 'tagInvalid' })
  @IsNotEmpty({ message: 'tagRequired' })
  id: string;
}

export class CreateNewsDto {
  @ApiProperty({ type: String, maxLength: 300 })
  @IsString({ message: 'titleInvalid' })
  @IsNotEmpty({ message: 'titleRequired' })
  @MaxLength(300, { message: 'titleTooLong' })
  title: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Quando omitido, é gerado a partir do título.',
  })
  @IsOptional()
  @IsString({ message: 'slugInvalid' })
  @MinLength(2, { message: 'slugTooShort' })
  @MaxLength(320, { message: 'slugTooLong' })
  @Matches(SLUG_REGEX, { message: 'slugInvalidFormat' })
  slug?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Resumo / linha fina — o `excerpt` do painel.',
  })
  @IsOptional()
  @IsString({ message: 'summaryInvalid' })
  @MaxLength(1000, { message: 'summaryTooLong' })
  summary?: string | null;

  @ApiProperty({ type: String, description: 'Markdown.' })
  @IsString({ message: 'bodyInvalid' })
  @IsNotEmpty({ message: 'bodyRequired' })
  body: string;

  /**
   * Referência a um arquivo já enviado (`POST /api/v1/files/upload`), no formato
   * `{ "id": "<uuid>" }` — **não** é URL em texto. Mesmo padrão do `photo` do
   * usuário.
   */
  @ApiPropertyOptional({ type: () => FileDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileDto)
  cover?: FileDto | null;

  @ApiPropertyOptional({
    enum: NewsStatusEnum,
    default: NewsStatusEnum.draft,
    description: 'Publicar já é enviar `published`; o default é `draft`.',
  })
  @IsOptional()
  @IsEnum(NewsStatusEnum, { message: 'statusInvalid' })
  status?: NewsStatusEnum;

  @ApiProperty({ type: () => CategoryRefDto })
  @ValidateNested()
  @Type(() => CategoryRefDto)
  category: CategoryRefDto;

  @ApiPropertyOptional({ type: () => [TagRefDto] })
  @IsOptional()
  @IsArray({ message: 'tagsInvalid' })
  @ValidateNested({ each: true })
  @Type(() => TagRefDto)
  tags?: TagRefDto[];

  /**
   * Objeto JSON livre. O backend valida **só o tamanho** — nunca as chaves de
   * dentro: é exatamente essa liberdade que faz o campo existir. O que estiver
   * aqui volta igual na resposta.
   */
  @ApiPropertyOptional({
    type: Object,
    description:
      'JSON livre (≤ 16 KB). Guardado e devolvido sem interpretação. ' +
      'Garantir unicidade de espaço na vitrine é responsabilidade do cliente.',
    example: { position: 'destaque', positionOrder: 0, breaking: true },
  })
  @IsOptional()
  @IsObject({ message: 'configInvalid' })
  @MaxJsonSize(CONFIG_MAX_BYTES, { message: 'configTooLarge' })
  config?: Record<string, unknown>;

  /**
   * Campos derivados no servidor, recusados se vierem no payload — cada um
   * corresponde a algo que o protótipo do painel manda hoje e precisa parar de
   * mandar:
   *
   * - `author`: o painel manda texto livre (`"Redação"`); passa a ser o
   *   `Author` do usuário autenticado.
   * - `views`: contador; só o servidor incrementa.
   * - `publishedAt`: carimbado na transição de status.
   */
  @ApiHideProperty()
  @IsAbsent()
  author?: never;

  @ApiHideProperty()
  @IsAbsent()
  views?: never;

  @ApiHideProperty()
  @IsAbsent()
  publishedAt?: never;
}
