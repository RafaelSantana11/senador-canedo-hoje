import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({ name: 'author' })
export class AuthorEntity extends EntityRelationalHelper {
  // uuid nas entidades novas (decisão 5), coerente com a tabela `file`.
  // `user` e `session` continuam SERIAL, por isso `user_id` abaixo é FK integer.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // O @JoinColumn de um @OneToOne gera UNIQUE em user_id — é esse índice, e não
  // uma convenção do código, que torna o 1:1 real no banco.
  // `eager` traz o User (com role/photo, que já são eager nele) em toda leitura
  // de autor: o mapper precisa de `name`/`photo` para achatar na resposta.
  // Não existe relação inversa eager em UserEntity — seria recursão infinita.
  @OneToOne(() => UserEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Index({ unique: true })
  @Column({ type: String, unique: true })
  slug: string;

  @Column({ type: String, nullable: true })
  bio: string | null;

  @Column({ type: Boolean, default: false })
  isColumnist: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete, igual ao User: `Author` será referenciado por `News` e `File`
  // na Parte 4 — apagar de verdade quebraria histórico de conteúdo publicado.
  @DeleteDateColumn()
  deletedAt: Date;
}
