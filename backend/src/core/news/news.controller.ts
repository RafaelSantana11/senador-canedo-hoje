import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

/**
 * Duas rotas públicas (`GET` de lista e de detalhe) e três autenticadas.
 *
 * As públicas usam `AuthGuard(['jwt','anonymous'])`: a rota abre sem token, mas
 * quando o token vem, `request.user` é populado — é assim que a **mesma** rota
 * devolve só o publicado para o visitante e o acervo inteiro para o painel.
 * Token inválido cai no ramo anônimo (visão pública), não em `401`.
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
   * Detalhe por slug — **incrementa `views`** quando a notícia está publicada.
   * Ou seja, este `GET` não é idempotente: o cliente que chamar duas vezes
   * (React em modo estrito, por exemplo) conta duas visitas.
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
