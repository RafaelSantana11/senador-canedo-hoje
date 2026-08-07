import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSeedService } from './user-seed.service';
import { UserEntity } from '../../../../../core/users/infrastructure/persistence/relational/entities/user.entity';
import { AuthorEntity } from '../../../../../core/authors/infrastructure/persistence/relational/entities/author.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AuthorEntity])],
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
