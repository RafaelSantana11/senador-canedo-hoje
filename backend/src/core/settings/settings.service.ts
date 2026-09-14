import {
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';

import { FileType } from 'src/infra/files/domain/file';
import { FilesService } from 'src/infra/files/files.service';

import { User } from '../users/domain/user';
import { Settings } from './domain/settings';
import {
  SettingRepository,
  SettingWrite,
} from './infrastructure/persistence/setting.repository';
import {
  LogoReference,
  READ_ONLY_FIELDS,
  SETTING_KEYS,
  SETTINGS_REGISTRY,
  SettingErrorCode,
  SettingKey,
  SettingValue,
  isSettingKey,
} from './settings.registry';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly settingRepository: SettingRepository,
    private readonly filesService: FilesService,
  ) {}

  /**
   * `includeAudit: false` (leitura anônima) faz `updatedBy` **nunca** ser
   * atribuído: sem atribuição, a propriedade não existe na instância e some
   * do JSON pelo `ClassSerializerInterceptor` global — não é `null`, é ausente.
   */
  async get({ includeAudit }: { includeAudit: boolean }): Promise<Settings> {
    const rows = await this.settingRepository.findAll();
    const byKey = new Map(rows.map((row) => [row.key, row]));

    const values = new Map<SettingKey, SettingValue | null>();

    for (const key of SETTING_KEYS) {
      const row = byKey.get(key);

      // Sem linha, ou linha com NULL: sem personalização.
      if (!row || row.value === null || row.value === undefined) {
        values.set(key, null);
        continue;
      }

      // Leitura defensiva (decisão 15): valor gravado que não passa mais no
      // registro (faixa mudou, edição manual no banco) responde o default.
      const parsed = SETTINGS_REGISTRY[key].parse(row.value);

      if ('error' in parsed) {
        this.logger.warn(
          `Setting ${key} tem valor inválido no banco (${parsed.error}); respondendo o default.`,
        );
        values.set(key, null);
        continue;
      }

      values.set(key, parsed.value);
    }

    const [logo, contactEmail] = await Promise.all([
      this.resolveLogo(values.get('LOGO') as LogoReference | null),
      this.resolveContactEmail(values.get('CONTACT_EMAIL') as string | null),
    ]);

    const settings = new Settings();
    settings.MIN_NEWS_FOR_MIDDLE_BANNER = this.orDefault(
      values,
      'MIN_NEWS_FOR_MIDDLE_BANNER',
    ) as number;
    settings.BANNER_INTERVAL = this.orDefault(
      values,
      'BANNER_INTERVAL',
    ) as number;
    settings.HERO_SECONDARY_COUNT = this.orDefault(
      values,
      'HERO_SECONDARY_COUNT',
    ) as number;
    settings.MOST_READ_COUNT = this.orDefault(
      values,
      'MOST_READ_COUNT',
    ) as number;
    settings.LATEST_COUNT = this.orDefault(values, 'LATEST_COUNT') as number;
    settings.SAW_THIS_BLOCK_SIZE = this.orDefault(
      values,
      'SAW_THIS_BLOCK_SIZE',
    ) as number;
    settings.RELATED_NEWS_COUNT = this.orDefault(
      values,
      'RELATED_NEWS_COUNT',
    ) as number;
    settings.WHATSAPP_NUMBER = this.orDefault(
      values,
      'WHATSAPP_NUMBER',
    ) as string;
    settings.CONTACT_EMAIL = contactEmail.value;
    settings.SITE_NAME = this.orDefault(values, 'SITE_NAME') as string;
    settings.LOGO = logo;
    settings.LOGO_ALT = this.orDefault(values, 'LOGO_ALT') as string;
    settings.SHOW_NAME_WITH_LOGO = this.orDefault(
      values,
      'SHOW_NAME_WITH_LOGO',
    ) as boolean;
    settings.contactEmailIsDefault = contactEmail.isDefault;

    let latest: (typeof rows)[number] | null = null;
    for (const row of rows) {
      if (!latest || row.updatedAt > latest.updatedAt) {
        latest = row;
      }
    }
    settings.updatedAt = latest?.updatedAt ?? null;
    if (includeAudit) {
      settings.updatedBy = latest?.updatedBy ?? null;
    }

    return settings;
  }

  /**
   * Corpo não é objeto (ou é array) → `422 { settings: 'invalidType' }`.
   * Validação atômica: todos os erros voltam juntos, e uma chave inválida
   * recusa a requisição inteira — `writes` só é gravado se `errors` ficar
   * vazio.
   */
  async update(payload: unknown, updatedById: User['id']): Promise<Settings> {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { settings: 'invalidType' },
      });
    }

    // Map, não objeto literal: uma chave `__proto__` no corpo não pode virar
    // o protótipo do objeto de erros (armadilha do Passo 4).
    const errors = new Map<string, SettingErrorCode>();
    const writes: SettingWrite[] = [];

    for (const [key, raw] of Object.entries(
      payload as Record<string, unknown>,
    )) {
      if (READ_ONLY_FIELDS.has(key)) {
        errors.set(key, 'readOnlyField');
        continue;
      }

      if (!isSettingKey(key)) {
        errors.set(key, 'unknownSetting');
        continue;
      }

      const definition = SETTINGS_REGISTRY[key];

      if (raw === null) {
        if (!definition.nullable) {
          errors.set(key, 'invalidType');
          continue;
        }
        // `LOGO: null` remove o logo; `CONTACT_EMAIL: null` volta a seguir o admin.
        writes.push({ key, value: null });
        continue;
      }

      const parsed = definition.parse(raw);

      if ('error' in parsed) {
        errors.set(key, parsed.error);
        continue;
      }

      if (key === 'LOGO') {
        const ref = parsed.value as LogoReference;
        const file = await this.filesService.findById(ref.id);
        if (!file) {
          errors.set(key, 'imageNotExists');
          continue;
        }
      }

      writes.push({ key, value: parsed.value });
    }

    if (errors.size > 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: Object.fromEntries(errors),
      });
    }

    if (writes.length > 0) {
      await this.settingRepository.upsert(writes, updatedById);
    }

    return this.get({ includeAudit: true });
  }

  /** Volta todas as chaves ao default — inclusive `LOGO` e `CONTACT_EMAIL`. */
  async reset(updatedById: User['id']): Promise<Settings> {
    const writes: SettingWrite[] = SETTING_KEYS.map((key) => ({
      key,
      value: null,
    }));

    await this.settingRepository.upsert(writes, updatedById);

    return this.get({ includeAudit: true });
  }

  private orDefault(
    values: Map<SettingKey, SettingValue | null>,
    key: SettingKey,
  ): SettingValue | null {
    return values.get(key) ?? SETTINGS_REGISTRY[key].defaultValue;
  }

  /**
   * `null` (sem logo) ou arquivo apagado por fora da trava (decisão 15) →
   * `null` com `warn`. Recorte igual ao de `BannersService.toPublicItem`:
   * nada de `originalName`/`uploadedBy`.
   */
  private async resolveLogo(
    ref: LogoReference | null,
  ): Promise<FileType | null> {
    if (!ref) {
      return null;
    }

    const file = await this.filesService.findById(ref.id);

    if (!file) {
      this.logger.warn(
        `LOGO aponta para arquivo inexistente (${ref.id}); respondendo null.`,
      );
      return null;
    }

    const image = new FileType();
    image.id = file.id;
    image.path = file.path;
    image.mimeType = file.mimeType ?? null;
    return image;
  }

  /** Sem personalização: resolvido a cada leitura, nunca congelado (armadilha 3). */
  private async resolveContactEmail(
    custom: string | null,
  ): Promise<{ value: string | null; isDefault: boolean }> {
    if (custom !== null) {
      return { value: custom, isDefault: false };
    }

    const defaultEmail = await this.settingRepository.findDefaultContactEmail();
    return { value: defaultEmail, isDefault: true };
  }
}
