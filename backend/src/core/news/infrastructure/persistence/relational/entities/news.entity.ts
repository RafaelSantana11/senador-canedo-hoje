import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { AuthorEntity } from '../../../../../authors/infrastructure/persistence/relational/entities/author.entity';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { TagEntity } from '../../../../../tags/infrastructure/persistence/relational/entities/tag.entity';
import { FileEntity } from '../../../../../../infra/files/infrastructure/persistence/relational/entities/file.entity';
import { NewsStatusEnum } from '../../../../news-status.enum';

/**
 * ⚠️ A lista de colunas abaixo é COMPLETA e deliberada. Regras de layout da home
 * (qual matéria ocupa qual espaço, em que ordem, e a marcação de última hora)
 * **não são colunas** — trafegam dentro de `config`, que o backend guarda e
 * devolve sem interpretar.
 *
 * Motivo: o front cria e muda regras de vitrine sem exigir migration nem
 * mudança de contrato a cada ideia nova. Preço aceito conscientemente: o
 * backend não garante que só uma matéria ocupe cada espaço — isso passa a ser
 * responsabilidade de quem monta a página.
 *
 * Consequência prática para quem mexer aqui depois: nenhuma query deste módulo
 * lê, filtra ou ordena por chave de dentro do `config`. Se aparecer a
 * necessidade, ela é uma decisão de produto a rediscutir, não um `andWhere` a
 * acrescentar.
 */
@Entity({ name: 'news' })
export class NewsEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, length: 300 })
  title: string;

  @Index({ unique: true })
  @Column({ type: String, length: 320, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  // Markdown. O backend armazena texto e não renderiza nada — renderizar HTML
  // no servidor abriria XSS sem necessidade.
  @Column({ type: 'text' })
  body: string;

  /**
   * `ManyToOne` (e não `OneToOne`, como `User.photo`) de propósito: duas
   * notícias podem legitimamente reaproveitar a mesma imagem do acervo, e
   * `OneToOne` criaria UNIQUE em `cover_id` — a segunda notícia falharia com
   * violação de constraint.
   */
  @ManyToOne(() => FileEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'cover_id' })
  cover?: FileEntity | null;

  @Index()
  @Column({
    type: 'enum',
    enum: NewsStatusEnum,
    default: NewsStatusEnum.draft,
  })
  status: NewsStatusEnum;

  // Carimbado na transição para `published` e nunca reescrito depois.
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  // `@Index` explícito nas duas FKs: o TypeORM não indexa coluna de FK sozinho,
  // e são justamente as colunas por onde a listagem filtra.
  @Index()
  @ManyToOne(() => CategoryEntity, (category) => category.news, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  // Derivado do usuário logado na criação, nunca aceito no payload.
  @Index()
  @ManyToOne(() => AuthorEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: AuthorEntity;

  // Lado dono da N:N: é aqui que a tabela de junção é declarada.
  @ManyToMany(() => TagEntity, (tag) => tag.news, { eager: true })
  @JoinTable({
    name: 'news_tags',
    joinColumn: { name: 'news_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: TagEntity[];

  @Column({ type: 'int', default: 0 })
  views: number;

  /**
   * Campo de configuração livre por notícia (jsonb, sem schema). O backend
   * **não valida a forma** e **não impõe invariante nenhum** — valida apenas o
   * tamanho (16 KB, no DTO).
   */
  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft delete existe na tabela, mas **não é o que o `DELETE` da API faz**: a
   * exclusão pelo painel arquiva (`status: archived`), conforme o módulo. Esta
   * coluna fica como saída de exceção (remoção de conteúdo indevido) sem perder
   * a linha e sem quebrar FK de histórico.
   */
  @DeleteDateColumn()
  deletedAt: Date;
}
