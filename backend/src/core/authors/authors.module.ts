import { Module } from '@nestjs/common';

import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { RelationalAuthorPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalAuthorPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService, infrastructurePersistenceModule],
})
export class AuthorsModule {}
