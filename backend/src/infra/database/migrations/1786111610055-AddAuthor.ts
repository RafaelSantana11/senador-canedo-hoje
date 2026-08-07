import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cópia local de `src/utils/slug.ts`, de propósito: uma migration precisa
 * produzir sempre o mesmo resultado, e importar código da aplicação faria o
 * comportamento dela mudar junto com refatorações futuras do util.
 */
const slugify = (value: string): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

export class AddAuthor1786111610055 implements MigrationInterface {
  name = 'AddAuthor1786111610055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "author" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "bio" character varying, "isColumnist" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "user_id" integer NOT NULL, CONSTRAINT "UQ_6ee7ef69a7694fea87382052fed" UNIQUE ("slug"), CONSTRAINT "REL_6138469b55839a7973ba97f9a8" UNIQUE ("user_id"), CONSTRAINT "PK_5a0e79799d372fe56f2f3fa6871" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6ee7ef69a7694fea87382052fe" ON "author" ("slug") `,
    );
    await queryRunner.query(
      `ALTER TABLE "author" ADD CONSTRAINT "FK_6138469b55839a7973ba97f9a8e" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Backfill: todo `User` precisa ter um `Author` 1:1. Bancos que já existem
    // (dev de cada um, ambiente publicado) têm usuários criados antes desta
    // regra, e sem isto ficariam permanentemente inconsistentes — só um banco
    // novo nasceria válido. Usuários soft-deletados ficam de fora.
    const users: { id: number; name: string }[] = await queryRunner.query(
      `SELECT "id", "name" FROM "user" WHERE "deletedAt" IS NULL ORDER BY "id" ASC`,
    );

    const usedSlugs = new Set<string>();

    for (const user of users) {
      const base = slugify(user.name) || 'autor';

      let slug = base;
      let suffix = 1;
      while (usedSlugs.has(slug)) {
        suffix += 1;
        slug = `${base}-${suffix}`;
      }
      usedSlugs.add(slug);

      await queryRunner.query(
        `INSERT INTO "author" ("user_id", "slug", "bio", "isColumnist") VALUES ($1, $2, NULL, false)`,
        [user.id, slug],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "author" DROP CONSTRAINT "FK_6138469b55839a7973ba97f9a8e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ee7ef69a7694fea87382052fe"`,
    );
    await queryRunner.query(`DROP TABLE "author"`);
  }
}
