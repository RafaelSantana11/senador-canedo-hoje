import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Transform } from 'class-transformer';
import fileConfig from '../config/file.config';
import { FileConfig, FileDriver } from '../config/file-config.type';

import { AppConfig } from '../../config/app-config.type';
import appConfig from '../../config/app.config';

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
}
