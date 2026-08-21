import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { FilesService } from 'src/infra/files/files.service';
import { FileType } from 'src/infra/files/domain/file';

import { IPaginationOptions } from '../../utils/types/pagination-options';
import { BANNER_POSITIONS, BannerPositionEnum } from './banner-position.enum';
import { Banner } from './domain/banner';
import { BannerItem } from './domain/banner-item';
import {
  PublicBannerItem,
  PublicBannersResponse,
} from './domain/public-banner';
import { BannerItemDto, CreateBannerDto } from './dto/create-banner.dto';
import { QueryBannerDto } from './dto/query-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import {
  BannerItemData,
  BannerRepository,
} from './infrastructure/persistence/banner.repository';

const DEFAULT_DURATION_MS = 5000;

@Injectable()
export class BannersService {
  constructor(
    private readonly bannerRepository: BannerRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(createBannerDto: CreateBannerDto): Promise<Banner> {
    return this.bannerRepository.create({
      title: createBannerDto.title,
      advertiser: createBannerDto.advertiser ?? null,
      position: createBannerDto.position,
      active: createBannerDto.active ?? true,
      items: await this.resolveItems(createBannerDto.items ?? []),
    });
  }

  findManyWithPagination({
    query,
    paginationOptions,
  }: {
    query: QueryBannerDto;
    paginationOptions: IPaginationOptions;
  }): Promise<Banner[]> {
    return this.bannerRepository.findManyWithPagination({
      position: query.position,
      active: query.active,
      paginationOptions,
    });
  }

  async findByIdOrFail(id: Banner['id']): Promise<Banner> {
    const banner = await this.bannerRepository.findById(id);

    if (!banner) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'bannerNotFound',
        },
      });
    }

    return banner;
  }

  async update(
    id: Banner['id'],
    updateBannerDto: UpdateBannerDto,
  ): Promise<Banner> {
    await this.findByIdOrFail(id);

    const updated = await this.bannerRepository.update(id, {
      title: updateBannerDto.title,
      advertiser: updateBannerDto.advertiser,
      position: updateBannerDto.position,
      active: updateBannerDto.active,
      // `undefined` mantém a lista atual; qualquer array **substitui** a lista
      // inteira (inclusive `[]`, que esvazia o carrossel).
      items:
        updateBannerDto.items === undefined
          ? undefined
          : await this.resolveItems(updateBannerDto.items),
    });

    if (!updated) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: {
          id: 'bannerNotFound',
        },
      });
    }

    return updated;
  }

  /** Apaga a campanha e seus itens; os **arquivos permanecem** no acervo. */
  async remove(id: Banner['id']): Promise<void> {
    await this.findByIdOrFail(id);

    await this.bannerRepository.remove(id);
  }

  /**
   * Entrega pública. Achata: para cada posição, os itens de **todos** os
   * banners ativos, em `order ASC`.
   *
   * ⚠️ O retorno é montado campo a campo a partir de `PublicBannerItem` — não é
   * o domain administrativo com campos removidos. `advertiser`, `active` e o id
   * da campanha não têm por onde escapar porque não são copiados em lugar
   * nenhum deste método.
   */
  async serve(
    positions?: BannerPositionEnum[],
  ): Promise<PublicBannersResponse> {
    const requested = positions?.length ? positions : BANNER_POSITIONS;

    const grouped =
      await this.bannerRepository.findActiveItemsByPositions(requested);

    const response: PublicBannersResponse = {};

    for (const group of grouped) {
      // Posição sem banner ativo entra com lista vazia, nunca ausente e nunca
      // `404`: vitrine vazia não é erro para quem está renderizando a página.
      response[group.position] = group.items.map((item) =>
        this.toPublicItem(item),
      );
    }

    return response;
  }

  private toPublicItem(item: BannerItem): PublicBannerItem {
    const publicItem = new PublicBannerItem();

    // Um `FileType` novo com apenas o que a rota pública pode mostrar. Reusar a
    // instância do acervo traria `originalName`, `mimeType`, `sizeBytes` e
    // qualquer campo que o `File` ganhe no futuro — este recorte é explícito e
    // não muda sozinho. O `path` continua sendo serializado em URL pública pelo
    // `@Transform` do próprio `FileType`.
    const image = new FileType();
    image.id = item.file.id;
    image.path = item.file.path;
    // `mimeType` entra porque `type` é derivado dele na serialização: sem ele o
    // portal receberia `type: null` para uma imagem que é imagem. É descrição
    // do próprio asset público, não dado administrativo.
    image.mimeType = item.file.mimeType ?? null;
    image.alt = item.file.alt ?? null;
    image.width = item.file.width ?? null;
    image.height = item.file.height ?? null;

    publicItem.image = image;
    publicItem.alt = item.file.alt ?? null;
    publicItem.linkUrl = item.linkUrl;
    publicItem.durationMs = item.durationMs;

    return publicItem;
  }

  /**
   * Valida que **todo** arquivo referenciado existe. Ignorar id inexistente
   * criaria campanha com quadro fantasma, que só apareceria como espaço em
   * branco no portal.
   *
   * `order` omitido cai para o índice no array — a ordem em que o painel montou
   * a lista, que é o que o usuário acabou de ver na tela.
   */
  private async resolveItems(
    items: BannerItemDto[],
  ): Promise<BannerItemData[]> {
    if (!items.length) {
      return [];
    }

    const ids = [...new Set(items.map((item) => item.file.id))];
    const found = await this.filesService.findByIds(ids);

    if (found.length !== ids.length) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          items: 'imageNotExists',
        },
      });
    }

    return items.map((item, index) => ({
      fileId: item.file.id,
      durationMs: item.durationMs ?? DEFAULT_DURATION_MS,
      linkUrl: item.linkUrl ?? null,
      order: item.order ?? index,
    }));
  }
}
