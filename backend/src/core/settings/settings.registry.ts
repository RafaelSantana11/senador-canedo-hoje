import { isEmail, isUUID } from 'class-validator';

/**
 * Fonte de verdade dos 13 parâmetros do portal. Sem I/O: quem lê do banco e
 * resolve o default do e-mail de contato é o service (`settings.service.ts`).
 *
 * `null` **não** passa por `parse` — tem significado por chave (decisão 2 do
 * plano) e é tratado antes, pelo chamador: grava NULL se `nullable`, senão
 * `invalidType`.
 */
export const SETTING_KEYS = [
  'MIN_NEWS_FOR_MIDDLE_BANNER',
  'BANNER_INTERVAL',
  'HERO_SECONDARY_COUNT',
  'MOST_READ_COUNT',
  'LATEST_COUNT',
  'SAW_THIS_BLOCK_SIZE',
  'RELATED_NEWS_COUNT',
  'WHATSAPP_NUMBER',
  'CONTACT_EMAIL',
  'SITE_NAME',
  'LOGO',
  'LOGO_ALT',
  'SHOW_NAME_WITH_LOGO',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Metadado só leitura — enviar qualquer um destes no `PATCH` é `readOnlyField`. */
export const READ_ONLY_FIELDS = new Set([
  'updatedAt',
  'updatedBy',
  'contactEmailIsDefault',
]);

export type SettingErrorCode =
  | 'invalidType'
  | 'valueOutOfRange'
  | 'whatsappInvalidFormat'
  | 'emailInvalidFormat'
  | 'emptyValue'
  | 'valueTooLong'
  | 'imageNotExists'
  | 'unknownSetting'
  | 'readOnlyField';

export type LogoReference = { id: string };

export type SettingValue = number | string | boolean | LogoReference;

export type ParseResult = { value: SettingValue } | { error: SettingErrorCode };

type SettingDefinition = {
  defaultValue: SettingValue | null;
  /** `true`: `null` no `PATCH`/reset grava NULL (volta ao default). */
  nullable: boolean;
  parse: (raw: unknown) => ParseResult;
};

const integerBetween =
  (min: number, max: number) =>
  (raw: unknown): ParseResult => {
    if (typeof raw !== 'number' || !Number.isInteger(raw)) {
      return { error: 'invalidType' };
    }
    if (raw < min || raw > max) {
      return { error: 'valueOutOfRange' };
    }
    return { value: raw };
  };

const whatsappNumber = (raw: unknown): ParseResult => {
  if (typeof raw !== 'string') {
    return { error: 'invalidType' };
  }
  const trimmed = raw.trim();
  if (!/^\d{10,15}$/.test(trimmed)) {
    return { error: 'whatsappInvalidFormat' };
  }
  return { value: trimmed };
};

const contactEmail = (raw: unknown): ParseResult => {
  if (typeof raw !== 'string') {
    return { error: 'invalidType' };
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 254) {
    return { error: 'emailInvalidFormat' };
  }
  if (!isEmail(normalized)) {
    return { error: 'emailInvalidFormat' };
  }
  return { value: normalized };
};

const siteName = (raw: unknown): ParseResult => {
  if (typeof raw !== 'string') {
    return { error: 'invalidType' };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { error: 'emptyValue' };
  }
  if (trimmed.length > 120) {
    return { error: 'valueTooLong' };
  }
  return { value: trimmed };
};

const logoAlt = (raw: unknown): ParseResult => {
  if (typeof raw !== 'string') {
    return { error: 'invalidType' };
  }
  const trimmed = raw.trim();
  if (trimmed.length > 255) {
    return { error: 'valueTooLong' };
  }
  return { value: trimmed };
};

const booleanValue = (raw: unknown): ParseResult => {
  if (typeof raw !== 'boolean') {
    return { error: 'invalidType' };
  }
  return { value: raw };
};

/**
 * Só a forma: objeto com `id` string em formato uuid. A existência do arquivo
 * no acervo é responsabilidade do service (`filesService.findById`), não
 * deste registro (que não faz I/O). `id` que não é uuid nunca deve chegar ao
 * Postgres — a coluna `file.id` é `uuid` e a query daria `500` — por isso o
 * erro aqui já é `imageNotExists`, não `invalidType`.
 */
const logoReference = (raw: unknown): ParseResult => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { error: 'invalidType' };
  }
  const id = (raw as Record<string, unknown>).id;
  if (typeof id !== 'string') {
    return { error: 'invalidType' };
  }
  if (!isUUID(id)) {
    return { error: 'imageNotExists' };
  }
  return { value: { id } };
};

export const SETTINGS_REGISTRY: Record<SettingKey, SettingDefinition> = {
  MIN_NEWS_FOR_MIDDLE_BANNER: {
    defaultValue: 8,
    nullable: false,
    parse: integerBetween(1, 50),
  },
  BANNER_INTERVAL: {
    defaultValue: 8,
    nullable: false,
    parse: integerBetween(2, 20),
  },
  HERO_SECONDARY_COUNT: {
    defaultValue: 2,
    nullable: false,
    parse: integerBetween(1, 4),
  },
  MOST_READ_COUNT: {
    defaultValue: 5,
    nullable: false,
    parse: integerBetween(3, 10),
  },
  LATEST_COUNT: {
    defaultValue: 5,
    nullable: false,
    parse: integerBetween(3, 10),
  },
  SAW_THIS_BLOCK_SIZE: {
    defaultValue: 5,
    nullable: false,
    parse: integerBetween(3, 10),
  },
  RELATED_NEWS_COUNT: {
    defaultValue: 3,
    nullable: false,
    parse: integerBetween(1, 6),
  },
  WHATSAPP_NUMBER: {
    defaultValue: '556200000000',
    nullable: false,
    parse: whatsappNumber,
  },
  // Sem personalização (`null`), o default é resolvido pelo service a cada
  // leitura — o e-mail do admin mais antigo. Nunca copiado para cá.
  CONTACT_EMAIL: {
    defaultValue: null,
    nullable: true,
    parse: contactEmail,
  },
  SITE_NAME: {
    defaultValue: 'Senador Canedo Hoje',
    nullable: false,
    parse: siteName,
  },
  LOGO: {
    defaultValue: null,
    nullable: true,
    parse: logoReference,
  },
  LOGO_ALT: {
    defaultValue: 'Senador Canedo Hoje',
    nullable: false,
    parse: logoAlt,
  },
  SHOW_NAME_WITH_LOGO: {
    defaultValue: false,
    nullable: false,
    parse: booleanValue,
  },
};

/** `hasOwnProperty`, não `in` — `constructor`/`__proto__` não são chaves. */
export const isSettingKey = (key: string): key is SettingKey =>
  Object.prototype.hasOwnProperty.call(SETTINGS_REGISTRY, key);
