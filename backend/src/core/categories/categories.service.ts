import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { slugify } from '../../utils/slug';
import { NullableType } from '../../utils/types/nullable.type';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { Category } from './domain/category';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryRepository,
  UpdateCategoryData,
} from './infrastructure/persistence/category.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoryRepository) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    await this.assertNameIsFree(createCategoryDto.name);

    const slug = createCategoryDto.slug
      ? await this.assertSlugIsFree(createCategoryDto.slug)
      : await this.generateUniqueSlug(createCategoryDto.name);

    return this.categoriesRepository.create({
      name: createCategoryDto.name,
      slug,
      description: createCategoryDto.description ?? null,
      color: createCategoryDto.color ?? null,
      active: createCategoryDto.active ?? true,
    });
  }

  /**
   * `authenticated` é a única diferença entre a listagem pública e a do painel:
   * categoria inativa continua existindo e vinculada às notícias, mas não
   * aparece para o visitante — e o filtro `?active=` dele é ignorado, senão
   * `?active=false` seria uma porta para ver o que está fora do ar.
   */
  findManyWithPagination({
    authenticated,
    active,
    paginationOptions,
  }: {
    authenticated: boolean;
    active?: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<Category[]> {
    return this.categoriesRepository.findManyWithPagination({
      active: authenticated ? active : true,
      withNewsCount: true,
      paginationOptions,
    });
  }

  findById(id: Category['id']): Promise<NullableType<Category>> {
    return this.categoriesRepository.findById(id);
  }

  /** Usado por `NewsService` ao validar o `category` do payload. */
  async findByIdOrFail(id: Category['id']): Promise<Category> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'categoryNotFound',
        },
      });
    }

    return category;
  }

  async update(
    id: Category['id'],
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findByIdOrFail(id);

    const payload: UpdateCategoryData = {};

    if (
      updateCategoryDto.name !== undefined &&
      updateCategoryDto.name !== category.name
    ) {
      await this.assertNameIsFree(updateCategoryDto.name, id);
      payload.name = updateCategoryDto.name;
    }

    if (
      updateCategoryDto.slug !== undefined &&
      updateCategoryDto.slug !== category.slug
    ) {
      await this.assertSlugIsFree(updateCategoryDto.slug, id);
      payload.slug = updateCategoryDto.slug;
    }

    if (updateCategoryDto.description !== undefined) {
      payload.description = updateCategoryDto.description;
    }

    if (updateCategoryDto.color !== undefined) {
      payload.color = updateCategoryDto.color;
    }

    if (updateCategoryDto.active !== undefined) {
      payload.active = updateCategoryDto.active;
    }

    const updated = await this.categoriesRepository.update(id, payload);

    if (!updated) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'categoryNotFound',
        },
      });
    }

    return updated;
  }

  /**
   * Só apaga categoria sem nenhuma notícia vinculada. A checagem é explícita no
   * service, e não deixada para o erro de FK do banco, porque violação de
   * constraint sobe como `500` com mensagem de driver — inútil para o front.
   * Para categoria em uso, a saída é `active: false`.
   */
  async remove(id: Category['id']): Promise<void> {
    await this.findByIdOrFail(id);

    const newsCount = await this.categoriesRepository.countNews(id);

    if (newsCount > 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          id: 'categoryHasNews',
        },
      });
    }

    await this.categoriesRepository.remove(id);
  }

  private async assertNameIsFree(
    name: string,
    exceptId?: Category['id'],
  ): Promise<void> {
    if (await this.categoriesRepository.nameExists(name, exceptId)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'nameAlreadyExists',
        },
      });
    }
  }

  private async assertSlugIsFree(
    slug: string,
    exceptId?: Category['id'],
  ): Promise<string> {
    if (await this.categoriesRepository.slugExists(slug, exceptId)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          slug: 'slugAlreadyExists',
        },
      });
    }

    return slug;
  }

  /**
   * Mesma regra do `Author`: sufixo numérico incremental em caso de colisão
   * (`politica`, `politica-2`, ...). O índice único é a garantia final — duas
   * criações simultâneas do mesmo nome fazem a segunda falhar na constraint.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name ?? '') || 'categoria';

    let candidate = base;
    let suffix = 1;

    while (await this.categoriesRepository.slugExists(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }
}
