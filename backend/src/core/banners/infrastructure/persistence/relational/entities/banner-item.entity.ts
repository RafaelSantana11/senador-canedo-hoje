import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FileEntity } from '../../../../../../infra/files/infrastructure/persistence/relational/entities/file.entity';
import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { BannerEntity } from './banner.entity';

/** Um quadro do carrossel: o arquivo, quanto tempo fica em tela e para onde leva. */
@Entity({ name: 'banner_item' })
export class BannerItemEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // `CASCADE`: item não existe sem campanha.
  @Index()
  @ManyToOne(() => BannerEntity, (banner) => banner.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'banner_id' })
  banner: BannerEntity;

  /**
   * ⚠️ **Sem cascata de propósito.** Apagar um arquivo em uso é bloqueado antes,
   * na regra de negócio (`DELETE /files/:id` → `422 fileInUse`); cascatear aqui
   * apagaria silenciosamente o quadro de uma campanha no ar. `eager` porque
   * nenhum consumo de item faz sentido sem o arquivo.
   */
  @Index()
  @ManyToOne(() => FileEntity, { nullable: false, eager: true })
  @JoinColumn({ name: 'file_id' })
  file: FileEntity;

  // Milissegundos — é a unidade de `setInterval` e das libs de slider do front,
  // então não sobra conversão para o consumidor.
  @Column({ type: 'int', default: 5000 })
  durationMs: number;

  @Column({ type: String, length: 2048, nullable: true })
  linkUrl: string | null;

  /**
   * Ordem explícita no carrossel. Diverge conscientemente do `context.md`, que
   * previa ordem de criação: reordenar exigiria recriar os itens.
   * `order` é palavra reservada em SQL — o TypeORM cita o identificador, então
   * a coluna sai como `"order"` e funciona; não renomeie sem migration.
   */
  @Column({ type: 'int', default: 0 })
  order: number;
}
