import { Module } from '@nestjs/common';

import { RelationalFilePersistenceModule } from '../../infra/files/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalUserPersistenceModule } from '../users/infrastructure/persistence/relational/relational-persistence.module';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { RelationalAuthorPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalAuthorPersistenceModule;

/**
 * ⚠️ Aqui entram **repositórios**, nunca `UsersModule` nem `FilesModule` — os
 * dois fechariam ciclo com este módulo:
 *
 * - `UsersModule` → `AuthorsModule` (o signup cria o `Author` 1:1);
 * - `FilesModule` → módulo do driver → `UploadRegistrarModule` → `AuthorsModule`.
 *
 * `RelationalUserPersistenceModule` e `RelationalFilePersistenceModule` só
 * importam `TypeOrmModule.forFeature` e não dependem de nada de Authors, então
 * o ciclo não se forma e não é preciso `forwardRef`.
 */
@Module({
  imports: [
    infrastructurePersistenceModule,
    // `PATCH /authors/:id` grava `name`/`photo` no `User` dono do perfil.
    RelationalUserPersistenceModule,
    // valida que a `photo` referenciada existe no acervo.
    RelationalFilePersistenceModule,
  ],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService, infrastructurePersistenceModule],
})
export class AuthorsModule {}
