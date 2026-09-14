import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Settings } from './domain/settings';
import { SettingsService } from './settings.service';

/**
 * Uma rota pública (`GET`, o que o portal lê) e duas de admin (`PATCH` e
 * `POST /reset`).
 *
 * ⚠️ Guards **por método**, nunca na classe (armadilha 4): o decorator de
 * papel na classe fecharia o `GET` para todo visitante, e `RolesGuard` num
 * método sem esse decorator lança `TypeError` (`roles.length` sobre metadata
 * `undefined`).
 *
 * ⚠️ Escrita restrita a admin — diverge de news/banners/categories, que
 * qualquer autenticado administra (`context.md` 4.1.2): parâmetro é global e
 * muda o site para todos os visitantes de uma vez (decisão 3 do plano).
 */
@ApiTags('Settings')
@Controller({
  path: 'settings',
  version: '1',
})
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Público, com `AuthGuard(['jwt','anonymous'])`: token inválido cai no ramo
   * anônimo, não em `401` (mesmo padrão de `news.controller.ts`).
   * `updatedBy` só aparece quando há token — ver `SettingsService.get`.
   */
  @ApiOkResponse({ type: Settings })
  @UseGuards(AuthGuard(['jwt', 'anonymous']))
  @Get()
  @HttpCode(HttpStatus.OK)
  find(@Request() request): Promise<Settings> {
    return this.settingsService.get({
      includeAudit: Boolean(request.user?.id),
    });
  }

  /**
   * Corpo parcial e não tipado de propósito (armadilha 1): um DTO de classe
   * seria filtrado pelo `whitelist: true` global antes de o service ver a
   * chave desconhecida, e o `unknownSetting` nunca aconteceria. A validação
   * é feita por `settings.registry.ts`.
   */
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: Settings })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        MIN_NEWS_FOR_MIDDLE_BANNER: 10,
        BANNER_INTERVAL: 6,
        WHATSAPP_NUMBER: '5562999999999',
      },
    },
  })
  @Patch()
  @HttpCode(HttpStatus.OK)
  update(
    @Body() body: Record<string, unknown>,
    @Request() request,
  ): Promise<Settings> {
    return this.settingsService.update(body, request.user.id);
  }

  /** `@HttpCode(OK)` — o default de `POST` é `201`, e aqui a resposta é o objeto atual, não algo criado. */
  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: Settings })
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  reset(@Request() request): Promise<Settings> {
    return this.settingsService.reset(request.user.id);
  }
}
