import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NewsRepository } from '../news.repository';
import { NewsEntity } from './entities/news.entity';
import { NewsRelationalRepository } from './repositories/news.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NewsEntity])],
  providers: [
    {
      provide: NewsRepository,
      useClass: NewsRelationalRepository,
    },
  ],
  exports: [NewsRepository],
})
export class RelationalNewsPersistenceModule {}
