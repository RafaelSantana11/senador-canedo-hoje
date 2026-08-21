import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { AllConfigType } from '../../../config/config.type';
import { StorageRemover } from './storage-remover';

/**
 * Serve aos drivers `s3` **e** `s3-presigned`: nos dois o objeto vive no mesmo
 * bucket e é removido da mesma forma. Duplicar a classe faria a visibilidade e
 * o comportamento de exclusão divergirem conforme o driver ativo — o mesmo
 * motivo pelo qual a ACL de upload está centralizada em `s3-acl.constant.ts`.
 *
 * Usa o endpoint **interno** (`AWS_S3_ENDPOINT`), não o público: quem chama é o
 * backend, não o navegador.
 */
@Injectable()
export class S3StorageRemover implements StorageRemover {
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.s3 = new S3Client({
      region: configService.get('file.awsS3Region', { infer: true }),
      endpoint: configService.get('file.awsS3Endpoint', { infer: true }),
      forcePathStyle: configService.get('file.awsS3ForcePathStyle', {
        infer: true,
      }),
      credentials: {
        accessKeyId: configService.getOrThrow('file.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: configService.getOrThrow('file.secretAccessKey', {
          infer: true,
        }),
      },
    });
  }

  async remove(storedPath: string): Promise<void> {
    if (!storedPath) {
      return;
    }

    // `DeleteObject` no S3 é idempotente: apagar key inexistente responde 204.
    // Não há caso "já não existe" a tratar aqui — ao contrário do driver local.
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow('file.awsDefaultS3Bucket', {
          infer: true,
        }),
        Key: storedPath,
      }),
    );
  }
}
