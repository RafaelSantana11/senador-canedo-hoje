import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity, Repository } from 'typeorm';

import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEnum } from '../../../../../roles/roles.enum';
import { User } from '../../../../../users/domain/user';
import {
  SettingRepository,
  SettingWrite,
  StoredSetting,
} from '../../setting.repository';
import { SettingEntity } from '../entities/setting.entity';

@Injectable()
export class SettingRelationalRepository implements SettingRepository {
  constructor(
    @InjectRepository(SettingEntity)
    private readonly settingRepository: Repository<SettingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * `.withDeleted()`: quem salvou pode ter sido soft-deletado depois — o nome
   * continua sendo o registro de quem gravou por último.
   */
  async findAll(): Promise<StoredSetting[]> {
    const rows = await this.settingRepository
      .createQueryBuilder('setting')
      .leftJoin('setting.updatedBy', 'updatedBy')
      .addSelect(['updatedBy.id', 'updatedBy.name'])
      .withDeleted()
      .getMany();

    return rows.map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy
        ? { id: row.updatedBy.id, name: row.updatedBy.name }
        : null,
    }));
  }

  /**
   * Uma instrução para todas as chaves enviadas — atômico, sem transação
   * explícita, sem corrida na PK quando dois admins gravam a mesma chave.
   *
   * Dois comportamentos do TypeORM 0.3.31, auditados no código-fonte:
   * `orUpdate` acrescenta sozinho `"updatedAt" = DEFAULT` para a coluna
   * `@UpdateDateColumn` que não está no `overwrite`
   * (`InsertQueryBuilder.js` ~360); e a coluna `jsonb` serializa valor não
   * nulo com `JSON.stringify` e `null` vira SQL NULL
   * (`PostgresDriver.preparePersistentValue`).
   */
  async upsert(writes: SettingWrite[], updatedById: User['id']): Promise<void> {
    if (!writes.length) {
      return;
    }

    await this.settingRepository
      .createQueryBuilder()
      .insert()
      .into(SettingEntity)
      .values(
        // `value` é `unknown` na entidade (decisão 15: o que está gravado não
        // é confiável) — o que faz `QueryDeepPartialEntity` não aceitar
        // `null` na inferência. O cast é só de tipo: o driver segue
        // serializando jsonb normalmente (`JSON.stringify` / SQL NULL).
        writes.map((write) => ({
          key: write.key,
          value: write.value,
          updatedBy: { id: updatedById } as UserEntity,
        })) as unknown as QueryDeepPartialEntity<SettingEntity>[],
      )
      .orUpdate(['value', 'updated_by_id'], ['key'])
      .execute();
  }

  /** Sem `withDeleted` — admin excluído não é contato de ninguém. */
  async findDefaultContactEmail(): Promise<string | null> {
    const admin = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email'])
      .innerJoin('user.role', 'role')
      .where('role.id = :roleId', { roleId: RoleEnum.admin })
      .andWhere('user.email IS NOT NULL')
      .orderBy('user.id', 'ASC')
      .getOne();

    return admin?.email ?? null;
  }
}
