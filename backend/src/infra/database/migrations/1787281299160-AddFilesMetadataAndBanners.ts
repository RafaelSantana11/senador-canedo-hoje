import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Parte 5 — metadados do acervo de arquivos + campanhas de banner.
 *
 * ⚠️ **Roda em banco já populado.** Toda coluna nova de `file` é `nullable`:
 * os arquivos que já existem foram gravados só com `id` e `path`, e não há de
 * onde recuperar mimetype, tamanho ou dimensão. Eles continuam funcionando,
 * apenas aparecem no acervo com metadado vazio (e `type: null`).
 *
 * As duas exceções são `createdAt`/`updatedAt`, `NOT NULL DEFAULT now()`: a
 * listagem ordena por `createdAt`, então a coluna precisa de valor. O acervo
 * antigo herda o instante da migration — impreciso, e o melhor possível.
 *
 * Inclui ainda uma **reescrita de dados** dos `path` gravados pelo driver
 * `local` (ver o bloco comentado abaixo).
 */
export class AddFilesMetadataAndBanners1787281299160 implements MigrationInterface {
  name = 'AddFilesMetadataAndBanners1787281299160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "banner_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "durationMs" integer NOT NULL DEFAULT '5000', "linkUrl" character varying(2048), "order" integer NOT NULL DEFAULT '0', "banner_id" uuid NOT NULL, "file_id" uuid NOT NULL, CONSTRAINT "PK_96a0db9109aa0f7a7d563138857" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a9c139afd85802997b504b18a" ON "banner_item" ("banner_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aba0ac0419eaf29a25a41bcb9c" ON "banner_item" ("file_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."banner_position_enum" AS ENUM('top', 'middle', 'aside', 'bottom')`,
    );
    await queryRunner.query(
      `CREATE TABLE "banner" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "advertiser" character varying(200), "position" "public"."banner_position_enum" NOT NULL, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_6d9e2570b3d85ba37b681cd4256" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7dbb63a47a24092469798cd6ae" ON "banner" ("position") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11005227f843d4a7e72ce604fe" ON "banner" ("active") `,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "originalName" character varying(260)`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "mimeType" character varying(160)`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "sizeBytes" bigint`);
    await queryRunner.query(`ALTER TABLE "file" ADD "width" integer`);
    await queryRunner.query(`ALTER TABLE "file" ADD "height" integer`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD "title" character varying(260)`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "alt" text`);
    await queryRunner.query(
      `ALTER TABLE "file" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "file" ADD "uploaded_by_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_4d0b8daedc681efbfc97fcb835" ON "file" ("mimeType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97ed6811c490e3d9b5afe2adb1" ON "file" ("uploaded_by_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_97ed6811c490e3d9b5afe2adb1e" FOREIGN KEY ("uploaded_by_id") REFERENCES "author"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banner_item" ADD CONSTRAINT "FK_1a9c139afd85802997b504b18a1" FOREIGN KEY ("banner_id") REFERENCES "banner"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "banner_item" ADD CONSTRAINT "FK_aba0ac0419eaf29a25a41bcb9c7" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // ── Reescrita de dados: rota do driver `local` ────────────────────────────
    // O acervo ganhou `GET /files/:id`, que colidia com o `GET /files/:path` do
    // driver `local` (dois curingas de um segmento — quem registrasse primeiro
    // capturava tudo). O serving do binário passou para `/files/download/:path`,
    // então os `path` já gravados precisam do segmento novo, senão as imagens
    // enviadas antes da Parte 5 respondem 404 em ambiente com FILE_DRIVER=local.
    //
    // O predicado é restritivo de propósito: só casa `/<prefixo>/v1/files/<nome>`
    // com exatamente um segmento depois de `files`. Key de bucket (`abc123.png`,
    // sem barra inicial) e path já migrado (`.../files/download/abc.png`) não
    // casam, então rodar de novo não faz nada.
    await queryRunner.query(
      `UPDATE "file" SET "path" = regexp_replace("path", '^(/[^/]+/v1/files)/([^/]+)$', '\\1/download/\\2') WHERE "path" ~ '^/[^/]+/v1/files/[^/]+$'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Desfaz a reescrita de rota do driver `local` antes de mexer no schema.
    await queryRunner.query(
      `UPDATE "file" SET "path" = regexp_replace("path", '^(/[^/]+/v1/files)/download/([^/]+)$', '\\1/\\2') WHERE "path" ~ '^/[^/]+/v1/files/download/[^/]+$'`,
    );
    await queryRunner.query(
      `ALTER TABLE "banner_item" DROP CONSTRAINT "FK_aba0ac0419eaf29a25a41bcb9c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banner_item" DROP CONSTRAINT "FK_1a9c139afd85802997b504b18a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_97ed6811c490e3d9b5afe2adb1e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97ed6811c490e3d9b5afe2adb1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d0b8daedc681efbfc97fcb835"`,
    );
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "uploaded_by_id"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "alt"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "height"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "width"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "sizeBytes"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "mimeType"`);
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "originalName"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11005227f843d4a7e72ce604fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7dbb63a47a24092469798cd6ae"`,
    );
    await queryRunner.query(`DROP TABLE "banner"`);
    await queryRunner.query(`DROP TYPE "public"."banner_position_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aba0ac0419eaf29a25a41bcb9c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a9c139afd85802997b504b18a"`,
    );
    await queryRunner.query(`DROP TABLE "banner_item"`);
  }
}
