import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { NullableType } from 'src/utils/types/nullable.type';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { FileType } from './domain/file';
import { QueryFileDto } from './dto/query-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import {
  FileRepository,
  FileUsage,
} from './infrastructure/persistence/file.repository';
import { StorageRemover } from './infrastructure/uploader/storage-remover';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly fileRepository: FileRepository,
    // Injetado pelo módulo do driver ativo — é a única dependência de driver
    // deste service, e cobre apenas a remoção do objeto no storage.
    private readonly storageRemover: StorageRemover,
  ) {}

  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  findManyWithPagination({
    query,
    paginationOptions,
  }: {
    query: QueryFileDto;
    paginationOptions: IPaginationOptions;
  }): Promise<FileType[]> {
    return this.fileRepository.findManyWithPagination({
      type: query.type,
      search: query.q,
      paginationOptions,
    });
  }

  async findDetailByIdOrFail(id: FileType['id']): Promise<FileType> {
    const file = await this.fileRepository.findDetailById(id);

    if (!file) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'fileNotFound',
        },
      });
    }

    return file;
  }

  async update(
    id: FileType['id'],
    updateFileDto: UpdateFileDto,
  ): Promise<FileType> {
    await this.findDetailByIdOrFail(id);

    const updated = await this.fileRepository.update(id, {
      title: updateFileDto.title,
      alt: updateFileDto.alt,
    });

    if (!updated) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'fileNotFound',
        },
      });
    }

    return updated;
  }

  /**
   * Exclusão do acervo.
   *
   * ⚠️ **Checa as TRÊS referências a `file`** — capa de notícia, foto de usuário
   * e item de banner. Checar só banners (que é o que o `context.md` 4.6 dizia,
   * escrito antes de News existir) deixaria apagar a capa de uma notícia
   * publicada, e o site ficaria com imagem quebrada. A constraint de FK sozinha
   * também não serve: ela devolveria `500`, não uma mensagem que o painel exibe.
   *
   * Ordem das operações: linha primeiro, objeto depois. O registro no banco é a
   * fonte de verdade — se a remoção no storage falhar, sobra um objeto órfão
   * (lixo, e fica logado); na ordem inversa sobraria um registro apontando para
   * um objeto que já não existe, que é imagem quebrada no site.
   */
  async remove(id: FileType['id']): Promise<void> {
    const file = await this.findDetailByIdOrFail(id);

    const usage = await this.fileRepository.countUsage(id);

    if (usage.news + usage.users + usage.banners > 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          id: 'fileInUse',
        },
        // Detalhe fora de `errors` para não quebrar o formato
        // `{ errors: { campo: código } }` que o front já consome: o código
        // continua sendo `fileInUse`, e isto diz **onde**, para o painel poder
        // mostrar "está em uso em 2 notícias e 1 banner".
        usedBy: usage satisfies FileUsage,
      });
    }

    await this.fileRepository.remove(id);

    try {
      await this.storageRemover.remove(file.path);
    } catch (error) {
      // Objeto que não sai do bucket não invalida a exclusão: o registro já
      // foi removido e ninguém mais consegue referenciar o arquivo.
      this.logger.error(
        `Arquivo ${id} removido do banco, mas o objeto "${file.path}" não pôde ser removido do storage`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
