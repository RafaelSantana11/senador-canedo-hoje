import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';
import { MediaTypeEnum, resolveMediaType } from '../media-type.enum';
import { FileUploader } from './file-uploader';

export class FileType {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @Allow()
  id: string;

  @ApiProperty({
    type: String,
    description:
      'URL pública e estável do arquivo, pronta para uso direto no `src` de uma <img>. ' +
      'Não expira. No banco persiste-se apenas a key do objeto; esta URL é montada na ' +
      'serialização a partir de AWS_S3_PUBLIC_URL.',
    example: 'http://localhost:9000/senador-canedo-hoje/a1b2c3d4e5f6.png',
  })
  @Transform(
    ({ value }) => {
      if (!value) {
        return value;
      }

      const config = fileConfig() as FileConfig;

      if (config.driver === FileDriver.LOCAL) {
        return (appConfig() as AppConfig).backendDomain + value;
      }

      if ([FileDriver.S3, FileDriver.S3_PRESIGNED].includes(config.driver)) {
        // A URL pública é montada por env, não derivada de endpoint+bucket+key:
        // MinIO usa path-style (host/bucket/key), o DigitalOcean Spaces usa
        // virtual-hosted (bucket.regiao.../key) e o CDN do Spaces usa outro host
        // ainda. Não existe fórmula única, por isso a base vem pronta em
        // AWS_S3_PUBLIC_URL — trocar de provedor/região ou ligar o CDN passa a
        // ser mudança de env, sem migração de dados.
        //
        // Deliberadamente NÃO se usa URL pré-assinada aqui: os objetos são
        // públicos (ACL public-read no upload + policy de leitura no bucket) e
        // uma URL assinada expiraria em 1h, quebrando cache de navegador/CDN e
        // qualquer link que o front tenha persistido.
        if (config.awsS3PublicUrl) {
          return `${config.awsS3PublicUrl.replace(/\/+$/, '')}/${value}`;
        }

        // Sem AWS_S3_PUBLIC_URL configurada, devolve a key crua em vez de uma
        // URL inválida — deixa o erro de configuração evidente no payload.
        return value;
      }

      return value;
    },
    {
      toPlainOnly: true,
    },
  )
  path: string;

  /**
   * `image` / `video` / `document` **derivado do `mimeType`** na serialização —
   * não existe coluna `type` na tabela `file`. É o campo que o filtro do acervo
   * (`GET /files?type=image`) usa.
   *
   * `null` para os arquivos anteriores à Parte 5, que subiram sem `mimeType`.
   *
   * O `@Expose()` é o que faz a propriedade aparecer no payload mesmo sem nunca
   * ser atribuída pelo mapper: sem ele, `instanceToPlain` só enxergaria as
   * chaves realmente presentes na instância e `type` sumiria da resposta.
   */
  @ApiPropertyOptional({ enum: MediaTypeEnum, nullable: true })
  @Expose()
  @Transform(({ obj }) => resolveMediaType(obj.mimeType), { toPlainOnly: true })
  type?: MediaTypeEnum | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'fachada-do-congresso.png',
    description:
      'Nome do arquivo como veio da máquina de quem subiu. A key gravada no ' +
      'storage é aleatória, então sem isto o acervo fica ilegível.',
  })
  originalName?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'image/png',
    description: 'Detectado no upload. É de onde `type` é derivado.',
  })
  mimeType?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1468006,
    description:
      'Tamanho em **bytes**, número — não string formatada. `"1.4 MB"` é ' +
      'apresentação e é o cliente quem formata.',
  })
  sizeBytes?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1920,
    description:
      'Largura em pixels. Informada pelo cliente no upload (o servidor não lê ' +
      'o binário) — `null` quando não enviada ou quando não é imagem.',
  })
  width?: number | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    example: 1080,
    description: 'Altura em pixels. Mesma origem de `width`.',
  })
  height?: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Fachada do Congresso',
    description: 'Rótulo editável do acervo. Editável por `PATCH /files/:id`.',
  })
  title?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Fachada do Congresso Nacional ao entardecer',
    description:
      'Texto alternativo (acessibilidade/SEO). Editável por `PATCH /files/:id` ' +
      'e é o `alt` que a entrega pública de banners devolve.',
  })
  alt?: string | null;

  /**
   * ⚠️ **Não vaza em rota pública por construção**: a relação `uploadedBy` NÃO é
   * `eager` na entidade, então só é carregada pelas queries do acervo (que são
   * autenticadas). Em `GET /news` e em `GET /banners/serve` o arquivo chega sem
   * ela, e a propriedade nem aparece no JSON.
   */
  @ApiPropertyOptional({ type: () => FileUploader, nullable: true })
  uploadedBy?: FileUploader | null;

  @ApiPropertyOptional({ type: Date })
  createdAt?: Date;

  @ApiPropertyOptional({ type: Date })
  updatedAt?: Date;
}
