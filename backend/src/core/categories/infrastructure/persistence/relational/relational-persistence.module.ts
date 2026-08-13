import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryRepository } from '../category.repository';
import { CategoryEntity } from './entities/category.entity';
import { CategoriesRelationalRepository } from './repositories/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [
    {
      provide: CategoryRepository,
      useClass: CategoriesRelationalRepository,
    },
  ],
  exports: [CategoryRepository],
})
export class RelationalCategoryPersistenceModule {}
