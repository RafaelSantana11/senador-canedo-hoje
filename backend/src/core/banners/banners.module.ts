import { Module } from '@nestjs/common';

import { FilesModule } from '../../infra/files/files.module';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { RelationalBannerPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalBannerPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    // Valida que os arquivos referenciados nos itens do carrossel existem.
    FilesModule,
  ],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService, infrastructurePersistenceModule],
})
export class BannersModule {}
