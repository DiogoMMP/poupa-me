import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

export interface ITransacaoCartaoQueryFilters {
    userId?: string;
    bancoId?: string;
    cartaoCreditoId?: string;
    categoriaId?: string;
    status?: string;
    period?: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano';
}

export default interface ITransacaoCartaoQueryRepo {
    findAllCartaoTransactions(filters?: ITransacaoCartaoQueryFilters): Promise<Transacao[]>;
}
