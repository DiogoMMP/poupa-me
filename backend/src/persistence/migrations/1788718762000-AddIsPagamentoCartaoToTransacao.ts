import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the is_pagamento_cartao column to transacao. Needed in production, where
 * synchronize is disabled and this column would otherwise never be created.
 */
export class AddIsPagamentoCartaoToTransacao1788718762000 implements MigrationInterface {
    name = 'AddIsPagamentoCartaoToTransacao1788718762000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "transacao" ADD COLUMN IF NOT EXISTS "is_pagamento_cartao" boolean NOT NULL DEFAULT false'
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "transacao" DROP COLUMN IF EXISTS "is_pagamento_cartao"');
    }
}
