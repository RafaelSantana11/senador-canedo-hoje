import { User } from '../../../users/domain/user';
import { SettingsUpdater } from '../../domain/settings-updater';
import { SettingKey, SettingValue } from '../../settings.registry';

/**
 * `value` é `unknown` de propósito: o que está no banco não é confiável
 * (faixa pode ter mudado, edição manual) — quem revalida é o service, contra
 * o registro em código.
 */
export type StoredSetting = {
  key: string;
  value: unknown;
  updatedAt: Date;
  updatedBy: SettingsUpdater | null;
};

export type SettingWrite = {
  key: SettingKey;
  /** `null` grava NULL (sem personalização) — nunca apaga a linha. */
  value: SettingValue | null;
};

export abstract class SettingRepository {
  abstract findAll(): Promise<StoredSetting[]>;

  /** Upsert de todas as chaves numa instrução só (last-write-wins). */
  abstract upsert(
    writes: SettingWrite[],
    updatedById: User['id'],
  ): Promise<void>;

  /**
   * E-mail do admin mais antigo (menor `id`), não excluído, com e-mail
   * preenchido. `null` só se nenhum admin tiver e-mail.
   */
  abstract findDefaultContactEmail(): Promise<string | null>;
}
