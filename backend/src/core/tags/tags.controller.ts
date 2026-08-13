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
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { QueryTagDto } from './dto/query-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

/**
 * `GET` público; escrita para qualquer usuário autenticado do dashboard.
 *
 * Ao contrário de Categories, tag não tem `active`: não há vitrine pública de
 * tags para esconder nada — a listagem é a mesma para visitante e painel.
 */
@ApiTags('Tags')
@Controller({
  path: 'tags',
  version: '1',
})
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @ApiOkResponse({ type: InfinityPaginationResponse(Tag) })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTagDto,
  ): Promise<InfinityPaginationResponseDto<Tag>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 50;
    if (limit > 100) {
      limit = 100;
    }

    return infinityPagination(
      await this.tagsService.findManyWithPagination({
        search: query?.q,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiCreatedResponse({ type: Tag })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagsService.create(createTagDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Tag })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @Param('id') id: Tag['id'],
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    return this.tagsService.update(id, updateTagDto);
  }

  /** Remove a tag e suas associações; as notícias continuam publicadas. */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  remove(@Param('id') id: Tag['id']): Promise<void> {
    return this.tagsService.remove(id);
  }
}
