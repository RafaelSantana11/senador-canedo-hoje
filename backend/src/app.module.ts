import { Module } from '@nestjs/common';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import databaseConfig from './infra/database/config/database.config';
import authConfig from './core/auth/config/auth.config';
import appConfig from './infra/config/app.config';
import mailConfig from './core/mail/config/mail.config';
import googleConfig from './core/auth-google/config/google.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGoogleModule } from './core/auth-google/auth-google.module';
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
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        googleConfig,
      ],
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
    AuthGoogleModule,
    SessionModule,
    MailModule,
    MailerModule,
    HomeModule,
    HealthModule,
  ],
})
export class AppModule {}
