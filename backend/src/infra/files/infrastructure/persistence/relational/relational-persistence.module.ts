import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerItemEntity } from '../../../../../core/banners/infrastructure/persistence/relational/entities/banner-item.entity';
import { NewsEntity } from '../../../../../core/news/infrastructure/persistence/relational/entities/news.entity';
import { UserEntity } from '../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { FileEntity } from './entities/file.entity';
import { FileRepository } from '../file.repository';
import { FileRelationalRepository } from './repositories/file.repository';

@Module({
  // `NewsEntity`, `UserEntity` e `BannerItemEntity` entram aqui só para a
  // checagem de uso do arquivo (as três referências a `file` que existem hoje).
  // É `forFeature` de entidade, não import de módulo: importar `NewsModule` ou
  // `UsersModule` fecharia ciclo, já que ambos importam `FilesModule`.
  imports: [
    TypeOrmModule.forFeature([
      FileEntity,
      NewsEntity,
      UserEntity,
      BannerItemEntity,
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
