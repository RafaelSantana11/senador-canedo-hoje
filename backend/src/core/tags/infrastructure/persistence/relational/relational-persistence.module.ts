import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TagRepository } from '../tag.repository';
import { TagEntity } from './entities/tag.entity';
import { TagsRelationalRepository } from './repositories/tag.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  providers: [
    {
      provide: TagRepository,
      useClass: TagsRelationalRepository,
    },
  ],
  exports: [TagRepository],
})
export class RelationalTagPersistenceModule {}
