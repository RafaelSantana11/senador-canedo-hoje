import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { NewsEntity } from '../../../../../news/infrastructure/persistence/relational/entities/news.entity';

@Entity({ name: 'category' })
export class CategoryEntity extends EntityRelationalHelper {
  // uuid nas entidades novas, coerente com `file` e `author`.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: String, unique: true, length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: String, unique: true, length: 140 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Guardado como texto: é hex de exibição, validado por formato no DTO.
  @Column({ type: String, length: 9, nullable: true })
  color: string | null;

  @Column({ type: Boolean, default: true })
  active: boolean;

  /**
   * Relação inversa declarada só para a contagem de notícias sair numa única
   * query (`loadRelationCountAndMap`) em vez de um `COUNT` por linha. Não é
   * usada para carregar notícias — nunca é eager.
   */
  @OneToMany(() => NewsEntity, (news) => news.category)
  news: NewsEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
