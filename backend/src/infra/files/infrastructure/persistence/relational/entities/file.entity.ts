import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  // typeorm decorators here
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AuthorEntity } from '../../../../../../core/authors/infrastructure/persistence/relational/entities/author.entity';

/**
 * ⚠️ **Todas as colunas de metadado são `nullable`** — e isso não é frouxidão
 * de modelagem: quando a Parte 5 chegou já existiam arquivos gravados com
 * `id` + `path` e nada mais. Exigir `NOT NULL` em qualquer uma delas faria a
 * migration falhar em qualquer banco já populado.
 *
 * ⚠️ **Não existe coluna `type`.** `image`/`video`/`document` é derivado do
 * `mimeType` na serialização do domain (`domain/file.ts`).
 */
@Entity({ name: 'file' })
export class FileEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Key do objeto no storage (ou caminho servido pelo driver `local`). A URL
  // pública é montada na serialização — ver `domain/file.ts`.
  @Column()
  path: string;

  @Column({ type: String, length: 260, nullable: true })
  originalName: string | null;

  @Index()
  @Column({ type: String, length: 160, nullable: true })
  mimeType: string | null;

  /**
   * `bigint` porque `int` estoura em 2 GB.
   *
   * O driver do Postgres devolve `bigint` como **string** (não cabe garantido em
   * `number`); o `transformer` converte na leitura para que a propriedade seja
   * numérica em todo o resto do código — o contrato da API é `sizeBytes: 1468006`,
   * não `"1468006"`. Tamanho de arquivo não chega perto de `Number.MAX_SAFE_INTEGER`.
   */
  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  sizeBytes: number | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: String, length: 260, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  alt: string | null;

  /**
   * Quem subiu, para rastreabilidade (`context.md` 4.6). Preenchido do token no
   * upload, nunca aceito no payload.
   *
   * ⚠️ **`eager: false` de propósito.** É o que impede o dado administrativo de
   * vazar: `News.cover` e os itens de banner carregam `FileEntity`, e se esta
   * relação fosse eager o autor do upload apareceria dentro de toda notícia
   * pública. Só as queries do acervo (autenticadas) fazem o join explícito.
   *
   * `onDelete: SET NULL` porque o `Author` é soft-deletado hoje, mas se um dia
   * for apagado de verdade o arquivo não deve ir junto nem travar a remoção.
   */
  @Index()
  @ManyToOne(() => AuthorEntity, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy?: AuthorEntity | null;

  // `NOT NULL DEFAULT now()`: a linha já existente ganha o carimbo do momento
  // da migration. É impreciso para o acervo antigo e é o melhor possível — não
  // há de onde recuperar a data real. Existe porque a listagem ordena por ele.
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
