import { FileMapper } from 'src/infra/files/infrastructure/persistence/relational/mappers/file.mapper';
import { Author } from '../../../../domain/author';
import { AuthorEntity } from '../entities/author.entity';

export class AuthorMapper {
  static toDomain(raw: AuthorEntity): Author {
    const domainEntity = new Author();
    domainEntity.id = raw.id;
    domainEntity.slug = raw.slug;
    domainEntity.bio = raw.bio;
    domainEntity.isColumnist = raw.isColumnist;
    // `user` vem eager; o optional chaining cobre o caso de a relação não ter
    // sido carregada (ex.: User soft-deletado, que o TypeORM omite por padrão).
    domainEntity.userId = raw.user?.id;
    domainEntity.name = raw.user?.name;
    domainEntity.photo = raw.user?.photo
      ? FileMapper.toDomain(raw.user.photo)
      : null;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }
}
