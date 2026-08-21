import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BannerRepository } from '../banner.repository';
import { BannerItemEntity } from './entities/banner-item.entity';
import { BannerEntity } from './entities/banner.entity';
import { BannerRelationalRepository } from './repositories/banner.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BannerEntity, BannerItemEntity])],
  providers: [
    {
      provide: BannerRepository,
      useClass: BannerRelationalRepository,
    },
  ],
  exports: [BannerRepository],
})
export class RelationalBannerPersistenceModule {}
