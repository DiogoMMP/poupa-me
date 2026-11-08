import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soft delete (B0016 / issue #89): banco, conta, cartao_credito, categoria, user e despesa_recorrente deixam de
 * ser apagadas fisicamente e passam a ter is_active = false.
 *
 * - despesa_recorrente ganha a coluna is_active (distinta de `ativo`, que é a pausa da regra).
 * - As UNIQUE de conta, cartao_credito, categoria e user passam a índices únicos parciais (WHERE is_active = true),
 *   para que um registo apagado liberte o nome/email. Os nomes dos constraints são gerados pelo TypeORM, por isso
 *   são lidos de pg_constraint em vez de assumidos.
 */
export class SoftDeleteEntidades1791100000000 implements MigrationInterface {
    name = 'SoftDeleteEntidades1791100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "despesa_recorrente" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true'
        );

        await queryRunner.query(`
            DO $$
            DECLARE r record;
            BEGIN
                FOR r IN
                    SELECT conname, conrelid::regclass AS tbl
                    FROM pg_constraint
                    WHERE contype = 'u'
                      AND conrelid IN ('"conta"'::regclass::oid, '"cartao_credito"'::regclass::oid, '"categoria"'::regclass::oid, '"user"'::regclass::oid)
                LOOP
                    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
                END LOOP;
            END $$;
        `);

        await queryRunner.query(
            'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_conta_nome_banco_ativo" ON "conta" ("nome", "banco_id") WHERE "is_active" = true'
        );
        await queryRunner.query(
            'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cartao_nome_banco_ativo" ON "cartao_credito" ("nome", "banco_id") WHERE "is_active" = true'
        );
        await queryRunner.query(
            'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_categoria_nome_ativo" ON "categoria" ("nome") WHERE "is_active" = true'
        );
        await queryRunner.query(
            'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_email_ativo" ON "user" ("email") WHERE "is_active" = true'
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "UQ_user_email_ativo"');
        await queryRunner.query('DROP INDEX IF EXISTS "UQ_categoria_nome_ativo"');
        await queryRunner.query('DROP INDEX IF EXISTS "UQ_cartao_nome_banco_ativo"');
        await queryRunner.query('DROP INDEX IF EXISTS "UQ_conta_nome_banco_ativo"');

        // Com os índices parciais, um registo apagado pode partilhar nome/email com outro (apagado ou ativo). Antes de
        // repor as UNIQUE originais, os apagados em conflito recebem um sufixo com o id da linha. As linhas não são
        // apagadas nem os ids mudam, por isso transações, cartões e regras continuam a apontar para elas. O registo
        // ativo (no máximo um, garantido pelo índice parcial) mantém o nome original.
        // Nomes: conta e categoria têm 50 caracteres, por isso o nome é cortado a 30 antes do sufixo.
        await queryRunner.query(`
            UPDATE "conta" t SET nome = left(t.nome, 30) || ' #apagado-' || t.id
            WHERE t.is_active = false
              AND EXISTS (SELECT 1 FROM "conta" o WHERE o.id <> t.id AND o.nome = t.nome AND o.banco_id = t.banco_id)
        `);
        await queryRunner.query(`
            UPDATE "cartao_credito" t SET nome = left(t.nome, 30) || ' #apagado-' || t.id
            WHERE t.is_active = false
              AND EXISTS (SELECT 1 FROM "cartao_credito" o WHERE o.id <> t.id AND o.nome = t.nome AND o.banco_id = t.banco_id)
        `);
        await queryRunner.query(`
            UPDATE "categoria" t SET nome = left(t.nome, 30) || ' #apagado-' || t.id
            WHERE t.is_active = false
              AND EXISTS (SELECT 1 FROM "categoria" o WHERE o.id <> t.id AND o.nome = t.nome)
        `);
        await queryRunner.query(`
            UPDATE "user" t SET email = 'apagado-' || t.id || '-' || left(t.email, 290)
            WHERE t.is_active = false
              AND EXISTS (SELECT 1 FROM "user" o WHERE o.id <> t.id AND o.email = t.email)
        `);

        // Repõe as UNIQUE originais.
        await queryRunner.query('ALTER TABLE "user" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")');
        await queryRunner.query('ALTER TABLE "categoria" ADD CONSTRAINT "UQ_categoria_nome" UNIQUE ("nome")');
        await queryRunner.query('ALTER TABLE "cartao_credito" ADD CONSTRAINT "UQ_cartao_nome_banco" UNIQUE ("nome", "banco_id")');
        await queryRunner.query('ALTER TABLE "conta" ADD CONSTRAINT "UQ_conta_nome_banco" UNIQUE ("nome", "banco_id")');

        await queryRunner.query('ALTER TABLE "despesa_recorrente" DROP COLUMN IF EXISTS "is_active"');
    }
}
