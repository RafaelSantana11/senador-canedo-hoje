import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { slugify } from '../../utils/slug';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import {
  TagRepository,
  UpdateTagData,
} from './infrastructure/persistence/tag.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagRepository) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    await this.assertNameIsFree(createTagDto.name);

    const slug = createTagDto.slug
      ? await this.assertSlugIsFree(createTagDto.slug)
      : await this.generateUniqueSlug(createTagDto.name);

    return this.tagsRepository.create({
      name: createTagDto.name,
      slug,
      description: createTagDto.description ?? null,
      color: createTagDto.color ?? null,
    });
  }

  findManyWithPagination({
    search,
    paginationOptions,
  }: {
    search?: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Tag[]> {
    return this.tagsRepository.findManyWithPagination({
      search,
      withUsageCount: true,
      paginationOptions,
    });
  }

  /**
   * Resolve as tags de um payload de News. Devolve erro apontando os ids que
   * não existem em vez de ignorá-los em silêncio — tag sumida da notícia sem
   * aviso é bug difícil de enxergar no painel.
   */
  async findByIdsOrFail(ids: Tag['id'][]): Promise<Tag[]> {
    const unique = [...new Set(ids)];
    const tags = await this.tagsRepository.findByIds(unique);

    if (tags.length !== unique.length) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          tags: 'tagNotExists',
        },
      });
    }

    return tags;
  }

  async update(id: Tag['id'], updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findByIdOrFail(id);

    const payload: UpdateTagData = {};

    if (updateTagDto.name !== undefined && updateTagDto.name !== tag.name) {
      await this.assertNameIsFree(updateTagDto.name, id);
      payload.name = updateTagDto.name;
    }

    if (updateTagDto.slug !== undefined && updateTagDto.slug !== tag.slug) {
      await this.assertSlugIsFree(updateTagDto.slug, id);
      payload.slug = updateTagDto.slug;
    }

    if (updateTagDto.description !== undefined) {
      payload.description = updateTagDto.description;
    }

    if (updateTagDto.color !== undefined) {
      payload.color = updateTagDto.color;
    }

    const updated = await this.tagsRepository.update(id, payload);

    if (!updated) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'tagNotFound',
        },
      });
    }

    return updated;
  }

  /** A notícia não é afetada: perde a associação, não deixa de existir. */
  async remove(id: Tag['id']): Promise<void> {
    await this.findByIdOrFail(id);

    await this.tagsRepository.remove(id);
  }

  private async findByIdOrFail(id: Tag['id']): Promise<Tag> {
    const tag = await this.tagsRepository.findById(id);

    if (!tag) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'tagNotFound',
        },
      });
    }

    return tag;
  }

  private async assertNameIsFree(
    name: string,
    exceptId?: Tag['id'],
  ): Promise<void> {
    if (await this.tagsRepository.nameExists(name, exceptId)) {
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
    exceptId?: Tag['id'],
  ): Promise<string> {
    if (await this.tagsRepository.slugExists(slug, exceptId)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          slug: 'slugAlreadyExists',
        },
      });
    }

    return slug;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name ?? '') || 'tag';

    let candidate = base;
    let suffix = 1;

    while (await this.tagsRepository.slugExists(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }
}
