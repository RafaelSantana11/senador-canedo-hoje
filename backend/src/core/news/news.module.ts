import { Module } from '@nestjs/common';

import { FilesModule } from '../../infra/files/files.module';
import { AuthorsModule } from '../authors/authors.module';
import { CategoriesModule } from '../categories/categories.module';
import { TagsModule } from '../tags/tags.module';
import { RelationalNewsPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

const infrastructurePersistenceModule = RelationalNewsPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    // `AuthorsModule` resolve a assinatura da notícia a partir do usuário
    // logado; os outros três validam as referências do payload.
    AuthorsModule,
    CategoriesModule,
    TagsModule,
    FilesModule,
  ],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService, infrastructurePersistenceModule],
})
export class NewsModule {}
