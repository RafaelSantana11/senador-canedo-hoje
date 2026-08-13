import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { NullableType } from '../../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../../utils/types/pagination-options';
import { Category } from '../../../../domain/category';
import {
  CategoryRepository,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../category.repository';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryMapper } from '../mappers/category.mapper';
import { NewsEntity } from '../../../../../news/infrastructure/persistence/relational/entities/news.entity';

@Injectable()
export class CategoriesRelationalRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
  ) {}

  async create(data: CreateCategoryData): Promise<Category> {
    const saved = await this.categoriesRepository.save(
      this.categoriesRepository.create(data),
    );

    return CategoryMapper.toDomain(saved);
  }

  async findManyWithPagination({
    active,
    withNewsCount,
    paginationOptions,
  }: {
    active?: boolean;
    withNewsCount?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Category[]> {
    const query = this.categoriesRepository
      .createQueryBuilder('category')
      .orderBy('category.name', 'ASC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    if (active !== undefined) {
      query.andWhere('category.active = :active', { active });
    }

    if (withNewsCount) {
      // Uma subquery agregada para a página inteira, não um COUNT por linha:
      // `loadRelationCountAndMap` é o que evita o N+1 aqui.
      // O filtro de `deletedAt` é explícito porque a contagem de relação não
      // aplica sozinha o soft delete de `news`.
      query.loadRelationCountAndMap(
        'category.newsCount',
        'category.news',
        'news_count',
        (counter) => counter.andWhere('news_count.deletedAt IS NULL'),
      );
    }

    const entities = await query.getMany();

    return entities.map((entity) => CategoryMapper.toDomain(entity));
  }

  async findById(id: Category['id']): Promise<NullableType<Category>> {
    const entity = await this.categoriesRepository.findOne({ where: { id } });

    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async update(
    id: Category['id'],
    payload: UpdateCategoryData,
  ): Promise<NullableType<Category>> {
    const entity = await this.categoriesRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    const saved = await this.categoriesRepository.save(
      this.categoriesRepository.merge(entity, payload),
    );

    return CategoryMapper.toDomain(saved);
  }

  async remove(id: Category['id']): Promise<void> {
    await this.categoriesRepository.delete(id);
  }

  async nameExists(
    name: Category['name'],
    exceptId?: Category['id'],
  ): Promise<boolean> {
    const count = await this.categoriesRepository.count({
      where: { name, ...(exceptId ? { id: Not(exceptId) } : {}) },
    });

    return count > 0;
  }

  async slugExists(
    slug: Category['slug'],
    exceptId?: Category['id'],
  ): Promise<boolean> {
    const count = await this.categoriesRepository.count({
      where: { slug, ...(exceptId ? { id: Not(exceptId) } : {}) },
    });

    return count > 0;
  }

  async countNews(id: Category['id']): Promise<number> {
    // Conta pelo lado de `news` (é lá que está a FK). `count` ignora
    // soft-deletados, e notícia arquivada **conta**: ela continua existindo e
    // continua apontando para a categoria, então apagar a categoria ainda
    // quebraria a referência.
    return this.categoriesRepository.manager.count(NewsEntity, {
      where: { category: { id } },
    });
  }
}
