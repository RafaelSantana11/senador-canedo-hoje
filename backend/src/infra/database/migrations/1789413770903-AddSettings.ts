import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettings1789413770903 implements MigrationInterface {
  name = 'AddSettings1789413770903';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "setting" ("key" character varying(64) NOT NULL, "value" jsonb, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" integer, CONSTRAINT "PK_1c4c95d773004250c157a744d6e" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "setting" ADD CONSTRAINT "FK_5cbfb5a914afa8ed71d1e5c9b32" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "setting" DROP CONSTRAINT "FK_5cbfb5a914afa8ed71d1e5c9b32"`,
    );
    await queryRunner.query(`DROP TABLE "setting"`);
  }
}
