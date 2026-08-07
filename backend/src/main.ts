import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './infra/config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  // CORS restrito às origens de FRONTEND_DOMAIN.
  //
  // Antes era `cors: true`, que reflete QUALQUER origem. Como front e API ficam
  // em sites diferentes, o CORS deixa de ser detalhe e passa a ser a fronteira
  // de quem consegue chamar a API pelo navegador.
  //
  // `credentials` fica de fora de propósito: a autenticação é por Bearer token
  // no header, não por cookie — não há credencial que o navegador anexe
  // sozinho, então não há o que liberar (e liberar abriria superfície à toa).
  const corsOrigins = configService.get('app.corsOrigins', { infer: true });

  if (!corsOrigins?.length) {
    // `origin: false` bloqueia todo cross-origin. Sem FRONTEND_DOMAIN não há
    // como saber quem liberar, e falhar fechado é melhor que reabrir para todos.
    console.warn(
      '[CORS] FRONTEND_DOMAIN não configurada — nenhuma origem cross-site ' +
        'será aceita. Defina FRONTEND_DOMAIN (lista separada por vírgula).',
    );
  }

  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      configService.getOrThrow('app.headerLanguage', { infer: true }),
    ],
    maxAge: 3600,
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/', 'health'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
