import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { Tag } from '../../domain/tag';

export type CreateTagData = {
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
};

export type UpdateTagData = Partial<
  Pick<Tag, 'name' | 'slug' | 'description' | 'color'>
>;

export abstract class TagRepository {
  abstract create(data: CreateTagData): Promise<Tag>;

  abstract findManyWithPagination({
    search,
    withUsageCount,
    paginationOptions,
  }: {
    search?: string;
    withUsageCount?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Tag[]>;

  abstract findById(id: Tag['id']): Promise<NullableType<Tag>>;

  /** Usado para resolver as tags do payload de News em uma única consulta. */
  abstract findByIds(ids: Tag['id'][]): Promise<Tag[]>;

  abstract update(
    id: Tag['id'],
    payload: UpdateTagData,
  ): Promise<NullableType<Tag>>;

  /**
   * Apaga a tag **e** suas associações em `news_tags` — a notícia continua
   * existindo, só perde a etiqueta.
   */
  abstract remove(id: Tag['id']): Promise<void>;

  abstract nameExists(
    name: Tag['name'],
    exceptId?: Tag['id'],
  ): Promise<boolean>;

  abstract slugExists(
    slug: Tag['slug'],
    exceptId?: Tag['id'],
  ): Promise<boolean>;
}
