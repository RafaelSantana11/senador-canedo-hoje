import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { NullableType } from '../../utils/types/nullable.type';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { slugify } from '../../utils/slug';
import { RoleEnum } from '../roles/roles.enum';
import { User } from '../users/domain/user';
import { Author } from './domain/author';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import {
  AuthorRepository,
  UpdateAuthorData,
} from './infrastructure/persistence/author.repository';

@Injectable()
export class AuthorsService {
  constructor(private readonly authorsRepository: AuthorRepository) {}

  /**
   * Cria o perfil editorial 1:1 do usuário. Chamado por `UsersService.create()`
   * dentro da transação do signup — se isto falhar, o `User` não é criado.
   */
  async createForUser(
    {
      user,
      dto,
    }: {
      user: Pick<User, 'id' | 'name'>;
      dto?: CreateAuthorDto | null;
    },
    entityManager?: EntityManager,
  ): Promise<Author> {
    const slug = await this.generateUniqueSlug(user.name, entityManager);

    return this.authorsRepository.create(
      {
        userId: user.id,
        slug,
        bio: dto?.bio ?? null,
        isColumnist: dto?.isColumnist ?? false,
      },
      entityManager,
    );
  }

  /**
   * Sufixo numérico incremental para homônimos: `maria-silva`, `maria-silva-2`,
   * `maria-silva-3`... Num portal com vários colaboradores isso acontece.
   *
   * O índice único em `slug` é a garantia final: duas criações simultâneas do
   * mesmo nome podem escolher o mesmo candidato, e nesse caso a segunda falha na
   * constraint e a transação inteira é revertida (o `User` não é criado).
   */
  async generateUniqueSlug(
    name: string,
    entityManager?: EntityManager,
  ): Promise<string> {
    const base = slugify(name ?? '') || 'autor';

    let candidate = base;
    let suffix = 1;

    while (await this.authorsRepository.slugExists(candidate, entityManager)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }

  findManyWithPagination({
    onlyColumnists,
    paginationOptions,
  }: {
    onlyColumnists?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Author[]> {
    return this.authorsRepository.findManyWithPagination({
      onlyColumnists,
      paginationOptions,
    });
  }

  findById(id: Author['id']): Promise<NullableType<Author>> {
    return this.authorsRepository.findById(id);
  }

  findByUserId(userId: User['id']): Promise<NullableType<Author>> {
    return this.authorsRepository.findByUserId(userId);
  }

  async findBySlugOrFail(slug: Author['slug']): Promise<Author> {
    const author = await this.authorsRepository.findBySlug(slug);

    if (!author) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          slug: 'authorNotFound',
        },
      });
    }

    return author;
  }

  /**
   * Regra de autorização: o autor edita o próprio perfil; o admin edita
   * qualquer um. Nada mais fino que isso — permissões por role refinadas estão
   * fora de escopo (seção 6 do context.md).
   */
  async update(
    id: Author['id'],
    updateAuthorDto: UpdateAuthorDto,
    requester: Pick<User, 'id' | 'role'>,
  ): Promise<Author> {
    const author = await this.authorsRepository.findById(id);

    if (!author) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'authorNotFound',
        },
      });
    }

    const isAdmin = String(requester.role?.id) === String(RoleEnum.admin);
    const isOwner = String(author.userId) === String(requester.id);

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        status: HttpStatus.FORBIDDEN,
        errors: {
          id: 'cannotEditAnotherAuthor',
        },
      });
    }

    const payload: UpdateAuthorData = {};

    if (updateAuthorDto.bio !== undefined) {
      payload.bio = updateAuthorDto.bio;
    }

    if (updateAuthorDto.isColumnist !== undefined) {
      payload.isColumnist = updateAuthorDto.isColumnist;
    }

    if (
      updateAuthorDto.slug !== undefined &&
      updateAuthorDto.slug !== author.slug
    ) {
      const taken = await this.authorsRepository.slugExists(
        updateAuthorDto.slug,
      );

      if (taken) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            slug: 'slugAlreadyExists',
          },
        });
      }

      payload.slug = updateAuthorDto.slug;
    }

    const updated = await this.authorsRepository.update(id, payload);

    if (!updated) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'authorNotFound',
        },
      });
    }

    return updated;
  }

  /** Acompanha o soft delete do `User` — ver `UsersService.remove()`. */
  async softDeleteByUserId(
    userId: User['id'],
    entityManager?: EntityManager,
  ): Promise<void> {
    await this.authorsRepository.softDeleteByUserId(userId, entityManager);
  }
}
