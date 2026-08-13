import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewsCategoriesTags1786637425783 implements MigrationInterface {
  name = 'AddNewsCategoriesTags1786637425783';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" text, "color" character varying(9), "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_23c05c292c439d77b0de816b50" ON "category" ("name") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cb73208f151aa71cdd78f662d7" ON "category" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."news_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "news" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(300) NOT NULL, "slug" character varying(320) NOT NULL, "summary" text, "body" text NOT NULL, "status" "public"."news_status_enum" NOT NULL DEFAULT 'draft', "publishedAt" TIMESTAMP, "views" integer NOT NULL DEFAULT '0', "config" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "cover_id" uuid, "category_id" uuid NOT NULL, "author_id" uuid NOT NULL, CONSTRAINT "UQ_d09152c44881b7620e12d6df099" UNIQUE ("slug"), CONSTRAINT "PK_39a43dfcb6007180f04aff2357e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d09152c44881b7620e12d6df09" ON "news" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_378f75b661b3564e1543256106" ON "news" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aac53a9364896452e463139e4a" ON "news" ("category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_173d93468ebf142bb3424c2fd6" ON "news" ("author_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" text, "color" character varying(9), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"), CONSTRAINT "UQ_3413aed3ecde54f832c4f44f045" UNIQUE ("slug"), CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON "tag" ("name") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3413aed3ecde54f832c4f44f04" ON "tag" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "news_tags" ("news_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_051c16fcdeb041776091b604bd7" PRIMARY KEY ("news_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_afe9599f04a11fd263c28db556" ON "news_tags" ("news_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e98737624b91ccba0ce3268467" ON "news_tags" ("tag_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "news" ADD CONSTRAINT "FK_09a4dab1c253f124783aade70bf" FOREIGN KEY ("cover_id") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "news" ADD CONSTRAINT "FK_aac53a9364896452e463139e4a0" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "news" ADD CONSTRAINT "FK_173d93468ebf142bb3424c2fd63" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_tags" ADD CONSTRAINT "FK_afe9599f04a11fd263c28db5564" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_tags" ADD CONSTRAINT "FK_e98737624b91ccba0ce32684676" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "news_tags" DROP CONSTRAINT "FK_e98737624b91ccba0ce32684676"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_tags" DROP CONSTRAINT "FK_afe9599f04a11fd263c28db5564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news" DROP CONSTRAINT "FK_173d93468ebf142bb3424c2fd63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news" DROP CONSTRAINT "FK_aac53a9364896452e463139e4a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "news" DROP CONSTRAINT "FK_09a4dab1c253f124783aade70bf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e98737624b91ccba0ce3268467"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_afe9599f04a11fd263c28db556"`,
    );
    await queryRunner.query(`DROP TABLE "news_tags"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3413aed3ecde54f832c4f44f04"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6a9775008add570dc3e5a0bab7"`,
    );
    await queryRunner.query(`DROP TABLE "tag"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_173d93468ebf142bb3424c2fd6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aac53a9364896452e463139e4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_378f75b661b3564e1543256106"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d09152c44881b7620e12d6df09"`,
    );
    await queryRunner.query(`DROP TABLE "news"`);
    await queryRunner.query(`DROP TYPE "public"."news_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb73208f151aa71cdd78f662d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23c05c292c439d77b0de816b50"`,
    );
    await queryRunner.query(`DROP TABLE "category"`);
  }
}
