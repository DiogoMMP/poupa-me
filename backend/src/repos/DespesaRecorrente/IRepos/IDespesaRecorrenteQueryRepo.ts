import type { DespesaRecorrente } from '../../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';

/**
 * Interface for DespesaRecorrente query repository
 */
export default interface IDespesaRecorrenteQueryRepo {
    findAll(userId: string, bancoId?: string): Promise<DespesaRecorrente[]>;
    findActiveByUserId(userId: string): Promise<DespesaRecorrente[]>;
    findWithValor(userId: string, bancoId: string): Promise<DespesaRecorrente[]>;
    findWithoutValor(userId: string, bancoId: string): Promise<DespesaRecorrente[]>;
    findByTipo(userId: string, tipo: string, bancoId?: string): Promise<DespesaRecorrente[]>;
}
