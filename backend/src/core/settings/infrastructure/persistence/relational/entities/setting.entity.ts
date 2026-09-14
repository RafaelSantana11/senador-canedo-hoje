import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

/**
 * Chave/valor dos parâmetros do portal.
 *
 * ⚠️ `value` NULL significa **sem personalização** — o servidor resolve o
 * default de código (`settings.registry.ts`) ou, só para `CONTACT_EMAIL`, o
 * e-mail do admin mais antigo. `PATCH { key: null }` e o reset gravam NULL
 * (upsert), nunca apagam a linha: apagar faria `updatedAt` regredir e
 * perderia o registro de quem restaurou.
 *
 * ⚠️ `LOGO` grava `{ id: "<uuid>" }` neste jsonb **sem FK**. A integridade não
 * vem de constraint — vem da 4ª referência somada em
 * `FileRelationalRepository.countUsage`, que consulta este jsonb diretamente.
 */
@Entity({ name: 'setting' })
export class SettingEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: String, length: 64 })
  key: string;

  @Column({ type: 'jsonb', nullable: true })
  value: unknown;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy?: UserEntity | null;
}
