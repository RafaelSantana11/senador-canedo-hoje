import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';

import { NullableType } from '../../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../../utils/types/pagination-options';
import { Tag } from '../../../../domain/tag';
import {
  CreateTagData,
  TagRepository,
  UpdateTagData,
} from '../../tag.repository';
import { TagEntity } from '../entities/tag.entity';
import { TagMapper } from '../mappers/tag.mapper';

@Injectable()
export class TagsRelationalRepository implements TagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private readonly tagsRepository: Repository<TagEntity>,
  ) {}

  async create(data: CreateTagData): Promise<Tag> {
    const saved = await this.tagsRepository.save(
      this.tagsRepository.create(data),
    );

    return TagMapper.toDomain(saved);
  }

  async findManyWithPagination({
    search,
    withUsageCount,
    paginationOptions,
  }: {
    search?: string;
    withUsageCount?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Tag[]> {
    const query = this.tagsRepository
      .createQueryBuilder('tag')
      .orderBy('tag.name', 'ASC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    if (search) {
      query.andWhere('tag.name ILIKE :search', { search: `%${search}%` });
    }

    if (withUsageCount) {
      // Uma agregação para a página inteira — não um COUNT por tag.
      query.loadRelationCountAndMap(
        'tag.usageCount',
        'tag.news',
        'usage_count',
        (counter) => counter.andWhere('usage_count.deletedAt IS NULL'),
      );
    }

    const entities = await query.getMany();

    return entities.map((entity) => TagMapper.toDomain(entity));
  }

  async findById(id: Tag['id']): Promise<NullableType<Tag>> {
    const entity = await this.tagsRepository.findOne({ where: { id } });

    return entity ? TagMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Tag['id'][]): Promise<Tag[]> {
    if (!ids.length) {
      return [];
    }

    const entities = await this.tagsRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => TagMapper.toDomain(entity));
  }

  async update(
    id: Tag['id'],
    payload: UpdateTagData,
  ): Promise<NullableType<Tag>> {
    const entity = await this.tagsRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    const saved = await this.tagsRepository.save(
      this.tagsRepository.merge(entity, payload),
    );

    return TagMapper.toDomain(saved);
  }

  /**
   * Apaga as associações **antes** da tag, na mesma transação.
   *
   * ⚠️ Não dá para confiar em cascade aqui: das duas FKs de `news_tags`, o
   * TypeORM gera `ON DELETE CASCADE` só na do lado dono (`news_id`) — a de
   * `tag_id` sai como `NO ACTION`. Sem esta limpeza, apagar tag em uso viraria
   * violação de FK, ou seja, `500` com mensagem de driver no lugar de uma
   * operação que deve simplesmente funcionar.
   *
   * A notícia não é afetada: perde a etiqueta e continua publicada.
   */
  async remove(id: Tag['id']): Promise<void> {
    await this.tagsRepository.manager.transaction(async (manager) => {
      await manager.query(`DELETE FROM "news_tags" WHERE "tag_id" = $1`, [id]);
      await manager.delete(TagEntity, id);
    });
  }

  async nameExists(name: Tag['name'], exceptId?: Tag['id']): Promise<boolean> {
    const count = await this.tagsRepository.count({
      where: { name, ...(exceptId ? { id: Not(exceptId) } : {}) },
    });

    return count > 0;
  }

  async slugExists(slug: Tag['slug'], exceptId?: Tag['id']): Promise<boolean> {
    const count = await this.tagsRepository.count({
      where: { slug, ...(exceptId ? { id: Not(exceptId) } : {}) },
    });

    return count > 0;
  }
}
