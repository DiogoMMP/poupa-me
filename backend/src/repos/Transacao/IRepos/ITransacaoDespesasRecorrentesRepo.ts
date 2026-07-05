import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

export interface ITransacaoDespesasRecorrentesFilters {
    userId?: string;
    bancoId?: string;
    categoriaId?: string;
    status?: string;
    period?: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano';
}

export default interface ITransacaoDespesasRecorrentesRepo {
    findDespesaRecorrente(filters?: ITransacaoDespesasRecorrentesFilters): Promise<Transacao[]>;
}
