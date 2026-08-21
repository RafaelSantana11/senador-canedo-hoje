import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Response,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesLocalService } from './files.service';
import { FileResponseDto } from './dto/file-response.dto';
import { UploadMetadataDto } from '../upload-metadata.dto';

/**
 * Só o **upload** e o serviço do binário são específicos deste driver. Listar,
 * detalhar, editar metadado e excluir vivem em `src/infra/files/files.controller.ts`,
 * que é registrado independentemente do `FILE_DRIVER`.
 */
@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesLocalController {
  constructor(private readonly filesService: FilesLocalService) {}

  @ApiCreatedResponse({
    type: FileResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        width: { type: 'integer', example: 1920 },
        height: { type: 'integer', example: 1080 },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: UploadMetadataDto,
    @Request() request,
  ): Promise<FileResponseDto> {
    return this.filesService.create(file, metadata, request.user?.id);
  }

  /**
   * Serve o binário do disco (só existe neste driver).
   *
   * ⚠️ **Ficou sob `/files/download/:path` a partir da Parte 5.** Antes era
   * `/files/:path`, que colidia com o `GET /files/:id` do acervo: os dois são
   * curinga de um segmento só, então quem registrasse primeiro capturava tudo —
   * e qual módulo registra primeiro depende da ordem de import, não de nenhuma
   * decisão explícita. Com o segmento fixo `download` as duas rotas passam a ter
   * formatos diferentes e não se sombreiam em nenhuma ordem.
   */
  @Get('download/:path')
  @ApiExcludeEndpoint()
  download(@Param('path') path, @Response() response) {
    return response.sendFile(path, { root: './files' });
  }
}
