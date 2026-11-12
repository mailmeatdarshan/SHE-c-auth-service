import type { MigrationInterface, QueryRunner } from "typeorm"

export class RenameTables1794472507309 implements MigrationInterface {
    name = "RenameTables1794472507309"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refresh_token" RENAME TO "refreshTokens"`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" RENAME TO "refresh_token"`,
        )
    }
}
