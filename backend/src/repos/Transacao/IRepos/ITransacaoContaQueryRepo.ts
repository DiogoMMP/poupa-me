import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';
import type { IPagedRows, IPaginationParams } from '../../../dto/shared/IPaginatedDTO.js';

export interface ITransacaoContaQueryFilters {
    userId?: string;
    bancoId?: string;
    contaId?: string;
    categoriaId?: string;
    period?: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano';
}

export default interface ITransacaoContaQueryRepo {
    findAllContaTransactions(filters?: ITransacaoContaQueryFilters): Promise<Transacao[]>;
    findContaTransactionsPage(filters: ITransacaoContaQueryFilters, pagination: IPaginationParams): Promise<IPagedRows<Transacao>>;
    findAllByBanco(bancoId: string, userId?: string): Promise<Transacao[]>;
}
