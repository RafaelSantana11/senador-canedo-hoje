import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { Category } from '../../domain/category';

export type CreateCategoryData = {
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  active: boolean;
};

export type UpdateCategoryData = Partial<
  Pick<Category, 'name' | 'slug' | 'description' | 'color' | 'active'>
>;

export abstract class CategoryRepository {
  abstract create(data: CreateCategoryData): Promise<Category>;

  /**
   * `active` é tri-estado: `undefined` devolve todas, `true` só as ativas,
   * `false` só as inativas. `withNewsCount` liga a contagem derivada — a
   * listagem pede, quem só precisa da categoria não paga o custo do `COUNT`.
   */
  abstract findManyWithPagination({
    active,
    withNewsCount,
    paginationOptions,
  }: {
    active?: boolean;
    withNewsCount?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Category[]>;

  abstract findById(id: Category['id']): Promise<NullableType<Category>>;

  abstract update(
    id: Category['id'],
    payload: UpdateCategoryData,
  ): Promise<NullableType<Category>>;

  abstract remove(id: Category['id']): Promise<void>;

  /** `exceptId` permite editar a própria categoria sem colidir consigo mesma. */
  abstract nameExists(
    name: Category['name'],
    exceptId?: Category['id'],
  ): Promise<boolean>;

  abstract slugExists(
    slug: Category['slug'],
    exceptId?: Category['id'],
  ): Promise<boolean>;

  /** Base da recusa de `DELETE` em categoria em uso. */
  abstract countNews(id: Category['id']): Promise<number>;
}
