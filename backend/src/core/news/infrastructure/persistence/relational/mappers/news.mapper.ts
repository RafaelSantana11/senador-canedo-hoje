import { FileMapper } from 'src/infra/files/infrastructure/persistence/relational/mappers/file.mapper';

import { AuthorMapper } from '../../../../../authors/infrastructure/persistence/relational/mappers/author.mapper';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';
import { TagMapper } from '../../../../../tags/infrastructure/persistence/relational/mappers/tag.mapper';
import { News } from '../../../../domain/news';
import { NewsEntity } from '../entities/news.entity';

export class NewsMapper {
  static toDomain(raw: NewsEntity): News {
    const domainEntity = new News();
    domainEntity.id = raw.id;
    domainEntity.title = raw.title;
    domainEntity.slug = raw.slug;
    domainEntity.summary = raw.summary;
    domainEntity.body = raw.body;
    domainEntity.cover = raw.cover ? FileMapper.toDomain(raw.cover) : null;
    domainEntity.status = raw.status;
    domainEntity.publishedAt = raw.publishedAt;
    // `AuthorMapper` achata `name`/`photo` e NÃO aninha o `User` — é o que
    // impede dados privados de vazarem pela rota pública de notícias.
    domainEntity.author = raw.author
      ? AuthorMapper.toDomain(raw.author)
      : raw.author;
    domainEntity.category = raw.category
      ? CategoryMapper.toDomain(raw.category)
      : raw.category;
    domainEntity.tags = (raw.tags ?? []).map((tag) => TagMapper.toDomain(tag));
    domainEntity.views = raw.views;
    // Devolvido como veio: nenhuma normalização, nenhuma chave descartada.
    domainEntity.config = raw.config;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }
}
