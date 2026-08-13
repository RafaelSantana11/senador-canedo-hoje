import { Category } from '../../../../domain/category';
import { CategoryEntity } from '../entities/category.entity';

/**
 * `newsCount` não é coluna: chega como propriedade extra mapeada pelo
 * `loadRelationCountAndMap` da listagem. Quando a categoria é lida por outro
 * caminho (aninhada numa notícia, por exemplo), simplesmente não vem.
 */
type CategoryEntityWithCount = CategoryEntity & { newsCount?: number };

export class CategoryMapper {
  static toDomain(raw: CategoryEntityWithCount): Category {
    const domainEntity = new Category();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.slug = raw.slug;
    domainEntity.description = raw.description;
    domainEntity.color = raw.color;
    domainEntity.active = raw.active;
    domainEntity.createdAt = raw.createdAt;

    if (typeof raw.newsCount === 'number') {
      domainEntity.newsCount = raw.newsCount;
    }

    return domainEntity;
  }
}
