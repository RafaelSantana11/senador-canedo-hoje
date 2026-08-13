import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { NewsEntity } from '../../../../../news/infrastructure/persistence/relational/entities/news.entity';

@Entity({ name: 'tag' })
export class TagEntity extends EntityRelationalHelper {
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

  @Column({ type: String, length: 9, nullable: true })
  color: string | null;

  /**
   * Lado inverso da N:N — a tabela de junção (`news_tags`) é declarada em
   * `NewsEntity`, que é o lado dono. Aqui a relação existe para o `usageCount`
   * sair numa query só.
   */
  @ManyToMany(() => NewsEntity, (news) => news.tags)
  news: NewsEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
