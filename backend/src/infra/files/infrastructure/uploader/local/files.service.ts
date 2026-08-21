import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';
import { UploadRegistrarService } from '../upload-registrar.service';

@Injectable()
export class FilesLocalService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly uploadRegistrar: UploadRegistrarService,
  ) {}

  async create(
    file: Express.Multer.File,
    metadata: { width?: number; height?: number } = {},
    userId?: number | string | null,
  ): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const apiPrefix = this.configService.get('app.apiPrefix', { infer: true });

    return {
      file: await this.uploadRegistrar.register({
        // ⚠️ O segmento `download/` é o que resolve o conflito de rota com
        // `GET /files/:id` do acervo — ver o comentário em `files.controller.ts`
        // deste driver. Antes da Parte 5 a rota era `/{prefix}/v1/files/<nome>`;
        // a migration reescreve os `path` antigos para o formato novo.
        path: `/${apiPrefix}/v1/files/download/${file.filename}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: metadata.width,
        height: metadata.height,
        userId,
      }),
    };
  }
}
