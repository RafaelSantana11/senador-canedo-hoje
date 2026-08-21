import { FileType } from '../../../../domain/file';
import { FileUploader } from '../../../../domain/file-uploader';
import { FileEntity } from '../entities/file.entity';

/**
 * `type` NÃO é mapeado aqui de propósito: é derivado do `mimeType` na
 * serialização (`domain/file.ts`), não persistido.
 */
export class FileMapper {
  static toDomain(raw: FileEntity): FileType {
    const domainEntity = new FileType();
    domainEntity.id = raw.id;
    domainEntity.path = raw.path;
    domainEntity.originalName = raw.originalName ?? null;
    domainEntity.mimeType = raw.mimeType ?? null;
    // `bigint` volta do driver do Postgres como string — o contrato da API é
    // numérico (`sizeBytes: 1468006`, não `"1468006"`).
    domainEntity.sizeBytes =
      raw.sizeBytes === null || raw.sizeBytes === undefined
        ? null
        : Number(raw.sizeBytes);
    domainEntity.width = raw.width ?? null;
    domainEntity.height = raw.height ?? null;
    domainEntity.title = raw.title ?? null;
    domainEntity.alt = raw.alt ?? null;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    // Atribuído SOMENTE quando a relação foi carregada (o join só acontece nas
    // queries autenticadas do acervo). Deixar a propriedade ausente é o que
    // mantém `uploadedBy` fora das respostas públicas — ver `file.entity.ts`.
    if (raw.uploadedBy) {
      const uploader = new FileUploader();
      uploader.id = raw.uploadedBy.id;
      uploader.slug = raw.uploadedBy.slug;
      // Achatado a partir do `User` — o nome não é coluna de `author`. Sem o
      // join de `uploadedBy.user`, sobra o slug, que já identifica a pessoa.
      uploader.name = raw.uploadedBy.user?.name ?? raw.uploadedBy.slug;
      domainEntity.uploadedBy = uploader;
    }

    return domainEntity;
  }

  static toPersistence(domainEntity: FileType): FileEntity {
    const persistenceEntity = new FileEntity();
    persistenceEntity.id = domainEntity.id;
    persistenceEntity.path = domainEntity.path;
    return persistenceEntity;
  }
}
