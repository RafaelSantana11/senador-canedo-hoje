import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, EntityManager, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../../../../../core/roles/roles.enum';
import {
  UserEntity,
  UserStatusEnum,
} from '../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { AuthorEntity } from '../../../../../core/authors/infrastructure/persistence/relational/entities/author.entity';
import { slugify } from '../../../../../utils/slug';

@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async run() {
    const countAdmin = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      // Admin vem de env, não mais hardcoded como admin@example.com / "secret".
      // Dois motivos: (1) um endereço real permite testar recuperação de senha
      // de ponta a ponta; (2) senha padrão conhecida em produção é credencial
      // aberta esperando ser usada.
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;

      if (!email || !password) {
        throw new Error(
          'Seed do admin abortado: defina ADMIN_EMAIL e ADMIN_PASSWORD no .env. ' +
            'Ver env-example-relational.',
        );
      }

      await this.createUserWithAuthor({
        name: 'Super Admin',
        email,
        password,
        roleId: RoleEnum.admin,
        roleName: 'Admin',
      });

      this.logger.log(`Admin criado: ${email}`);
    }

    const countUser = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.user,
        },
      },
    });

    if (!countUser) {
      await this.createUserWithAuthor({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'secret',
        roleId: RoleEnum.user,
        roleName: 'User',
      });
    }
  }

  /**
   * O seed é o único caminho de criação de `User` que não passa por
   * `UsersService.create()`, então precisa respeitar o invariante 1:1 por conta
   * própria — senão `npm run seed:run:relational` deixa o banco inválido logo de
   * saída, com usuário sem autor.
   */
  private async createUserWithAuthor({
    name,
    email,
    password,
    roleId,
    roleName,
  }: {
    name: string;
    email: string;
    password: string;
    roleId: RoleEnum;
    roleName: string;
  }): Promise<void> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await this.dataSource.transaction(async (manager: EntityManager) => {
      const users = manager.getRepository(UserEntity);
      const authors = manager.getRepository(AuthorEntity);

      const user = await users.save(
        users.create({
          name,
          email,
          password: hashedPassword,
          role: {
            id: roleId,
            name: roleName,
          },
          status: UserStatusEnum.ACTIVE,
          trialStartDate: new Date(),
        }),
      );

      await authors.save(
        authors.create({
          user,
          slug: await this.uniqueSlug(name, authors),
          bio: null,
          isColumnist: false,
        }),
      );
    });
  }

  private async uniqueSlug(
    name: string,
    authors: Repository<AuthorEntity>,
  ): Promise<string> {
    const base = slugify(name) || 'autor';
    let candidate = base;
    let suffix = 1;

    while (
      await authors.count({ where: { slug: candidate }, withDeleted: true })
    ) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }
}
