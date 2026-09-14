import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/infra/files/domain/file';

import { SettingsUpdater } from './settings-updater';

/**
 * Resposta de `GET`/`PATCH`/`reset` de `/settings` — sempre as 13 chaves,
 * mescladas com os defaults de `settings.registry.ts`, mais o metadado.
 *
 * `updatedBy` é a única propriedade que pode ficar **ausente** do JSON: o
 * service só a atribui quando a leitura é autenticada
 * (`SettingsService.get({ includeAudit: true })`). Sem atribuição, a
 * propriedade não existe na instância e o `ClassSerializerInterceptor` global
 * não a inclui — não é preciso `@Exclude`/condicional de serialização.
 */
export class Settings {
  @ApiProperty({ type: Number, example: 8, description: 'Faixa: 1–50.' })
  MIN_NEWS_FOR_MIDDLE_BANNER: number;

  @ApiProperty({ type: Number, example: 8, description: 'Faixa: 2–20.' })
  BANNER_INTERVAL: number;

  @ApiProperty({ type: Number, example: 2, description: 'Faixa: 1–4.' })
  HERO_SECONDARY_COUNT: number;

  @ApiProperty({ type: Number, example: 5, description: 'Faixa: 3–10.' })
  MOST_READ_COUNT: number;

  @ApiProperty({ type: Number, example: 5, description: 'Faixa: 3–10.' })
  LATEST_COUNT: number;

  @ApiProperty({ type: Number, example: 5, description: 'Faixa: 3–10.' })
  SAW_THIS_BLOCK_SIZE: number;

  @ApiProperty({ type: Number, example: 3, description: 'Faixa: 1–6.' })
  RELATED_NEWS_COUNT: number;

  @ApiProperty({ type: String, example: '556200000000' })
  WHATSAPP_NUMBER: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'admin@exemplo.com.br',
    description:
      'Valor efetivo — o personalizado, ou o e-mail do admin mais antigo ' +
      'quando não há personalização. `null` só se nenhum admin tiver e-mail.',
  })
  CONTACT_EMAIL: string | null;

  @ApiProperty({ type: String, example: 'Senador Canedo Hoje' })
  SITE_NAME: string;

  @ApiProperty({
    type: () => FileType,
    nullable: true,
    description:
      'Recorte do acervo: apenas `id`, `path`, `mimeType` e `type` ' +
      '(derivado). `null` quando não há logo configurado.',
  })
  LOGO: FileType | null;

  @ApiProperty({ type: String, example: 'Senador Canedo Hoje' })
  LOGO_ALT: string;

  @ApiProperty({ type: Boolean, example: false })
  SHOW_NAME_WITH_LOGO: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Só leitura — `true` quando `CONTACT_EMAIL` segue o admin.',
  })
  contactEmailIsDefault: boolean;

  @ApiProperty({
    type: Date,
    nullable: true,
    description:
      'Maior `updatedAt` entre os parâmetros gravados; `null` se nenhum foi tocado ainda.',
  })
  updatedAt: Date | null;

  @ApiPropertyOptional({
    type: () => SettingsUpdater,
    nullable: true,
    description:
      'Ausente no `GET` anônimo; presente com token e em `PATCH`/reset.',
  })
  updatedBy?: SettingsUpdater | null;
}
