import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { NullableType } from '../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { Role } from '../roles/domain/role';
import { UserStatusEnum } from './infrastructure/persistence/relational/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilesService } from 'src/infra/files/files.service';
import { FileType } from 'src/infra/files/domain/file';
import { DataSource } from 'typeorm';
import { AuthorsService } from '../authors/authors.service';

/**
 * Duas criações simultâneas de usuários homônimos podem escolher o mesmo slug
 * antes de qualquer uma gravar — a checagem de disponibilidade e o INSERT não
 * são atômicos entre si. Quem perde a corrida bate no índice único de
 * `author.slug` e tem a transação inteira revertida (nenhum usuário órfão é
 * criado, que é o que importa), mas a requisição em si é legítima e não deveria
 * falhar. Detectar o conflito permite simplesmente tentar de novo, e o próximo
 * sufixo já estará livre.
 */
type PostgresError = { code?: string; detail?: string };

const isAuthorSlugConflict = (error: unknown): boolean => {
  // O TypeORM copia as propriedades do erro do driver para o próprio
  // QueryFailedError e também as expõe em `driverError` — a versão varia entre
  // releases, então lê dos dois lugares.
  const asError = error as PostgresError & { driverError?: PostgresError };
  const code = asError?.driverError?.code ?? asError?.code;
  const detail = asError?.driverError?.detail ?? asError?.detail;

  return (
    code === '23505' && // unique_violation no Postgres
    (detail?.includes('(slug)') ?? false)
  );
};

const MAX_SLUG_ATTEMPTS = 3;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly filesService: FilesService,
    private readonly authorsService: AuthorsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cria `User` **e** o `Author` 1:1 correspondente na mesma transação. Se a
   * criação do `Author` falhar (slug duplicado, por exemplo), o `User` não é
   * criado — não existe janela em que exista usuário sem perfil de autor.
   *
   * Todos os caminhos de criação de usuário passam por aqui de propósito
   * (`POST /users` e o Google OAuth desregistrado), então o invariante vale
   * para todos eles sem que cada chamador precise lembrar. O seed é o único
   * caminho de fora, e trata o `Author` por conta própria.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Do not remove comment below.
    // <creating-property />

    let password: string | undefined = undefined;

    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(createUserDto.password, salt);
    }

    let email: string | null = null;

    if (createUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        createUserDto.email,
      );
      if (userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }
      email = createUserDto.email;
    }

    let photo: FileType | null | undefined = undefined;

    if (createUserDto.photo?.id) {
      const fileObject = await this.filesService.findById(
        createUserDto.photo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            photo: 'imageNotExists',
          },
        });
      }
      photo = fileObject;
    } else if (createUserDto.photo === null) {
      photo = null;
    }

    if (createUserDto.role?.id) {
      const roleObject = Object.values(RoleEnum)
        .map(String)
        .includes(String(createUserDto.role.id));
      if (!roleObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'roleNotExists',
          },
        });
      }
    }

    // Default explícito de role. Sem isto, um payload sem `role` criava usuário
    // com `role: undefined`, que fura o RolesGuard de formas confusas (o guard
    // compara `request.user?.role?.id`, que simplesmente não bate com nada).
    const role: Role = {
      id: createUserDto.role?.id ?? RoleEnum.user,
    };

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.dataSource.transaction(async (entityManager) => {
          const user = await this.usersRepository.create(
            {
              // Do not remove comment below.
              // <creating-property-payload />
              name: createUserDto.name,
              legalName: createUserDto.legalName,
              email: email,
              password: password,
              photo: photo,
              role: role,
              status: createUserDto.status ?? UserStatusEnum.ACTIVE,
              trialStartDate: new Date(),
              messageApiKey: createUserDto.messageApiKey || null,
              provider: createUserDto.provider ?? AuthProvidersEnum.email,
              socialId: createUserDto.socialId,
            },
            entityManager,
          );

          user.author = await this.authorsService.createForUser(
            { user, dto: createUserDto.author },
            entityManager,
          );

          return user;
        });
      } catch (error) {
        if (!isAuthorSlugConflict(error)) {
          throw error;
        }

        if (attempt >= MAX_SLUG_ATTEMPTS) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              name: 'authorSlugConflict',
            },
          });
        }
      }
    }
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    return this.usersRepository.findBySocialIdAndProvider({
      socialId,
      provider,
    });
  }

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);

      if (userObject && userObject?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }

      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let photo: FileType | null | undefined = undefined;

    if (updateUserDto.photo?.id) {
      const fileObject = await this.filesService.findById(
        updateUserDto.photo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            photo: 'imageNotExists',
          },
        });
      }
      photo = fileObject;
    } else if (updateUserDto.photo === null) {
      photo = null;
    }

    let role: Role | undefined = undefined;

    if (updateUserDto.role?.id) {
      const roleObject = Object.values(RoleEnum)
        .map(String)
        .includes(String(updateUserDto.role.id));
      if (!roleObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'roleNotExists',
          },
        });
      }

      role = {
        id: updateUserDto.role.id,
      };
    }

    if (updateUserDto.status) {
      const statusObject = Object.values(UserStatusEnum).includes(
        updateUserDto.status,
      );
      if (!statusObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            status: 'statusNotExists',
          },
        });
      }
    }

    // It is important to pass undefined if the status is not provided
    // in the DTO, so it will not be updated in the database.
    const status = updateUserDto.status ? updateUserDto.status : undefined;

    return this.usersRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      name: updateUserDto.name,
      legalName: updateUserDto.legalName,
      email,
      password,
      photo,
      role,
      status: status,
      messageApiKey: updateUserDto.messageApiKey,
      provider: updateUserDto.provider,
      socialId: updateUserDto.socialId,
    });
  }

  /**
   * Soft delete do `User` **e** do `Author` juntos, na mesma transação — os dois
   * caminhos de saída (`DELETE /users/:id` e `DELETE /auth/me`) passam por aqui.
   * Soft delete nos dois porque `Author` será referenciado por `News` e `File`
   * na Parte 4: apagar de verdade quebraria histórico de conteúdo publicado.
   */
  async remove(id: User['id']): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      await this.authorsService.softDeleteByUserId(id, entityManager);
      await this.usersRepository.remove(id, entityManager);
    });
  }
}
