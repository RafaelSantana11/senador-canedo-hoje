export type AppConfig = {
  nodeEnv: string;
  name: string;
  workingDirectory: string;
  /** Primeira origem de FRONTEND_DOMAIN — base dos links enviados por e-mail. */
  frontendDomain?: string;
  /** Todas as origens de FRONTEND_DOMAIN — allowlist do CORS. */
  corsOrigins: string[];
  backendDomain: string;
  port: number;
  apiPrefix: string;
  fallbackLanguage: string;
  headerLanguage: string;
};
