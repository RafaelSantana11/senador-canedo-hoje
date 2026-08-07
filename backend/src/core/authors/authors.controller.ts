import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../utils/infinity-pagination';
import { AuthorsService } from './authors.service';
import { Author } from './domain/author';
import { QueryAuthorDto } from './dto/query-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

/**
 * Não existem `POST` nem `DELETE` aqui, de propósito: os dois furariam o 1:1 com
 * `User` (autor sem login / login sem autor). A criação acontece no signup
 * (`POST /api/v1/users`) e a remoção pelo ciclo de vida do usuário
 * (`DELETE /api/v1/users/:id`), que soft-deleta os dois juntos.
 *
 * ⚠️ Sem `@UseGuards` na classe: `GET /authors` e `GET /authors/:slug` são
 * públicos. O guard fica só no `PATCH`.
 */
@ApiTags('Authors')
@Controller({
  path: 'authors',
  version: '1',
})
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @ApiOkResponse({
    type: InfinityPaginationResponse(Author),
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryAuthorDto,
  ): Promise<InfinityPaginationResponseDto<Author>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.authorsService.findManyWithPagination({
        onlyColumnists: query?.columnist,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({
    type: Author,
  })
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
  })
  findBySlug(@Param('slug') slug: string): Promise<Author> {
    return this.authorsService.findBySlugOrFail(slug);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({
    type: Author,
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Author['id'],
    @Body() updateAuthorDto: UpdateAuthorDto,
    @Request() request,
  ): Promise<Author> {
    return this.authorsService.update(id, updateAuthorDto, request.user);
  }
}
