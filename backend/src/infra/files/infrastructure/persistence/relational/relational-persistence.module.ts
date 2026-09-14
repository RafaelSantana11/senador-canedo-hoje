import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerItemEntity } from '../../../../../core/banners/infrastructure/persistence/relational/entities/banner-item.entity';
import { NewsEntity } from '../../../../../core/news/infrastructure/persistence/relational/entities/news.entity';
import { SettingEntity } from '../../../../../core/settings/infrastructure/persistence/relational/entities/setting.entity';
import { UserEntity } from '../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from '../file.repository';
import { FileRelationalRepository } from './repositories/file.repository';

@Module({
  // `NewsEntity`, `UserEntity`, `BannerItemEntity` e `SettingEntity` entram
  // aqui só para a checagem de uso do arquivo (as quatro referências a `file`
  // que existem hoje). É `forFeature` de entidade, não import de módulo:
  // importar `NewsModule`/`UsersModule` fecharia ciclo, já que ambos importam
  // `FilesModule`.
  imports: [
    TypeOrmModule.forFeature([
      FileEntity,
      NewsEntity,
      UserEntity,
      BannerItemEntity,
      SettingEntity,
    ]),
  ],
  providers: [
    {
      provide: FileRepository,
      useClass: FileRelationalRepository,
    },
  ],
  exports: [FileRepository],
})
export class RelationalFilePersistenceModule {}
