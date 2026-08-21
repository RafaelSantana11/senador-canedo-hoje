import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileType } from '../../../domain/file';
import { UploadRegistrarService } from '../upload-registrar.service';

@Injectable()
export class FilesS3Service {
  constructor(private readonly uploadRegistrar: UploadRegistrarService) {}

  async create(
    file: Express.MulterS3.File,
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

    return {
      file: await this.uploadRegistrar.register({
        // Só a key: a URL pública é montada na serialização.
        path: file.key,
        originalName: file.originalname,
        // `contentType` é o que o multer-s3 realmente gravou no objeto
        // (`AUTO_CONTENT_TYPE`); `mimetype` é o que o navegador declarou. Vale
        // o primeiro, com o segundo como reserva.
        mimeType: file.contentType ?? file.mimetype,
        sizeBytes: file.size,
        width: metadata.width,
        height: metadata.height,
        userId,
      }),
    };
  }
}
