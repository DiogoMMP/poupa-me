import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

export default interface ITransacaoCartaoQueryRepo {
    findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Transacao[]>;
    findAllCartaoTransactions(userId?: string, bancoId?: string): Promise<Transacao[]>;
    findCartaoTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Transacao[]>;
    findCartaoTransactionsByStatus(status: string, userId?: string, bancoId?: string): Promise<Transacao[]>;
    findCartaoTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Transacao[]>;
}

