import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import validateConfig from '../../../utils/validate-config';
import { MailConfig } from './mail-config.type';

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  MAIL_HOST: string;

  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAIL_PORT: number;

  @Transform(({ value }) => toBoolean(value, false))
  @IsBoolean()
  @IsOptional()
  MAIL_SECURE: boolean;

  @Transform(({ value }) => toBoolean(value, true))
  @IsBoolean()
  @IsOptional()
  MAIL_REQUIRE_TLS: boolean;

  @Transform(({ value }) => toBoolean(value, false))
  @IsBoolean()
  @IsOptional()
  MAIL_IGNORE_TLS: boolean;

  @IsString()
  @IsOptional()
  MAIL_USER: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD: string;

  @IsEmail()
  @IsOptional()
  MAIL_DEFAULT_EMAIL: string;

  @IsString()
  @IsOptional()
  MAIL_DEFAULT_NAME: string;
}

/**
 * Transporte SMTP configurável por env, com os valores do Gmail como default.
 *
 * Antes, `MailerService` hardcodava `smtp.gmail.com:587` e ignorava este
 * arquivo — que já declarava `host`/`port`/`secure`/`requireTLS`/`ignoreTLS` sem
 * ninguém ler. Agora os dois lados conversam: produção usa Gmail + senha de app,
 * e dev pode apontar para o `maildev` só trocando envs.
 *
 * ⚠️ `MAIL_PORT` é usada por dois consumidores diferentes: aqui (porta SMTP de
 * saída) e no `docker-compose`, como porta SMTP do container `maildev`. Os dois
 * usos são coerentes — quem aponta para o maildev usa MAIL_PORT=1025.
 */
export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL,
    defaultName: process.env.MAIL_DEFAULT_NAME,
    // 587 negocia TLS via STARTTLS (secure=false + requireTLS=true).
    // Para a porta 465, use MAIL_SECURE=true.
    secure: toBoolean(process.env.MAIL_SECURE, false),
    requireTLS: toBoolean(process.env.MAIL_REQUIRE_TLS, true),
    ignoreTLS: toBoolean(process.env.MAIL_IGNORE_TLS, false),
  };
});
