import { Module } from '@nestjs/common';

import { AuthorsModule } from '../../../../core/authors/authors.module';
import { RelationalFilePersistenceModule } from '../persistence/relational/relational-persistence.module';
import { UploadRegistrarService } from './upload-registrar.service';

/**
 * Importado pelos **três** módulos de uploader. Não importa `FilesModule` (seria
 * ciclo) e não é importado por ele diretamente — chega junto do driver ativo.
 */
@Module({
  imports: [RelationalFilePersistenceModule, AuthorsModule],
  providers: [UploadRegistrarService],
  exports: [UploadRegistrarService],
})
export class UploadRegistrarModule {}
