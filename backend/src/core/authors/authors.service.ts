import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { FileType } from 'src/infra/files/domain/file';
import { FileDto } from 'src/infra/files/dto/file.dto';
import { FileRepository } from 'src/infra/files/infrastructure/persistence/file.repository';

import { DeepPartial } from '../../utils/types/deep-partial.type';
import { NullableType } from '../../utils/types/nullable.type';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { slugify } from '../../utils/slug';
import { RoleEnum } from '../roles/roles.enum';
import { User } from '../users/domain/user';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';
import { Author } from './domain/author';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import {
  AuthorRepository,
  UpdateAuthorData,
} from './infrastructure/persistence/author.repository';

@Injectable()
export class AuthorsService {
  constructor(
    private readonly authorsRepository: AuthorRepository,
    // Repositórios, e não `UsersService`/`FilesService`: os dois services
    // fechariam ciclo de módulo com este — ver a nota em `authors.module.ts`.
    private readonly usersRepository: UserRepository,
    private readonly filesRepository: FileRepository,
    private readonly dataSource: DataSource,
  ) {}

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

    // `name` e `photo` não são colunas de `author`: moram no `User` dono do
    // perfil, que é a fonte única de verdade (ver `domain/author.ts`). Como
    // `Author` é 1:1 com `User`, "dono do autor" é "dono do usuário" — escrever
    // aqui não abre permissão que o `PATCH /auth/me` já não desse.
    const userPayload: DeepPartial<User> = {};

    if (updateAuthorDto.name !== undefined) {
      userPayload.name = updateAuthorDto.name;
    }

    if (updateAuthorDto.photo !== undefined) {
      userPayload.photo = await this.resolvePhoto(updateAuthorDto.photo);
    }

    const touchesUser = Object.keys(userPayload).length > 0;

    // As duas gravações vão na mesma transação: nome novo com bio antiga (ou o
    // contrário) deixaria o perfil incoerente.
    await this.dataSource.transaction(async (entityManager) => {
      if (touchesUser) {
        await this.usersRepository.update(
          author.userId,
          userPayload,
          entityManager,
        );
      }

      const updated = await this.authorsRepository.update(
        id,
        payload,
        entityManager,
      );

      if (!updated) {
        throw new NotFoundException({
          status: HttpStatus.NOT_FOUND,
          errors: {
            id: 'authorNotFound',
          },
        });
      }
    });

    // Relê depois do commit em vez de montar a resposta a partir do payload: é
    // o que garante `name`/`photo` novos, que chegam achatados pelo mapper a
    // partir da relação eager com `User`.
    const reloaded = await this.authorsRepository.findById(id);

    if (!reloaded) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'authorNotFound',
        },
      });
    }

    return reloaded;
  }

  /**
   * `undefined` não mexe na foto; `null` remove. Mesmo código de erro que
   * `UsersService` devolve para o mesmo dado, porque é o mesmo campo.
   */
  private async resolvePhoto(
    photo: FileDto | null,
  ): Promise<NullableType<FileType>> {
    if (!photo?.id) {
      return null;
    }

    const file = await this.filesRepository.findById(photo.id);

    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          photo: 'imageNotExists',
        },
      });
    }

    return file;
  }

  /** Acompanha o soft delete do `User` — ver `UsersService.remove()`. */
  async softDeleteByUserId(
    userId: User['id'],
    entityManager?: EntityManager,
  ): Promise<void> {
    await this.authorsRepository.softDeleteByUserId(userId, entityManager);
  }
}
