import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';
import type { IPagedRows, IPaginationParams } from '../../../dto/shared/IPaginatedDTO.js';

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
    findCartaoTransactionsPage(filters: ITransacaoCartaoQueryFilters, pagination: IPaginationParams): Promise<IPagedRows<Transacao>>;
}
