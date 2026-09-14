import { Module } from '@nestjs/common';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { AuthorsModule } from './core/authors/authors.module';
import { BannersModule } from './core/banners/banners.module';
import { CategoriesModule } from './core/categories/categories.module';
import { NewsModule } from './core/news/news.module';
import { SettingsModule } from './core/settings/settings.module';
import { TagsModule } from './core/tags/tags.module';
import databaseConfig from './infra/database/config/database.config';
import authConfig from './core/auth/config/auth.config';
import appConfig from './infra/config/app.config';
import mailConfig from './core/mail/config/mail.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './infra/database/typeorm-config.service';
import { MailModule } from './core/mail/mail.module';
import { HomeModule } from './core/home/home.module';
import { HealthModule } from './core/health/health.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './infra/config/config.type';
import { SessionModule } from './core/session/session.module';
import { MailerModule } from './infra/mailer/mailer.module';
import fileConfig from './infra/files/config/file.config';
import { FilesModule } from './infra/files/files.module';

// ─────────────────────────────────────────────────────────────────────────────
// Login social DESREGISTRADO de propósito — 2026-08-05
//
// O projeto trabalha só com e-mail + senha (decisão do usuário). O módulo
// `AuthGoogleModule` e o `googleConfig` foram removidos das listas `imports`/
// `load` abaixo, mas o CÓDIGO PERMANECE no repositório (`src/core/auth-google/`,
// `src/core/social/`, `AuthService.validateSocialLogin`, a dependência
// `google-auth-library` e as envs GOOGLE_*/FACEBOOK_*/APPLE_APP_AUDIENCE) para
// eventual uso futuro. Nada disso executa enquanto o módulo estiver fora daqui:
// as rotas /api/v1/auth/google/* não existem e o Google some do Swagger.
//
// ⚠️ AO REATIVAR: o OAuth é um TERCEIRO caminho de criação de `User`, por fora do
// `UsersService.create()`. Como todo `User` precisa ter um `Author` 1:1
// (invariante desta fase), o fluxo OAuth terá de criar o `Author` na mesma
// transação — senão o 1:1 fura silenciosamente. Ver docs/auth.md.
// ─────────────────────────────────────────────────────────────────────────────

const infrastructureDatabaseModule = TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
  dataSourceFactory: async (options: DataSourceOptions) => {
    return new DataSource(options).initialize();
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, mailConfig, fileConfig],
      envFilePath: ['.env'],
    }),
    infrastructureDatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    AuthorsModule,
    CategoriesModule,
    TagsModule,
    NewsModule,
    BannersModule,
    SettingsModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    HealthModule,
  ],
})
export class AppModule {}
