import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { IsAbsent } from '../../../utils/validators/is-absent.validator';

/**
 * O acervo só tem **dois** campos editáveis. Todo o resto do `File` descreve o
 * binário que está no storage: mudar `mimeType` ou `sizeBytes` por `PATCH` não
 * mudaria o arquivo, apenas faria o banco mentir sobre ele.
 *
 * Os derivados são **recusados** (`422 readOnlyField`), não ignorados — mesmo
 * padrão da Parte 4. O `whitelist: true` do ValidationPipe global apagaria em
 * silêncio, e silêncio faz o painel acreditar que gravou.
 *
 * `width`/`height` entram na lista mesmo tendo sido aceitos do cliente no
 * upload: lá havia um binário sendo enviado junto; aqui seria só um número
 * solto, sem nada com que conferir.
 */
export class UpdateFileDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Fachada do Congresso',
  })
  @IsOptional()
  @IsString({ message: 'titleInvalid' })
  @MaxLength(260, { message: 'titleTooLong' })
  title?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Fachada do Congresso Nacional ao entardecer',
    description: 'Texto alternativo — acessibilidade e SEO.',
  })
  @IsOptional()
  @IsString({ message: 'altInvalid' })
  @MaxLength(1000, { message: 'altTooLong' })
  alt?: string | null;

  @ApiHideProperty()
  @IsAbsent()
  path?: never;

  @ApiHideProperty()
  @IsAbsent()
  type?: never;

  @ApiHideProperty()
  @IsAbsent()
  originalName?: never;

  @ApiHideProperty()
  @IsAbsent()
  mimeType?: never;

  @ApiHideProperty()
  @IsAbsent()
  sizeBytes?: never;

  @ApiHideProperty()
  @IsAbsent()
  width?: never;

  @ApiHideProperty()
  @IsAbsent()
  height?: never;

  @ApiHideProperty()
  @IsAbsent()
  uploadedBy?: never;
}
