import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { Author } from '../../../authors/domain/author';
import { Category } from '../../../categories/domain/category';
import { Tag } from '../../../tags/domain/tag';
import { News } from '../../domain/news';
import { NewsStatusEnum } from '../../news-status.enum';

export type CreateNewsData = {
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  coverId: string | null;
  status: NewsStatusEnum;
  publishedAt: Date | null;
  categoryId: Category['id'];
  authorId: Author['id'];
  tagIds: Tag['id'][];
  config: Record<string, unknown> | null;
};

/**
 * Só o que foi enviado é tocado. `coverId: null` remove a capa; `tagIds: []`
 * remove as associações; `undefined` em qualquer um mantém o que está lá.
 */
export type UpdateNewsData = {
  title?: string;
  slug?: string;
  summary?: string | null;
  body?: string;
  coverId?: string | null;
  status?: NewsStatusEnum;
  publishedAt?: Date | null;
  categoryId?: Category['id'];
  tagIds?: Tag['id'][];
  config?: Record<string, unknown> | null;
};

export type FindManyNewsOptions = {
  categorySlug?: string;
  tagSlug?: string;
  status?: NewsStatusEnum;
  search?: string;
  paginationOptions: IPaginationOptions;
};

export abstract class NewsRepository {
  abstract create(data: CreateNewsData): Promise<News>;

  abstract findManyWithPagination(
    options: FindManyNewsOptions,
  ): Promise<News[]>;

  abstract findById(id: News['id']): Promise<NullableType<News>>;

  abstract findBySlug(slug: News['slug']): Promise<NullableType<News>>;

  abstract update(
    id: News['id'],
    payload: UpdateNewsData,
  ): Promise<NullableType<News>>;

  abstract slugExists(slug: News['slug']): Promise<boolean>;

  /**
   * Incremento **atômico** de `views` (`SET views = views + 1`). Ler-somar-
   * gravar perderia contagem em acessos simultâneos.
   */
  abstract incrementViews(id: News['id']): Promise<void>;
}
