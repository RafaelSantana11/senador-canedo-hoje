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
  Query,
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
import { FileType } from './domain/file';
import { QueryFileDto } from './dto/query-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FilesService } from './files.service';

/**
 * CRUD do acervo — **driver-agnóstico de propósito**.
 *
 * `src/infra/files/infrastructure/uploader` tem três drivers (`local`, `s3`,
 * `s3-presigned`), mas só o **upload** conversa com o storage e portanto só ele
 * é específico de driver. Listar, detalhar, editar metadado e excluir operam
 * sobre a tabela `file` e são idênticos em qualquer driver — replicá-los nos
 * três controllers seria manter três cópias da mesma regra.
 *
 * ⚠️ Este controller é declarado direto no `FilesModule`, e não no módulo do
 * uploader: `FilesModule` importa **um** módulo de driver conforme o
 * `FILE_DRIVER`, então um controller registrado lá sumiria ao trocar o driver.
 *
 * ⚠️ Conflito de rota resolvido: o driver `local` serve o binário do disco e
 * antes fazia isso em `GET /files/:path`, que colide com o `GET /files/:id`
 * daqui (dois curingas de um segmento — quem registra primeiro captura tudo).
 * A rota do driver passou a ser `GET /files/download/:path`; a do acervo é a
 * canônica. A migration da Parte 5 reescreve os `path` já gravados.
 *
 * Autorização: **qualquer usuário autenticado** do dashboard gerencia o acervo
 * (`context.md` 4.1.2 — só administração de *usuários* é privativa de admin).
 */
@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /** Listagem paginada do acervo, `createdAt DESC`. */
  @ApiOkResponse({ type: InfinityPaginationResponse(FileType) })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryFileDto,
  ): Promise<InfinityPaginationResponseDto<FileType>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 20;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.filesService.findManyWithPagination({
        query,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  /**
   * Detalhe por **id** (uuid). O `ParseUUIDPipe` recusa qualquer outra coisa com
   * `400` — não existe caminho por onde esta rota engolir um nome de arquivo.
   */
  @ApiOkResponse({ type: FileType })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: FileType['id'],
  ): Promise<FileType> {
    return this.filesService.findDetailByIdOrFail(id);
  }

  /** Só `title` e `alt`. Campo derivado no payload → `422 readOnlyField`. */
  @ApiOkResponse({ type: FileType })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  update(
    @Param('id', new ParseUUIDPipe()) id: FileType['id'],
    @Body() updateFileDto: UpdateFileDto,
  ): Promise<FileType> {
    return this.filesService.update(id, updateFileDto);
  }

  /**
   * Exclusão definitiva — registro **e** objeto no storage.
   *
   * Arquivo em uso (capa de notícia, foto de usuário ou item de banner) responde
   * `422 { errors: { id: 'fileInUse' }, usedBy: { news, users, banners } }`.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, format: 'uuid', required: true })
  remove(@Param('id', new ParseUUIDPipe()) id: FileType['id']): Promise<void> {
    return this.filesService.remove(id);
  }
}
