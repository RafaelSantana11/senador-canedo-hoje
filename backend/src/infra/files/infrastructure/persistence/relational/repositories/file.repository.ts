import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { BannerItemEntity } from '../../../../../../core/banners/infrastructure/persistence/relational/entities/banner-item.entity';
import { NewsEntity } from '../../../../../../core/news/infrastructure/persistence/relational/entities/news.entity';
import { SettingEntity } from '../../../../../../core/settings/infrastructure/persistence/relational/entities/setting.entity';
import { UserEntity } from '../../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { NullableType } from 'src/utils/types/nullable.type';
import { FileType } from '../../../../domain/file';
import { MediaTypeEnum } from '../../../../media-type.enum';
import {
  CreateFileData,
  FileRepository,
  FileUsage,
  FindManyFilesOptions,
  UpdateFileData,
} from '../../file.repository';
import { AuthorEntity } from '../../../../../../core/authors/infrastructure/persistence/relational/entities/author.entity';
import { FileEntity } from '../entities/file.entity';
import { FileMapper } from '../mappers/file.mapper';

/** Referência só com id — o TypeORM grava a FK sem precisar da linha inteira. */
const ref = <T>(id: string): T => ({ id }) as T;

/**
 * Predicado SQL de `type`, que **não é coluna**: `image`/`video`/`document` é
 * derivado do `mimeType`, então o filtro do acervo vira prefixo de mimetype.
 * `document` é o caso "nem imagem nem vídeo", e exclui quem não tem mimetype
 * nenhum (acervo anterior à Parte 5) — esses aparecem só na listagem sem filtro.
 */
const TYPE_PREDICATE: Record<MediaTypeEnum, string> = {
  [MediaTypeEnum.image]: "file.mimeType ILIKE 'image/%'",
  [MediaTypeEnum.video]: "file.mimeType ILIKE 'video/%'",
  [MediaTypeEnum.document]:
    "(file.mimeType IS NOT NULL AND file.mimeType NOT ILIKE 'image/%' AND file.mimeType NOT ILIKE 'video/%')",
};

@Injectable()
export class FileRelationalRepository implements FileRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    // As três referências a `file` que a exclusão precisa checar. São injetadas
    // como repositórios de entidade (e não pelos módulos de News/Users/Banners)
    // de propósito: `NewsModule` e `UsersModule` já importam `FilesModule`, e
    // depender deles aqui fecharia um ciclo de módulos. Entidade é só classe.
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BannerItemEntity)
    private readonly bannerItemRepository: Repository<BannerItemEntity>,
    @InjectRepository(SettingEntity)
    private readonly settingRepository: Repository<SettingEntity>,
  ) {}

  async create(data: CreateFileData): Promise<FileType> {
    const entity = await this.fileRepository.save(
      this.fileRepository.create({
        path: data.path,
        originalName: data.originalName ?? null,
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? null,
        width: data.width ?? null,
        height: data.height ?? null,
        uploadedBy: data.uploadedById
          ? ref<AuthorEntity>(data.uploadedById)
          : null,
      }),
    );

    // `save` devolve `uploadedBy` como foi passado (só o id). Reler pelo caminho
    // de detalhe traz o `Author` com o `User`, que é de onde sai o nome de quem
    // subiu — sem isto a resposta do upload viria com `uploadedBy` incompleto.
    return (
      (await this.findDetailById(entity.id)) ?? FileMapper.toDomain(entity)
    );
  }

  async findById(id: FileType['id']): Promise<NullableType<FileType>> {
    const entity = await this.fileRepository.findOne({
      where: {
        id: id,
      },
    });

    return entity ? FileMapper.toDomain(entity) : null;
  }

  async findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    const entities = await this.fileRepository.find({
      where: {
        id: In(ids),
      },
    });

    return entities.map((entity) => FileMapper.toDomain(entity));
  }

  /**
   * Listagem do acervo. O join de `uploadedBy` é **explícito** porque a relação
   * não é eager — é aqui (rota autenticada) que ela deve aparecer, e só aqui.
   */
  async findManyWithPagination({
    type,
    search,
    paginationOptions,
  }: FindManyFilesOptions): Promise<FileType[]> {
    const query = this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .leftJoinAndSelect('uploadedBy.user', 'uploadedBy_user')
      .orderBy('file.createdAt', 'DESC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    if (type) {
      query.andWhere(TYPE_PREDICATE[type]);
    }

    if (search) {
      query.andWhere(
        '(file.originalName ILIKE :search OR file.title ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const entities = await query.getMany();

    return entities.map((entity) => FileMapper.toDomain(entity));
  }

  async update(
    id: FileType['id'],
    payload: UpdateFileData,
  ): Promise<NullableType<FileType>> {
    const entity = await this.fileRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    if (payload.title !== undefined) entity.title = payload.title;
    if (payload.alt !== undefined) entity.alt = payload.alt;

    await this.fileRepository.save(entity);

    return this.findDetailById(id);
  }

  /**
   * Conta as **quatro** referências a `file` que existem hoje: capa de
   * notícia, foto de usuário, item de banner e o logo dos parâmetros do
   * portal (`setting.value ->> 'id'`).
   *
   * ⚠️ `withDeleted: true` nas duas primeiras não é detalhe: `news` e `user`
   * são soft-deletados, e a linha soft-deletada **continua com a FK apontando
   * para o arquivo**. Ignorá-la deixaria a exclusão passar pela regra de
   * negócio e morrer no banco com violação de FK — `500` no lugar de uma
   * mensagem que o painel consegue exibir.
   *
   * ⚠️ `LOGO` não tem FK (jsonb) — é por isso que esta contagem existe: sem
   * ela, `DELETE /files/:id` apagaria o arquivo do logo do site inteiro sem
   * aviso (armadilha 2 de `tasks-parte-6.md`). `value` NULL (logo removido ou
   * resetado) não casa com `->> 'id'`, então o arquivo é liberado sozinho.
   */
  async countUsage(id: FileType['id']): Promise<FileUsage> {
    const [news, users, banners, settings] = await Promise.all([
      this.newsRepository.count({
        where: { cover: { id } },
        withDeleted: true,
      }),
      this.userRepository.count({
        where: { photo: { id } },
        withDeleted: true,
      }),
      this.bannerItemRepository.count({
        where: { file: { id } },
      }),
      this.settingRepository
        .createQueryBuilder('setting')
        .where('setting.key = :key', { key: 'LOGO' })
        .andWhere("setting.value ->> 'id' = :id", { id })
        .getCount(),
    ]);

    return { news, users, banners, settings };
  }

  async remove(id: FileType['id']): Promise<void> {
    await this.fileRepository.delete(id);
  }

  /** Leitura completa (com `uploadedBy`), para as rotas autenticadas do acervo. */
  async findDetailById(id: FileType['id']): Promise<NullableType<FileType>> {
    const entity = await this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .leftJoinAndSelect('uploadedBy.user', 'uploadedBy_user')
      .where('file.id = :id', { id })
      .getOne();

    return entity ? FileMapper.toDomain(entity) : null;
  }
}
