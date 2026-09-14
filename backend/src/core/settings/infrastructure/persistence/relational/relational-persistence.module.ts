import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { SettingRepository } from '../setting.repository';
import { SettingEntity } from './entities/setting.entity';
import { SettingRelationalRepository } from './repositories/setting.repository';

@Module({
  // `UserEntity` entra só para `findDefaultContactEmail` e para carimbar
  // `updatedBy` — repositório de entidade, não `UsersModule`: nenhum módulo
  // importa `SettingsModule`, então não há ciclo a evitar, mas o padrão do
  // projeto (`authors.module.ts`) é este mesmo quando não há ciclo nenhum.
  imports: [TypeOrmModule.forFeature([SettingEntity, UserEntity])],
  providers: [
    {
      provide: SettingRepository,
      useClass: SettingRelationalRepository,
    },
  ],
  exports: [SettingRepository],
})
export class RelationalSettingPersistenceModule {}
