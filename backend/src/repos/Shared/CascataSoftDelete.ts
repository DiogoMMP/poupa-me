import type { EntityManager } from 'typeorm';

/**
 * SQL shared by the Banco and Conta soft-delete cascade (B0016 / issue #89).
 *
 * The 409 counts and the cascade itself use the same sub-queries, so the confirmation shown to the user always
 * matches what the cascade deactivates. Every Conta set is given as a sub-query returning `conta.id` (the integer
 * key the cartão and regra FKs point to).
 */

type Executor = Pick<EntityManager, 'query'>;

/** The active Contas of a Banco ($1 = banco domainId). */
export const CONTAS_ATIVAS_DO_BANCO = 'SELECT id FROM "conta" WHERE banco_id = $1 AND is_active = true';

/** One Conta by domainId ($1 = conta domainId). */
export const CONTA_POR_DOMAIN_ID = 'SELECT id FROM "conta" WHERE domain_id = $1';

/** Active cartões linked to the Banco or paid from one of its active Contas — each counted once. */
const cartoesDoBanco = `"cartao_credito".is_active = true
    AND ("cartao_credito".banco_id = $1 OR "cartao_credito".conta_pagamento_id IN (${CONTAS_ATIVAS_DO_BANCO}))`;

/** Active cartões paid from the given Conta set. */
const cartoesDasContas = (contas: string) => `"cartao_credito".is_active = true
    AND "cartao_credito".conta_pagamento_id IN (${contas})`;

/** Active regras that reference any Conta of the set (origem, destino or poupança) — one row per regra. */
const regrasDasContas = (contas: string) => `"despesa_recorrente".is_active = true
    AND ("despesa_recorrente".conta_origem_id IN (${contas})
      OR "despesa_recorrente".conta_destino_id IN (${contas})
      OR "despesa_recorrente".conta_poupanca_id IN (${contas}))`;

export interface IContagemFilhos {
    contasAtivas: number;
    cartoesAtivos: number;
    regrasAtivas: number;
}

const contar = async (q: Executor, sql: string, param: string): Promise<number> => {
    const rows: Array<{ total: string | number }> = await q.query(sql, [param]);
    return Number(rows[0]?.total ?? 0);
};

/** Counts what a cascade delete of the Banco would deactivate. */
export async function contarFilhosDoBanco(q: Executor, bancoId: string): Promise<IContagemFilhos> {
    return {
        contasAtivas: await contar(q, `SELECT COUNT(*) AS total FROM (${CONTAS_ATIVAS_DO_BANCO}) c`, bancoId),
        cartoesAtivos: await contar(q, `SELECT COUNT(*) AS total FROM "cartao_credito" WHERE ${cartoesDoBanco}`, bancoId),
        regrasAtivas: await contar(q, `SELECT COUNT(*) AS total FROM "despesa_recorrente" WHERE ${regrasDasContas(CONTAS_ATIVAS_DO_BANCO)}`, bancoId)
    };
}

/** Counts what a cascade delete of the Conta would deactivate (contasAtivas is always 0). */
export async function contarFilhosDaConta(q: Executor, contaId: string): Promise<IContagemFilhos> {
    return {
        contasAtivas: 0,
        cartoesAtivos: await contar(q, `SELECT COUNT(*) AS total FROM "cartao_credito" WHERE ${cartoesDasContas(CONTA_POR_DOMAIN_ID)}`, contaId),
        regrasAtivas: await contar(q, `SELECT COUNT(*) AS total FROM "despesa_recorrente" WHERE ${regrasDasContas(CONTA_POR_DOMAIN_ID)}`, contaId)
    };
}

/**
 * Soft-deletes the Banco, its active Contas, the cartões linked to it or paid from those Contas, and the regras that
 * reference those Contas. Must run inside a transaction: children first (their sub-queries still need the Contas
 * active), the Banco last.
 */
export async function apagarBancoComFilhos(m: Executor, bancoId: string): Promise<void> {
    await m.query(`UPDATE "cartao_credito" SET is_active = false, updated_at = now() WHERE ${cartoesDoBanco}`, [bancoId]);
    await m.query(`UPDATE "despesa_recorrente" SET is_active = false, updated_at = now() WHERE ${regrasDasContas(CONTAS_ATIVAS_DO_BANCO)}`, [bancoId]);
    await m.query('UPDATE "conta" SET is_active = false, updated_at = now() WHERE banco_id = $1 AND is_active = true', [bancoId]);
    await m.query('UPDATE "banco" SET is_active = false, updated_at = now() WHERE domain_id = $1', [bancoId]);
}

/**
 * Soft-deletes the Conta, the cartões paid from it and the regras that reference it. Must run inside a transaction.
 */
export async function apagarContaComFilhos(m: Executor, contaId: string): Promise<void> {
    await m.query(`UPDATE "cartao_credito" SET is_active = false, updated_at = now() WHERE ${cartoesDasContas(CONTA_POR_DOMAIN_ID)}`, [contaId]);
    await m.query(`UPDATE "despesa_recorrente" SET is_active = false, updated_at = now() WHERE ${regrasDasContas(CONTA_POR_DOMAIN_ID)}`, [contaId]);
    await m.query('UPDATE "conta" SET is_active = false, updated_at = now() WHERE domain_id = $1', [contaId]);
}
