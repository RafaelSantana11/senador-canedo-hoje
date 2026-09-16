import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../utils/infinity-pagination';
import { News } from './domain/news';
import { NewsViews, NewsViewsResponse } from './domain/news-views';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { QueryNewsViewsDto } from './dto/query-news-views.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

/**
 * Quatro rotas públicas (`GET` de lista, de detalhe e de contagem de views, e o
 * `POST` que registra uma visita) e três autenticadas.
 *
 * Lista e detalhe usam `AuthGuard(['jwt','anonymous'])`: a rota abre sem token,
 * mas quando o token vem, `request.user` é populado — é assim que a **mesma**
 * rota devolve só o publicado para o visitante e o acervo inteiro para o painel.
 * Token inválido cai no ramo anônimo (visão pública), não em `401`. As duas de
 * views não têm guard: são sempre a visão pública.
 *
 * ⚠️ `views` é declarada **antes** de `:slug`: dentro de um controller o Nest
 * casa as rotas na ordem de declaração, e `GET /news/:slug` engoliria
 * `GET /news/views` como se `views` fosse um slug. Por isso `views` também é
 * slug reservado (`NewsService`).
 */
@ApiTags('News')
@Controller({
  path: 'news',
  version: '1',
})
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * Listagem paginada. Sem token, `?status=` é **ignorado** e a resposta traz
   * apenas notícias publicadas.
   *
   * Ordenação: `publishedAt DESC` (rascunho, que não tem data de publicação,
   * vai para o fim e se ordena por `createdAt DESC`). Não existe ordenação por
   * espaço na vitrine no servidor — quem monta a home é o cliente.
   */
  @ApiOkResponse({ type: InfinityPaginationResponse(News) })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryNewsDto,
    @Request() request,
  ): Promise<InfinityPaginationResponseDto<News>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 15;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.newsService.findManyWithPagination({
        query,
        authenticated: Boolean(request.user?.id),
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  /**
   * Contagem **atual** de `views` de várias notícias: `?ids=<uuid>,<uuid>`.
   *
   * O cliente cacheia listagem e detalhe, e o `views` que vem dentro deles fica
   * congelado junto. Esta rota existe para ser consultada a cada refresh — daí
   * o `no-store`, que impede cache intermediário de congelá-la também.
   */
  @ApiOkResponse({ type: NewsViewsResponse })
  @Get('views')
  @Header('Cache-Control', 'no-store')
  @HttpCode(HttpStatus.OK)
  async findViews(
    @Query() query: QueryNewsViewsDto,
  ): Promise<NewsViewsResponse> {
    return { data: await this.newsService.findViews(query.ids) };
  }

  /**
   * Detalhe por slug. Leitura pura e idempotente: **não** incrementa `views`
   * (a visita se registra em `POST /news/:id/views`).
   */
  @ApiOkResponse({ type: News })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'slug', type: String, required: true })
  findBySlug(@Param('slug') slug: string, @Request() request): Promise<News> {
    return this.newsService.findBySlugOrFail({
      slug,
      authenticated: Boolean(request.user?.id),
    });
  }

  /**
   * Registra **uma** leitura e devolve a contagem nova. Não é idempotente: cada
   * chamada conta. Notícia não publicada ou inexistente responde `404`.
   */
  @ApiOkResponse({ type: NewsViews })
  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  registerView(
    @Param('id', new ParseUUIDPipe()) id: News['id'],
  ): Promise<NewsViews> {
    return this.newsService.registerView(id);
  }

  /** Qualquer usuário autenticado escreve; a assinatura é o `Author` dele. */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiCreatedResponse({ type: News })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createNewsDto: CreateNewsDto,
    @Request() request,
  ): Promise<News> {
    return this.newsService.create(createNewsDto, request.user);
  }

  /** Autor da notícia ou admin. Outro usuário recebe `403`. */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: News })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @Param('id') id: News['id'],
    @Body() updateNewsDto: UpdateNewsDto,
    @Request() request,
  ): Promise<News> {
    return this.newsService.update(id, updateNewsDto, request.user);
  }

  /**
   * **Arquiva** (`status: archived`) em vez de apagar: sai das rotas públicas e
   * continua no painel. Autor da notícia ou admin.
   */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  remove(@Param('id') id: News['id'], @Request() request): Promise<void> {
    return this.newsService.archive(id, request.user);
  }
}
