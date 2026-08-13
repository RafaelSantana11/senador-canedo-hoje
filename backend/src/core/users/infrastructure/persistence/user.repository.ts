import { EntityManager } from 'typeorm';
import { DeepPartial } from '../../../../utils/types/deep-partial.type';
import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { User } from '../../domain/user';

import { FilterUserDto, SortUserDto } from '../../dto/query-user.dto';

export abstract class UserRepository {
  /**
   * `entityManager` opcional para que `User` e `Author` sejam criados na mesma
   * transação (ver `UsersService.create`). Sem ele, usa a conexão padrão.
   */
  abstract create(
    data: Omit<User, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
    entityManager?: EntityManager,
  ): Promise<User>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]>;

  abstract findById(id: User['id']): Promise<NullableType<User>>;
  abstract findByIds(ids: User['id'][]): Promise<User[]>;
  abstract findByEmail(email: User['email']): Promise<NullableType<User>>;
  abstract findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>>;

  abstract update(
    id: User['id'],
    payload: DeepPartial<User>,
  ): Promise<User | null>;

  abstract remove(id: User['id'], entityManager?: EntityManager): Promise<void>;

  /**
   * Quantos admins ainda existem. Base das travas contra lockout: sem admin,
   * ninguém consegue criar nem promover usuário e a recuperação só acontece
   * mexendo no banco à mão.
   *
   * Conta só os não soft-deletados. `status` fica de fora de propósito:
   * `AuthService.validateLogin` não verifica `status`, então um admin
   * `inactive` continua logando e continua sendo saída de recuperação.
   */
  abstract countAdmins(): Promise<number>;
}
