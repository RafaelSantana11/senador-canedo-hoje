import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { BannersService } from './banners.service';
import { Banner } from './domain/banner';
import { PublicBannersResponse } from './domain/public-banner';
import { CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { ServeBannersDto } from './dto/serve-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

/**
 * Uma rota pública (`GET /banners/serve`, a entrega para o portal) e cinco
 * autenticadas (a administração de campanhas).
 *
 * ⚠️ `serve` é declarada **antes** de `:id`: dentro de um controller o Nest casa
 * as rotas na ordem de declaração, e `GET /banners/:id` engoliria
 * `GET /banners/serve` como se `serve` fosse um id. (O `ParseUUIDPipe` do `:id`
 * já daria `400` em vez de `404`, mas depender disso seria depender de ordem —
 * a declaração acima é explícita.)
 *
 * Autorização: qualquer usuário autenticado do dashboard administra banners
 * (`context.md` 4.1.2 — só administração de *usuários* é privativa de admin).
 */
@ApiTags('Banners')
@Controller({
  path: 'banners',
  version: '1',
})
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  /**
   * **Rota pública** consumida pelo portal. Devolve, por posição, a lista
   * ordenada dos itens de todos os banners **ativos** daquela posição.
   *
   * ⚠️ Não devolve `advertiser`, `active`, id de campanha nem `uploadedBy` —
   * ver `domain/public-banner.ts`.
   */
  @ApiOkResponse({ type: PublicBannersResponse })
  @Get('serve')
  @HttpCode(HttpStatus.OK)
  serve(@Query() query: ServeBannersDto): Promise<PublicBannersResponse> {
    return this.bannersService.serve(query.positions);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: InfinityPaginationResponse(Banner) })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryBannerDto,
  ): Promise<InfinityPaginationResponseDto<Banner>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 20;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.bannersService.findManyWithPagination({
        query,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Banner })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  findOne(@Param('id', new ParseUUIDPipe()) id: Banner['id']): Promise<Banner> {
    return this.bannersService.findByIdOrFail(id);
  }

  /** Campanha e itens do carrossel são criados juntos, num payload só. */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiCreatedResponse({ type: Banner })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBannerDto: CreateBannerDto): Promise<Banner> {
    return this.bannersService.create(createBannerDto);
  }

  /** Enviar `items` **substitui a lista inteira**; omitir mantém a atual. */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: Banner })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  update(
    @Param('id', new ParseUUIDPipe()) id: Banner['id'],
    @Body() updateBannerDto: UpdateBannerDto,
  ): Promise<Banner> {
    return this.bannersService.update(id, updateBannerDto);
  }

  /** Apaga campanha e itens. Os **arquivos permanecem** no acervo. */
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  remove(@Param('id', new ParseUUIDPipe()) id: Banner['id']): Promise<void> {
    return this.bannersService.remove(id);
  }
}
