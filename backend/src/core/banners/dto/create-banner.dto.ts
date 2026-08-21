import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { FileDto } from '../../../infra/files/dto/file.dto';
import { IsAbsent } from '../../../utils/validators/is-absent.validator';
import { BannerPositionEnum } from '../banner-position.enum';

export class BannerItemDto {
  /**
   * Referência a um arquivo **já enviado** (`POST /api/v1/files/upload`), no
   * formato `{ "id": "<uuid>" }` — não é URL em texto. Mesmo padrão de
   * `News.cover` e de `User.photo`.
   */
  @ApiProperty({ type: () => FileDto })
  @ValidateNested()
  @Type(() => FileDto)
  file: FileDto;

  @ApiPropertyOptional({
    type: Number,
    default: 5000,
    description: 'Milissegundos em tela. Mínimo 500, máximo 5 minutos.',
  })
  @IsOptional()
  @IsInt({ message: 'durationMsInvalid' })
  @Min(500, { message: 'durationMsInvalid' })
  @Max(300000, { message: 'durationMsInvalid' })
  durationMs?: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString({ message: 'linkUrlInvalid' })
  @MaxLength(2048, { message: 'linkUrlTooLong' })
  linkUrl?: string | null;

  @ApiPropertyOptional({
    type: Number,
    default: 0,
    description:
      'Posição no carrossel. Omitido, cai para o índice do item no array ' +
      'enviado — a ordem em que o painel montou a lista.',
  })
  @IsOptional()
  @IsInt({ message: 'orderInvalid' })
  @Min(0, { message: 'orderInvalid' })
  order?: number;
}

export class CreateBannerDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString({ message: 'titleInvalid' })
  @IsNotEmpty({ message: 'titleRequired' })
  @MaxLength(200, { message: 'titleTooLong' })
  title: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'AutoMax',
    description:
      'Nome do anunciante, texto livre. **Não** é entidade própria — não há ' +
      'cadastro de anunciantes neste escopo.',
  })
  @IsOptional()
  @IsString({ message: 'advertiserInvalid' })
  @MaxLength(200, { message: 'advertiserTooLong' })
  advertiser?: string | null;

  @ApiProperty({ enum: BannerPositionEnum })
  @IsEnum(BannerPositionEnum, { message: 'positionInvalid' })
  position: BannerPositionEnum;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean({ message: 'activeInvalid' })
  active?: boolean;

  @ApiPropertyOptional({
    type: () => [BannerItemDto],
    description:
      'Itens do carrossel. No `PATCH`, enviar `items` **substitui a lista ' +
      'inteira**; omitir mantém a atual — mesma semântica de `tags` em News.',
  })
  @IsOptional()
  @IsArray({ message: 'itemsInvalid' })
  @ValidateNested({ each: true })
  @Type(() => BannerItemDto)
  items?: BannerItemDto[];

  /**
   * Campo do protótipo do painel que **precisa parar de ser enviado**: `Ad.image`
   * era a URL da imagem digitada à mão. Agora a imagem é um arquivo do acervo,
   * referenciado dentro de `items[].file.id`.
   *
   * Recusado em vez de ignorado: o `whitelist: true` do ValidationPipe global
   * apagaria em silêncio e o painel acreditaria ter salvado a imagem.
   */
  @ApiHideProperty()
  @IsAbsent()
  image?: never;

  /** `Ad.link` do protótipo virou `items[].linkUrl` — é por item, não por campanha. */
  @ApiHideProperty()
  @IsAbsent()
  link?: never;

  /** `Ad.placement` do protótipo era rótulo legível; virou `position` (enum). */
  @ApiHideProperty()
  @IsAbsent()
  placement?: never;
}
