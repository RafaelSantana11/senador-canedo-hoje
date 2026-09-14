import { Module } from '@nestjs/common';

import { FilesModule } from '../../infra/files/files.module';
import { RelationalSettingPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

const infrastructurePersistenceModule = RelationalSettingPersistenceModule;

/**
 * Sem referência circular a resolver aqui: nenhum módulo importa
 * `SettingsModule`, então importar `FilesModule` não fecha ciclo (diferente
 * de `AuthorsModule`, que por isso usa repositório em vez de módulo — aqui o
 * módulo é seguro).
 */
@Module({
  imports: [
    infrastructurePersistenceModule,
    // Valida que o arquivo referenciado em LOGO existe no acervo.
    FilesModule,
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService, infrastructurePersistenceModule],
})
export class SettingsModule {}
