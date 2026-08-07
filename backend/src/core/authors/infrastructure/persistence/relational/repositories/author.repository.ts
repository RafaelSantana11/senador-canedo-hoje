import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';

import { NullableType } from '../../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../../utils/types/pagination-options';
import { User } from '../../../../../users/domain/user';
import { Author } from '../../../../domain/author';
import {
  AuthorRepository,
  CreateAuthorData,
  UpdateAuthorData,
} from '../../author.repository';
import { AuthorEntity } from '../entities/author.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { AuthorMapper } from '../mappers/author.mapper';

@Injectable()
export class AuthorsRelationalRepository implements AuthorRepository {
  constructor(
    @InjectRepository(AuthorEntity)
    private readonly authorsRepository: Repository<AuthorEntity>,
  ) {}

  private repo(entityManager?: EntityManager): Repository<AuthorEntity> {
    return entityManager
      ? entityManager.getRepository(AuthorEntity)
      : this.authorsRepository;
  }

  async create(
    data: CreateAuthorData,
    entityManager?: EntityManager,
  ): Promise<Author> {
    const repository = this.repo(entityManager);

    const user = new UserEntity();
    user.id = Number(data.userId);

    const saved = await repository.save(
      repository.create({
        user,
        slug: data.slug,
        bio: data.bio,
        isColumnist: data.isColumnist,
      }),
    );

    // `save` devolve a entidade com o `user` que passamos (só o id), sem as
    // relações eager. Reler garante `name`/`photo` preenchidos no domain.
    const entity = await repository.findOne({ where: { id: saved.id } });

    return AuthorMapper.toDomain(entity ?? saved);
  }

  async findManyWithPagination({
    onlyColumnists,
    paginationOptions,
  }: {
    onlyColumnists?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Author[]> {
    const where: FindOptionsWhere<AuthorEntity> = {};

    if (onlyColumnists) {
      where.isColumnist = true;
    }

    const entities = await this.authorsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => AuthorMapper.toDomain(entity));
  }

  async findById(id: Author['id']): Promise<NullableType<Author>> {
    const entity = await this.authorsRepository.findOne({ where: { id } });

    return entity ? AuthorMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: Author['slug']): Promise<NullableType<Author>> {
    const entity = await this.authorsRepository.findOne({ where: { slug } });

    return entity ? AuthorMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: User['id']): Promise<NullableType<Author>> {
    const entity = await this.authorsRepository.findOne({
      where: { user: { id: Number(userId) } },
    });

    return entity ? AuthorMapper.toDomain(entity) : null;
  }

  async update(
    id: Author['id'],
    payload: UpdateAuthorData,
  ): Promise<NullableType<Author>> {
    const entity = await this.authorsRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    await this.authorsRepository.save(
      this.authorsRepository.merge(entity, payload),
    );

    const updated = await this.authorsRepository.findOne({ where: { id } });

    return updated ? AuthorMapper.toDomain(updated) : null;
  }

  async slugExists(
    slug: Author['slug'],
    entityManager?: EntityManager,
  ): Promise<boolean> {
    const count = await this.repo(entityManager).count({
      where: { slug },
      // soft-deletados continuam ocupando o slug no índice único
      withDeleted: true,
    });

    return count > 0;
  }

  async softDeleteByUserId(
    userId: User['id'],
    entityManager?: EntityManager,
  ): Promise<void> {
    await this.repo(entityManager).softDelete({
      user: { id: Number(userId) },
    });
  }
}
