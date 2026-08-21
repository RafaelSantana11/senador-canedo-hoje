import { NullableType } from '../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../utils/types/pagination-options';
import { BannerPositionEnum } from '../../banner-position.enum';
import { Banner } from '../../domain/banner';
import { BannerItem } from '../../domain/banner-item';

export type BannerItemData = {
  fileId: string;
  durationMs: number;
  linkUrl: string | null;
  order: number;
};

export type CreateBannerData = {
  title: string;
  advertiser: string | null;
  position: BannerPositionEnum;
  active: boolean;
  items: BannerItemData[];
};

/**
 * Só o que foi enviado é tocado. `items: []` esvazia o carrossel; `undefined`
 * mantém a lista atual.
 */
export type UpdateBannerData = {
  title?: string;
  advertiser?: string | null;
  position?: BannerPositionEnum;
  active?: boolean;
  items?: BannerItemData[];
};

export type FindManyBannersOptions = {
  position?: BannerPositionEnum;
  active?: boolean;
  paginationOptions: IPaginationOptions;
};

export abstract class BannerRepository {
  abstract create(data: CreateBannerData): Promise<Banner>;

  abstract findManyWithPagination(
    options: FindManyBannersOptions,
  ): Promise<Banner[]>;

  abstract findById(id: Banner['id']): Promise<NullableType<Banner>>;

  abstract update(
    id: Banner['id'],
    payload: UpdateBannerData,
  ): Promise<NullableType<Banner>>;

  /**
   * Remoção definitiva. Os itens caem por `ON DELETE CASCADE`; os **arquivos
   * permanecem** no acervo (a FK de `banner_item.file_id` não cascateia).
   */
  abstract remove(id: Banner['id']): Promise<void>;

  /**
   * Itens de **todos os banners ativos** das posições pedidas, achatados e já
   * em `order ASC`. É o que a entrega pública consome.
   */
  abstract findActiveItemsByPositions(
    positions: BannerPositionEnum[],
  ): Promise<{ position: BannerPositionEnum; items: BannerItem[] }[]>;
}
