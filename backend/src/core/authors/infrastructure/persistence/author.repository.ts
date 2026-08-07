import { EntityManager } from 'typeorm';
import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { Author } from '../../domain/author';
import { User } from '../../../users/domain/user';

export type CreateAuthorData = {
  userId: User['id'];
  slug: string;
  bio: string | null;
  isColumnist: boolean;
};

export type UpdateAuthorData = Partial<
  Pick<Author, 'slug' | 'bio' | 'isColumnist'>
>;

/**
 * O parâmetro opcional `entityManager` existe para que a criação de `User` +
 * `Author` aconteça numa única transação (ver `UsersService.create`). Quando
 * ausente, o repositório usa a própria conexão — o comportamento de antes.
 */
export abstract class AuthorRepository {
  abstract create(
    data: CreateAuthorData,
    entityManager?: EntityManager,
  ): Promise<Author>;

  abstract findManyWithPagination({
    onlyColumnists,
    paginationOptions,
  }: {
    onlyColumnists?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Author[]>;

  abstract findById(id: Author['id']): Promise<NullableType<Author>>;

  abstract findBySlug(slug: Author['slug']): Promise<NullableType<Author>>;

  abstract findByUserId(userId: User['id']): Promise<NullableType<Author>>;

  abstract update(
    id: Author['id'],
    payload: UpdateAuthorData,
  ): Promise<NullableType<Author>>;

  /**
   * Inclui registros soft-deletados de propósito: a linha continua no banco e
   * o índice único de `slug` continua valendo para ela.
   */
  abstract slugExists(
    slug: Author['slug'],
    entityManager?: EntityManager,
  ): Promise<boolean>;

  abstract softDeleteByUserId(
    userId: User['id'],
    entityManager?: EntityManager,
  ): Promise<void>;
}
