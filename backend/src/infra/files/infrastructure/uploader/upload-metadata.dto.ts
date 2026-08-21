import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Campos de texto que acompanham o binário no `multipart/form-data`.
 *
 * `width`/`height` vêm do **cliente** por decisão explícita (contingência 2 da
 * spec da Parte 5): extrair do binário exigiria ler os bytes, e o servidor só os
 * tem no driver `local` — no `s3` o multer transmite direto para o bucket e no
 * `s3-presigned` o navegador envia sem passar pela API. Aceitar do cliente é o
 * único caminho que dá o mesmo resultado nos três drivers, sem dependência nova.
 *
 * Consequência assumida: é dado **declarado**, não derivado. Por isso `width` e
 * `height` não entram na lista de `readOnlyField` do upload — mas continuam
 * recusados no `PATCH`, onde já não haveria como conferir com o binário.
 */
export class UploadMetadataDto {
  @ApiPropertyOptional({
    type: Number,
    description:
      'Largura em pixels da imagem enviada. Campo de texto do multipart — ' +
      'o navegador obtém de `naturalWidth` antes do envio.',
    example: 1920,
  })
  @IsOptional()
  // Todo campo de multipart chega como string; sem isto, `@IsInt` sempre falha.
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : +value,
  )
  @IsInt({ message: 'widthInvalid' })
  @Min(1, { message: 'widthInvalid' })
  @Max(100000, { message: 'widthInvalid' })
  width?: number;

  @ApiPropertyOptional({ type: Number, example: 1080 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : +value,
  )
  @IsInt({ message: 'heightInvalid' })
  @Min(1, { message: 'heightInvalid' })
  @Max(100000, { message: 'heightInvalid' })
  height?: number;
}
