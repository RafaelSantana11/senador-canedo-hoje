import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryEntity } from '../../../../../core/categories/infrastructure/persistence/relational/entities/category.entity';
import { CategorySeedService } from './category-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [CategorySeedService],
  exports: [CategorySeedService],
})
export class CategorySeedModule {}
