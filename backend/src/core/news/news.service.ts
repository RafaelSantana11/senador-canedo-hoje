import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { FilesService } from 'src/infra/files/files.service';

import { slugify } from '../../utils/slug';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { AuthorsService } from '../authors/authors.service';
import { CategoriesService } from '../categories/categories.service';
import { RoleEnum } from '../roles/roles.enum';
import { TagsService } from '../tags/tags.service';
import { User } from '../users/domain/user';
import { News } from './domain/news';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import {
  CreateNewsData,
  NewsRepository,
  UpdateNewsData,
} from './infrastructure/persistence/news.repository';
import { NewsStatusEnum } from './news-status.enum';

/** O que o service precisa saber de quem está chamando. */
type Requester = Pick<User, 'id' | 'role'>;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly newsRepository: NewsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly tagsService: TagsService,
    private readonly authorsService: AuthorsService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * A notícia é assinada pelo `Author` do usuário autenticado — `author` nunca
   * vem do payload (o DTO recusa). Qualquer usuário do dashboard pode criar.
   */
  async create(
    createNewsDto: CreateNewsDto,
    requester: Requester,
  ): Promise<News> {
    const author = await this.authorsService.findByUserId(requester.id);

    if (!author) {
      // Não deveria acontecer: `User` e `Author` são criados na mesma transação
      // (1:1 obrigatório). Se acontecer, é invariante furado — falhar alto é
      // melhor que publicar notícia sem assinatura.
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          author: 'authorNotFound',
        },
      });
    }

    const category = await this.categoriesService.findByIdOrFail(
      createNewsDto.category.id,
    );

    const tagIds = await this.resolveTagIds(createNewsDto.tags);
    const coverId = await this.resolveCoverId(createNewsDto.cover);

    const status = createNewsDto.status ?? NewsStatusEnum.draft;

    const data: CreateNewsData = {
      title: createNewsDto.title,
      slug: createNewsDto.slug
        ? await this.assertSlugIsFree(createNewsDto.slug)
        : await this.generateUniqueSlug(createNewsDto.title),
      summary: createNewsDto.summary ?? null,
      body: createNewsDto.body,
      coverId,
      status,
      publishedAt: status === NewsStatusEnum.published ? new Date() : null,
      categoryId: category.id,
      authorId: author.id,
      tagIds,
      config: createNewsDto.config ?? null,
    };

    return this.newsRepository.create(data);
  }

  /**
   * Sem autenticação, `status` é **forçado** a `published`: o que vem no query
   * param é ignorado, não recusado. Rascunho vazando é falha de produto.
   */
  findManyWithPagination({
    query,
    authenticated,
    paginationOptions,
  }: {
    query: QueryNewsDto;
    authenticated: boolean;
    paginationOptions: IPaginationOptions;
  }): Promise<News[]> {
    return this.newsRepository.findManyWithPagination({
      categorySlug: query.category,
      tagSlug: query.tag,
      status: authenticated ? query.status : NewsStatusEnum.published,
      search: query.q,
      paginationOptions,
    });
  }

  /**
   * Detalhe por slug. Para o visitante, notícia não publicada simplesmente
   * **não existe** (`404`) — devolver `403` já contaria que existe rascunho com
   * aquele slug.
   */
  async findBySlugOrFail({
    slug,
    authenticated,
  }: {
    slug: News['slug'];
    authenticated: boolean;
  }): Promise<News> {
    const news = await this.newsRepository.findBySlug(slug);

    if (!news || (!authenticated && news.status !== NewsStatusEnum.published)) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          slug: 'newsNotFound',
        },
      });
    }

    // Só acesso a notícia publicada conta: o autor abrindo o próprio rascunho
    // dez vezes no painel não deve inflar a contagem que o portal exibe.
    if (news.status === NewsStatusEnum.published) {
      try {
        await this.newsRepository.incrementViews(news.id);
        news.views += 1;
      } catch (error) {
        // Contador não é motivo para derrubar a leitura da notícia.
        this.logger.error(
          `Falha ao incrementar views da notícia ${news.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return news;
  }

  async findByIdOrFail(id: News['id']): Promise<News> {
    const news = await this.newsRepository.findById(id);

    if (!news) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'newsNotFound',
        },
      });
    }

    return news;
  }

  async update(
    id: News['id'],
    updateNewsDto: UpdateNewsDto,
    requester: Requester,
  ): Promise<News> {
    const news = await this.findByIdOrFail(id);

    this.assertCanManage(news, requester);

    const payload: UpdateNewsData = {};

    if (updateNewsDto.title !== undefined) {
      payload.title = updateNewsDto.title;
    }

    if (updateNewsDto.slug !== undefined && updateNewsDto.slug !== news.slug) {
      payload.slug = await this.assertSlugIsFree(updateNewsDto.slug);
    }

    if (updateNewsDto.summary !== undefined) {
      payload.summary = updateNewsDto.summary;
    }

    if (updateNewsDto.body !== undefined) {
      payload.body = updateNewsDto.body;
    }

    if (updateNewsDto.config !== undefined) {
      payload.config = updateNewsDto.config;
    }

    if (updateNewsDto.cover !== undefined) {
      payload.coverId = await this.resolveCoverId(updateNewsDto.cover);
    }

    if (updateNewsDto.category !== undefined) {
      const category = await this.categoriesService.findByIdOrFail(
        updateNewsDto.category.id,
      );
      payload.categoryId = category.id;
    }

    if (updateNewsDto.tags !== undefined) {
      payload.tagIds = await this.resolveTagIds(updateNewsDto.tags);
    }

    if (updateNewsDto.status !== undefined) {
      payload.status = updateNewsDto.status;

      // Carimba na primeira publicação e nunca reescreve: republicar não deve
      // mudar a data original, e voltar para rascunho **preserva** o carimbo
      // (assim republicar não reescreve nada, e o histórico não se perde).
      if (
        updateNewsDto.status === NewsStatusEnum.published &&
        !news.publishedAt
      ) {
        payload.publishedAt = new Date();
      }
    }

    const updated = await this.newsRepository.update(id, payload);

    if (!updated) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'newsNotFound',
        },
      });
    }

    return updated;
  }

  /**
   * `DELETE` **arquiva** em vez de apagar: o recurso continua existindo (e
   * continua acessível no painel), mas sai das rotas públicas. É o que preserva
   * histórico e não quebra referência de conteúdo já publicado.
   */
  async archive(id: News['id'], requester: Requester): Promise<void> {
    const news = await this.findByIdOrFail(id);

    this.assertCanManage(news, requester);

    if (news.status === NewsStatusEnum.archived) {
      return;
    }

    await this.newsRepository.update(id, { status: NewsStatusEnum.archived });
  }

  /**
   * Editar e excluir é do **autor da notícia ou de um admin** — mesma regra de
   * `PATCH /authors/:id`, por consistência.
   */
  private assertCanManage(news: News, requester: Requester): void {
    const isAdmin = String(requester.role?.id) === String(RoleEnum.admin);
    const isOwner = String(news.author?.userId) === String(requester.id);

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        status: HttpStatus.FORBIDDEN,
        errors: {
          id: 'cannotManageAnotherAuthorNews',
        },
      });
    }
  }

  private async resolveTagIds(
    tags?: { id: string }[] | null,
  ): Promise<string[]> {
    if (!tags?.length) {
      return [];
    }

    const found = await this.tagsService.findByIdsOrFail(
      tags.map((tag) => tag.id),
    );

    return found.map((tag) => tag.id);
  }

  private async resolveCoverId(
    cover?: { id: string } | null,
  ): Promise<string | null> {
    if (!cover?.id) {
      return null;
    }

    const file = await this.filesService.findById(cover.id);

    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          cover: 'imageNotExists',
        },
      });
    }

    return file.id;
  }

  private async assertSlugIsFree(slug: string): Promise<string> {
    if (await this.newsRepository.slugExists(slug)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          slug: 'slugAlreadyExists',
        },
      });
    }

    return slug;
  }

  /** `titulo-da-noticia`, `titulo-da-noticia-2`, ... */
  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title ?? '') || 'noticia';

    let candidate = base;
    let suffix = 1;

    while (await this.newsRepository.slugExists(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }
}
