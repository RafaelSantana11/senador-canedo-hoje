import {
  // common
  Module,
} from '@nestjs/common';
import { RelationalFilePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import fileConfig from './config/file.config';
import { FileConfig, FileDriver } from './config/file-config.type';
import { FilesLocalModule } from './infrastructure/uploader/local/files.module';
import { FilesS3Module } from './infrastructure/uploader/s3/files.module';
import { FilesS3PresignedModule } from './infrastructure/uploader/s3-presigned/files.module';

const infrastructurePersistenceModule = RelationalFilePersistenceModule;

const infrastructureUploaderModule =
  (fileConfig() as FileConfig).driver === FileDriver.LOCAL
    ? FilesLocalModule
    : (fileConfig() as FileConfig).driver === FileDriver.S3
      ? FilesS3Module
      : FilesS3PresignedModule;

/**
 * ⚠️ `FilesController` (o CRUD do acervo) é declarado **aqui**, e não dentro do
 * módulo do driver: `infrastructureUploaderModule` muda conforme o
 * `FILE_DRIVER`, então um controller registrado lá existiria em um driver e
 * sumiria em outro. Só o `POST /files/upload` (e, no driver `local`, o serviço
 * do binário) vem do módulo do driver.
 *
 * Do módulo do driver vem também o `StorageRemover`, que `FilesService` usa para
 * tirar o objeto do storage na exclusão — os três drivers o proveem, então ele
 * está sempre disponível, seja qual for o escolhido.
 */
@Module({
  imports: [
    // import modules, etc.
    infrastructurePersistenceModule,
    infrastructureUploaderModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, infrastructurePersistenceModule],
})
export class FilesModule {}
