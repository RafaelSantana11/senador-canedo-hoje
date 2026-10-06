/**
 * Contrato de `GET`/`PATCH /settings` e `POST /settings/reset`
 * (INTEGRACAO-PARAMETROS-SETTINGS.md §2).
 *
 * O servidor devolve **todas as chaves, sempre**, mesclando o que está no banco
 * sobre os defaults de código — o front nunca lida com objeto parcial. Tipos
 * são estáveis: `number` volta number, `boolean` volta boolean.
 */

/** Recorte do acervo devolvido em `LOGO` — nunca achatado em `LOGO_URL`. */
export type SettingsLogo = {
  id: string
  path: string
  mimeType?: string | null
  type?: string | null
}

/** Quem gravou por último. Só existe no `GET` autenticado e nas respostas de escrita. */
export type SettingsUpdatedBy = {
  id: number
  name: string
}

export type Settings = {
  MIN_NEWS_FOR_MIDDLE_BANNER: number
  BANNER_INTERVAL: number
  HERO_SECONDARY_COUNT: number
  MOST_READ_COUNT: number
  LATEST_COUNT: number
  SAW_THIS_BLOCK_SIZE: number
  RELATED_NEWS_COUNT: number
  WHATSAPP_NUMBER: string
  /** Valor efetivo; `null` quando não há admin com e-mail. `contactEmailIsDefault` diz a origem. */
  CONTACT_EMAIL: string | null
  SITE_NAME: string
  /** `null` = sem logo configurado. */
  LOGO: SettingsLogo | null
  LOGO_ALT: string
  SHOW_NAME_WITH_LOGO: boolean
  /** Read-only: o e-mail veio do admin do painel, não de uma personalização. */
  contactEmailIsDefault: boolean
  /** Read-only: `null` enquanto nada foi gravado (tabela vazia = tudo default). */
  updatedAt: string | null
  /** Read-only; ausente no `GET` anônimo. */
  updatedBy?: SettingsUpdatedBy
}

/** Chaves graváveis — enviar qualquer outra é `422 unknownSetting`. */
export const SETTING_KEYS = [
  "MIN_NEWS_FOR_MIDDLE_BANNER",
  "BANNER_INTERVAL",
  "HERO_SECONDARY_COUNT",
  "MOST_READ_COUNT",
  "LATEST_COUNT",
  "SAW_THIS_BLOCK_SIZE",
  "RELATED_NEWS_COUNT",
  "WHATSAPP_NUMBER",
  "CONTACT_EMAIL",
  "SITE_NAME",
  "LOGO",
  "LOGO_ALT",
  "SHOW_NAME_WITH_LOGO",
] as const

export type SettingKey = (typeof SETTING_KEYS)[number]

/**
 * Corpo do `PATCH`: parcial, só as chaves enviadas são tocadas.
 *
 * `null` tem significado por chave: em `LOGO` remove o logo; em `CONTACT_EMAIL`
 * apaga a personalização e volta a seguir o e-mail do admin. Nas demais chaves,
 * `null` é `422 invalidType`. Em `LOGO`, o `path` do eco do upload é descartado
 * — o servidor só usa o `id`.
 */
export type SettingsPatch = Partial<{
  MIN_NEWS_FOR_MIDDLE_BANNER: number
  BANNER_INTERVAL: number
  HERO_SECONDARY_COUNT: number
  MOST_READ_COUNT: number
  LATEST_COUNT: number
  SAW_THIS_BLOCK_SIZE: number
  RELATED_NEWS_COUNT: number
  WHATSAPP_NUMBER: string
  CONTACT_EMAIL: string | null
  SITE_NAME: string
  LOGO: { id: string } | null
  LOGO_ALT: string
  SHOW_NAME_WITH_LOGO: boolean
}>

export type SettingsErrorCode =
  | "invalidType"
  | "valueOutOfRange"
  | "whatsappInvalidFormat"
  | "emailInvalidFormat"
  | "emptyValue"
  | "valueTooLong"
  | "imageNotExists"
  | "unknownSetting"
  | "readOnlyField"
