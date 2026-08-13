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
import { CategoriesService } from './categories.service';
import { Category } from './domain/category';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * `GET /categories` é público (o portal precisa dele para montar o menu) e os
 * três verbos de escrita exigem apenas autenticação — qualquer usuário do
 * dashboard gerencia taxonomia, conforme o modelo de acesso da fase (só
 * administração de *usuários* é privativa de admin).
 *
 * Sem `@UseGuards` na classe de propósito: o guard fica rota a rota.
 */
@ApiTags('Categories')
@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Lista com a contagem de notícias de cada categoria (derivada no servidor).
   *
   * O guard `anonymous` deixa a rota aberta e ainda assim popula
   * `request.user` quando vem token — é o que permite a mesma rota devolver
   * menos para o visitante (só categorias ativas) e tudo para o painel.
   */
  @ApiOkResponse({ type: InfinityPaginationResponse(Category) })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryCategoryDto,
    @Request() request,
  ): Promise<InfinityPaginationResponseDto<Category>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 100) {
      limit = 100;
    }

    return infinityPagination(
      await this.categoriesService.findManyWithPagination({
        authenticated: Boolean(request.user?.id),
        active: query?.active,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiCreatedResponse({ type: Category })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Category })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @Param('id') id: Category['id'],
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Recusa com `422 categoryHasNews` se houver qualquer notícia vinculada
   * (inclusive rascunho e arquivada). Para categoria em uso, o caminho é
   * `PATCH` com `active: false`.
   */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  remove(@Param('id') id: Category['id']): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
