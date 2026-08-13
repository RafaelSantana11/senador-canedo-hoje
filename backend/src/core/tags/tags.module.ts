import { Module } from '@nestjs/common';

import { RelationalTagPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

const infrastructurePersistenceModule = RelationalTagPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService, infrastructurePersistenceModule],
})
export class TagsModule {}
