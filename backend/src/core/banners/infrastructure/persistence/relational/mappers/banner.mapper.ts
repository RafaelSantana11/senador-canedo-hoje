import { FileMapper } from 'src/infra/files/infrastructure/persistence/relational/mappers/file.mapper';

import { Banner } from '../../../../domain/banner';
import { BannerItem } from '../../../../domain/banner-item';
import { BannerItemEntity } from '../entities/banner-item.entity';
import { BannerEntity } from '../entities/banner.entity';

/** `order ASC`, com `id` como desempate para a lista não oscilar entre leituras. */
const byOrder = (a: BannerItemEntity, b: BannerItemEntity): number =>
  a.order - b.order || a.id.localeCompare(b.id);

export class BannerMapper {
  static itemToDomain(raw: BannerItemEntity): BannerItem {
    const item = new BannerItem();
    item.id = raw.id;
    item.file = FileMapper.toDomain(raw.file);
    item.durationMs = raw.durationMs;
    item.linkUrl = raw.linkUrl;
    item.order = raw.order;
    return item;
  }

  static toDomain(raw: BannerEntity): Banner {
    const domainEntity = new Banner();
    domainEntity.id = raw.id;
    domainEntity.title = raw.title;
    domainEntity.advertiser = raw.advertiser;
    domainEntity.position = raw.position;
    domainEntity.active = raw.active;
    // Ordenado aqui, e não só na query: a relação vem `eager` em leituras que
    // não passam pelo QueryBuilder, e ali o Postgres não garante ordem alguma.
    domainEntity.items = [...(raw.items ?? [])]
      .sort(byOrder)
      .map((item) => BannerMapper.itemToDomain(item));
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }
}
