import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from 'src/utils/types/pagination-options';
import { FileType } from '../../domain/file';
import { MediaTypeEnum } from '../../media-type.enum';

/**
 * O que o driver de upload grava. `path` é a única coisa obrigatória — todo o
 * resto é metadado que pode faltar (o driver `s3-presigned`, por exemplo, nunca
 * vê o binário e depende do que o cliente declarar).
 */
export type CreateFileData = {
  path: string;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  uploadedById?: string | null;
};

/** Só metadado editável. `path` e derivados não entram aqui por construção. */
export type UpdateFileData = {
  title?: string | null;
  alt?: string | null;
};

export type FindManyFilesOptions = {
  type?: MediaTypeEnum;
  search?: string;
  paginationOptions: IPaginationOptions;
};

/**
 * Onde o arquivo está sendo usado. As **quatro** referências existentes hoje —
 * checar só uma delas deixa apagar imagem que está no ar (ver a armadilha 1 de
 * `tasks-parte-5.md` e a armadilha 2 de `tasks-parte-6.md`, que somou `settings`:
 * o logo do portal é gravado em jsonb, sem FK).
 */
export type FileUsage = {
  news: number;
  users: number;
  banners: number;
  settings: number;
};

export abstract class FileRepository {
  abstract create(data: CreateFileData): Promise<FileType>;

  abstract findById(id: FileType['id']): Promise<NullableType<FileType>>;

  /**
   * Igual a `findById`, mas com `uploadedBy` carregado. Existe separado porque
   * `uploadedBy` só pode aparecer em rota autenticada — ver `file.entity.ts`.
   */
  abstract findDetailById(id: FileType['id']): Promise<NullableType<FileType>>;

  abstract findByIds(ids: FileType['id'][]): Promise<FileType[]>;

  abstract findManyWithPagination(
    options: FindManyFilesOptions,
  ): Promise<FileType[]>;

  abstract update(
    id: FileType['id'],
    payload: UpdateFileData,
  ): Promise<NullableType<FileType>>;

  abstract countUsage(id: FileType['id']): Promise<FileUsage>;

  /** Remoção definitiva da linha — `file` não tem soft delete. */
  abstract remove(id: FileType['id']): Promise<void>;
}
