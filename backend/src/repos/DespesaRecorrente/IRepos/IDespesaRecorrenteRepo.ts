import type { DespesaRecorrente } from '../../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';

/**
 * Interface for DespesaRecorrente mutation/core repository
 */
export default interface IDespesaRecorrenteRepo {
    save(despesa: DespesaRecorrente): Promise<DespesaRecorrente>;
    update(despesa: DespesaRecorrente): Promise<DespesaRecorrente>;
    delete(despesaId: string): Promise<void>;
    findById(despesaId: string): Promise<DespesaRecorrente | null>;
}
