import { registerAs } from '@nestjs/config';
import { AppConfig } from './app-config.type';
import validateConfig from '../../utils/validate-config';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT: number;

  // Sem @IsUrl aqui de propósito: aceita LISTA separada por vírgula (dev +
  // produção), formato que o @IsUrl rejeitaria. Cada item é validado como URL
  // no parse abaixo, então a garantia não se perde.
  @IsString()
  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  APP_FALLBACK_LANGUAGE: string;

  @IsString()
  @IsOptional()
  APP_HEADER_LANGUAGE: string;
}

/**
 * `FRONTEND_DOMAIN` aceita uma ou mais origens separadas por vírgula — o front
 * roda em host diferente da API, então esta lista é a allowlist do CORS
 * (ver `main.ts`) e precisa cobrir local + produção ao mesmo tempo.
 *
 * A **primeira** origem é a canônica: é ela que monta os links dos e-mails de
 * recuperação de senha e confirmação. Ordene de acordo.
 */
const parseFrontendDomains = (raw?: string): string[] =>
  (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .map((origin) => {
      // Cada item continua validado como URL, apesar de o @IsUrl ter saído do
      // validador de env — um typo aqui vira CORS silenciosamente quebrado em
      // produção, que é caro de diagnosticar pelo sintoma.
      try {
        new URL(origin);
      } catch {
        throw new Error(
          `FRONTEND_DOMAIN contém uma origem inválida: "${origin}". ` +
            'Use URLs completas separadas por vírgula, ex.: ' +
            'http://localhost:3000,https://portal.exemplo.com.br',
        );
      }
      return origin;
    });

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const corsOrigins = parseFrontendDomains(process.env.FRONTEND_DOMAIN);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: corsOrigins[0],
    corsOrigins,
    backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    fallbackLanguage: process.env.APP_FALLBACK_LANGUAGE || 'pt',
    headerLanguage: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
  };
});
