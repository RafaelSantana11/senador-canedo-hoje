import { Injectable } from '@nestjs/common';

import { AuthorsService } from '../../../../core/authors/authors.service';
import { FileType } from '../../domain/file';
import { FileRepository } from '../persistence/file.repository';

export type RegisterUploadInput = {
  /** Key no bucket (drivers s3) ou rota de serviço (driver local). */
  path: string;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  /** `request.user.id` — de onde `uploadedBy` é resolvido. */
  userId?: number | string | null;
};

/**
 * Grava a linha de `file` a partir de um upload já concluído.
 *
 * Existe para que os **três** drivers gravem o mesmo conjunto de metadados: o
 * que varia entre eles é de onde os dados saem (objeto do multer, objeto do
 * multer-s3, ou o payload declarado no fluxo pré-assinado), não o que é gravado.
 *
 * Fica em módulo próprio (`UploadRegistrarModule`) e não em `FilesService`
 * porque `FilesModule` é quem importa o módulo do driver — o driver não pode
 * importar `FilesModule` de volta sem fechar ciclo.
 */
@Injectable()
export class UploadRegistrarService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly authorsService: AuthorsService,
  ) {}

  async register(input: RegisterUploadInput): Promise<FileType> {
    return this.fileRepository.create({
      path: input.path,
      originalName: input.originalName ?? null,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      uploadedById: await this.resolveUploaderId(input.userId),
    });
  }

  /**
   * `uploadedBy` é o `Author` de quem está logado, resolvido do token — nunca
   * do payload.
   *
   * Autor ausente **não derruba o upload**: rastreabilidade é metadado, e um
   * arquivo sem dono é melhor que um upload recusado por causa dele. (O 1:1
   * `User`↔`Author` torna esse caminho improvável — ver `context.md` 4.1.2.)
   */
  private async resolveUploaderId(
    userId?: number | string | null,
  ): Promise<string | null> {
    if (userId === undefined || userId === null) {
      return null;
    }

    const author = await this.authorsService.findByUserId(userId as never);

    return author?.id ?? null;
  }
}
