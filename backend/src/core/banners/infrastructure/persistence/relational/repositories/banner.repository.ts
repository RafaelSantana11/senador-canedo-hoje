import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { FileEntity } from '../../../../../../infra/files/infrastructure/persistence/relational/entities/file.entity';
import { NullableType } from '../../../../../../utils/types/nullable.type';
import { BannerPositionEnum } from '../../../../banner-position.enum';
import { Banner } from '../../../../domain/banner';
import { BannerItem } from '../../../../domain/banner-item';
import {
  BannerItemData,
  BannerRepository,
  CreateBannerData,
  FindManyBannersOptions,
  UpdateBannerData,
} from '../../banner.repository';
import { BannerItemEntity } from '../entities/banner-item.entity';
import { BannerEntity } from '../entities/banner.entity';
import { BannerMapper } from '../mappers/banner.mapper';

/** Referência só com id — o TypeORM grava a FK sem precisar da linha inteira. */
const ref = <T>(id: string): T => ({ id }) as T;

@Injectable()
export class BannerRelationalRepository implements BannerRepository {
  constructor(
    @InjectRepository(BannerEntity)
    private readonly bannerRepository: Repository<BannerEntity>,
    @InjectRepository(BannerItemEntity)
    private readonly bannerItemRepository: Repository<BannerItemEntity>,
  ) {}

  async create(data: CreateBannerData): Promise<Banner> {
    const saved = await this.bannerRepository.save(
      this.bannerRepository.create({
        title: data.title,
        advertiser: data.advertiser,
        position: data.position,
        active: data.active,
        items: data.items.map((item) => this.buildItem(item)),
      }),
    );

    // `save` devolve as relações como foram passadas (arquivo só com id).
    // Reler traz o `File` inteiro, que o mapper precisa para serializar a URL.
    const entity = await this.findEntityById(saved.id);

    return BannerMapper.toDomain(entity ?? saved);
  }

  async findManyWithPagination({
    position,
    active,
    paginationOptions,
  }: FindManyBannersOptions): Promise<Banner[]> {
    const query = this.bannerRepository
      .createQueryBuilder('banner')
      // `eager` não vale no QueryBuilder, daí os joins explícitos.
      .leftJoinAndSelect('banner.items', 'item')
      .leftJoinAndSelect('item.file', 'file')
      .orderBy('banner.createdAt', 'DESC')
      .addOrderBy('item.order', 'ASC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    if (position) {
      query.andWhere('banner.position = :position', { position });
    }

    if (active !== undefined) {
      query.andWhere('banner.active = :active', { active });
    }

    const entities = await query.getMany();

    return entities.map((entity) => BannerMapper.toDomain(entity));
  }

  async findById(id: Banner['id']): Promise<NullableType<Banner>> {
    const entity = await this.findEntityById(id);

    return entity ? BannerMapper.toDomain(entity) : null;
  }

  async update(
    id: Banner['id'],
    payload: UpdateBannerData,
  ): Promise<NullableType<Banner>> {
    const entity = await this.findEntityById(id);

    if (!entity) {
      return null;
    }

    if (payload.title !== undefined) entity.title = payload.title;
    if (payload.advertiser !== undefined)
      entity.advertiser = payload.advertiser;
    if (payload.position !== undefined) entity.position = payload.position;
    if (payload.active !== undefined) entity.active = payload.active;

    if (payload.items !== undefined) {
      // Substituição da lista inteira. O `delete` explícito antes do `save` é
      // necessário porque `cascade` insere e atualiza, mas não remove órfão —
      // sem isto, os itens antigos continuariam na tabela e o carrossel
      // duplicaria (e os arquivos antigos seguiriam "em uso").
      await this.bannerItemRepository.delete({ banner: { id } });
      entity.items = payload.items.map((item) => this.buildItem(item));
    }

    await this.bannerRepository.save(entity);

    const updated = await this.findEntityById(id);

    return updated ? BannerMapper.toDomain(updated) : null;
  }

  async remove(id: Banner['id']): Promise<void> {
    // Remoção definitiva (não soft delete): é o que faz os itens caírem por
    // CASCADE e libera os arquivos para exclusão — ver `banner.entity.ts`.
    await this.bannerRepository.delete(id);
  }

  /**
   * Uma query só para todas as posições pedidas: os itens de **todos** os
   * banners ativos daquelas posições, achatados. O agrupamento por posição é
   * feito em memória — são poucas linhas e evita N queries.
   */
  async findActiveItemsByPositions(
    positions: BannerPositionEnum[],
  ): Promise<{ position: BannerPositionEnum; items: BannerItem[] }[]> {
    if (!positions.length) {
      return [];
    }

    const banners = await this.bannerRepository.find({
      where: { position: In(positions), active: true },
      relations: { items: { file: true } },
      order: { createdAt: 'ASC' },
    });

    return positions.map((position) => ({
      position,
      items: banners
        .filter((banner) => banner.position === position)
        .flatMap((banner) => banner.items ?? [])
        // A ordenação é global à posição, não por campanha: o portal vê uma
        // lista só, então dois banners na mesma posição se intercalam por
        // `order`. Ordenar dentro de cada campanha e concatenar daria uma
        // sequência que depende da data de criação da campanha, não do `order`.
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
        .map((item) => BannerMapper.itemToDomain(item)),
    }));
  }

  private buildItem(item: BannerItemData): BannerItemEntity {
    return this.bannerItemRepository.create({
      file: ref<FileEntity>(item.fileId),
      durationMs: item.durationMs,
      linkUrl: item.linkUrl,
      order: item.order,
    });
  }

  private findEntityById(id: Banner['id']): Promise<BannerEntity | null> {
    return this.bannerRepository.findOne({ where: { id } });
  }
}
