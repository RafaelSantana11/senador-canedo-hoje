import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { BannerPositionEnum } from '../../../../banner-position.enum';
import { BannerItemEntity } from './banner-item.entity';

/**
 * Campanha publicitária: um anunciante, uma posição, N arquivos em carrossel.
 *
 * Vários banners podem coexistir na mesma posição (`context.md` 4.7). Quem
 * resolve isso é a entrega pública, que **achata** todos os itens dos banners
 * ativos daquela posição numa lista só — o portal roda um carrossel por posição
 * e não precisa saber que existem campanhas por trás. O agrupamento em `Banner`
 * serve à administração ("campanha do anunciante X tem 3 imagens").
 */
@Entity({ name: 'banner' })
export class BannerEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, length: 200 })
  title: string;

  @Column({ type: String, length: 200, nullable: true })
  advertiser: string | null;

  // Indexado junto com `active`: é exatamente por esses dois que a entrega
  // pública filtra, e ela é a rota de maior volume do módulo.
  @Index()
  @Column({ type: 'enum', enum: BannerPositionEnum })
  position: BannerPositionEnum;

  @Index()
  @Column({ type: Boolean, default: true })
  active: boolean;

  /**
   * `cascade` cobre insert/update dos itens junto do banner: eles são
   * gerenciados **aninhados no payload** da campanha, não por rotas próprias.
   */
  @OneToMany(() => BannerItemEntity, (item) => item.banner, {
    cascade: true,
    eager: true,
  })
  items: BannerItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * ⚠️ Coluna presente (spec da Parte 5, Passo 3), mas **não é o que o `DELETE`
   * da API faz**: `DELETE /banners/:id` apaga de verdade, para que os itens
   * caiam por CASCADE e os arquivos referenciados voltem a ser excluíveis
   * (Passo 4). Soft delete deixaria itens vivos apontando para arquivos, e a
   * regra de exclusão de arquivo passaria a bloquear por campanha invisível.
   * Fica como saída manual, no banco, para remoção que precise ser reversível.
   */
  @DeleteDateColumn()
  deletedAt: Date;
}
