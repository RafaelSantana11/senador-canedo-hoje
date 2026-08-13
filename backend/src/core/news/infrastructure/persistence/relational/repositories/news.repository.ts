import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FileEntity } from '../../../../../../infra/files/infrastructure/persistence/relational/entities/file.entity';
import { NullableType } from '../../../../../../utils/types/nullable.type';
import { AuthorEntity } from '../../../../../authors/infrastructure/persistence/relational/entities/author.entity';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { TagEntity } from '../../../../../tags/infrastructure/persistence/relational/entities/tag.entity';
import { News } from '../../../../domain/news';
import {
  CreateNewsData,
  FindManyNewsOptions,
  NewsRepository,
  UpdateNewsData,
} from '../../news.repository';
import { NewsEntity } from '../entities/news.entity';
import { NewsMapper } from '../mappers/news.mapper';

/** Referência só com id — o TypeORM grava a FK sem precisar da linha inteira. */
const ref = <T>(id: string): T => ({ id }) as T;

@Injectable()
export class NewsRelationalRepository implements NewsRepository {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
  ) {}

  async create(data: CreateNewsData): Promise<News> {
    const saved = await this.newsRepository.save(
      this.newsRepository.create({
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        body: data.body,
        cover: data.coverId ? ref<FileEntity>(data.coverId) : null,
        status: data.status,
        publishedAt: data.publishedAt,
        category: ref<CategoryEntity>(String(data.categoryId)),
        author: ref<AuthorEntity>(String(data.authorId)),
        tags: data.tagIds.map((id) => ref<TagEntity>(id)),
        config: data.config,
      }),
    );

    // `save` devolve o que foi passado (relações só com id). Reler traz as
    // relações eager completas, que o mapper precisa para achatar o autor.
    const entity = await this.findEntityById(saved.id);

    return NewsMapper.toDomain(entity ?? saved);
  }

  /**
   * Uma query só, com as relações vindo por `JOIN` explícito.
   *
   * As relações são `eager` na entidade, mas o QueryBuilder não aplica eager —
   * por isso os `leftJoinAndSelect`. `author.user` e a foto entram na lista
   * porque o `AuthorMapper` copia `name`/`photo` de lá; sem esses dois joins o
   * autor voltaria sem nome.
   *
   * ⚠️ Nenhum filtro nem ordenação toca o `config`: as regras de vitrine que ele
   * carrega são lidas pelo cliente, não pelo servidor.
   */
  async findManyWithPagination({
    categorySlug,
    tagSlug,
    status,
    search,
    paginationOptions,
  }: FindManyNewsOptions): Promise<News[]> {
    const query = this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.cover', 'cover')
      .leftJoinAndSelect('news.category', 'category')
      .leftJoinAndSelect('news.author', 'author')
      .leftJoinAndSelect('author.user', 'author_user')
      .leftJoinAndSelect('author_user.photo', 'author_user_photo')
      .leftJoinAndSelect('news.tags', 'tag')
      // `publishedAt` é nulo em rascunho, por isso o NULLS LAST explícito: sem
      // ele o Postgres jogaria rascunho para o topo (DESC ordena nulo primeiro).
      .orderBy('news.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('news.createdAt', 'DESC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    if (status) {
      query.andWhere('news.status = :status', { status });
    }

    if (categorySlug) {
      query.andWhere('category.slug = :categorySlug', { categorySlug });
    }

    if (tagSlug) {
      // Alias próprio: o join de filtro restringe as linhas, enquanto o
      // `leftJoinAndSelect('news.tags')` acima continua trazendo TODAS as tags
      // de cada notícia. Reaproveitar o mesmo alias devolveria a notícia com
      // apenas a tag filtrada.
      query.innerJoin('news.tags', 'filter_tag', 'filter_tag.slug = :tagSlug', {
        tagSlug,
      });
    }

    if (search) {
      query.andWhere(
        '(news.title ILIKE :search OR news.summary ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const entities = await query.getMany();

    return entities.map((entity) => NewsMapper.toDomain(entity));
  }

  async findById(id: News['id']): Promise<NullableType<News>> {
    const entity = await this.findEntityById(id);

    return entity ? NewsMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: News['slug']): Promise<NullableType<News>> {
    // `findOne` aplica as relações eager (inclusive as aninhadas em `author`).
    const entity = await this.newsRepository.findOne({ where: { slug } });

    return entity ? NewsMapper.toDomain(entity) : null;
  }

  async update(
    id: News['id'],
    payload: UpdateNewsData,
  ): Promise<NullableType<News>> {
    const entity = await this.findEntityById(id);

    if (!entity) {
      return null;
    }

    if (payload.title !== undefined) entity.title = payload.title;
    if (payload.slug !== undefined) entity.slug = payload.slug;
    if (payload.summary !== undefined) entity.summary = payload.summary;
    if (payload.body !== undefined) entity.body = payload.body;
    if (payload.status !== undefined) entity.status = payload.status;
    if (payload.publishedAt !== undefined)
      entity.publishedAt = payload.publishedAt;
    if (payload.config !== undefined) entity.config = payload.config;

    if (payload.coverId !== undefined) {
      entity.cover = payload.coverId ? ref<FileEntity>(payload.coverId) : null;
    }

    if (payload.categoryId !== undefined) {
      entity.category = ref<CategoryEntity>(String(payload.categoryId));
    }

    if (payload.tagIds !== undefined) {
      // Substituição do conjunto: o TypeORM acerta `news_tags` no `save`,
      // inserindo e removendo o que for necessário.
      entity.tags = payload.tagIds.map((tagId) => ref<TagEntity>(tagId));
    }

    await this.newsRepository.save(entity);

    const updated = await this.findEntityById(id);

    return updated ? NewsMapper.toDomain(updated) : null;
  }

  async slugExists(slug: News['slug']): Promise<boolean> {
    const count = await this.newsRepository.count({
      where: { slug },
      // Soft-deletados continuam ocupando o slug no índice único.
      withDeleted: true,
    });

    return count > 0;
  }

  async incrementViews(id: News['id']): Promise<void> {
    // `UPDATE ... SET views = views + 1` no banco: duas leituras simultâneas
    // com ler-somar-gravar perderiam uma das contagens.
    await this.newsRepository.increment({ id }, 'views', 1);
  }

  private findEntityById(id: News['id']): Promise<NewsEntity | null> {
    return this.newsRepository.findOne({ where: { id } });
  }
}
