import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorEntity } from './entities/author.entity';
import { AuthorRepository } from '../author.repository';
import { AuthorsRelationalRepository } from './repositories/author.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorEntity])],
  providers: [
    {
      provide: AuthorRepository,
      useClass: AuthorsRelationalRepository,
    },
  ],
  exports: [AuthorRepository],
})
export class RelationalAuthorPersistenceModule {}
