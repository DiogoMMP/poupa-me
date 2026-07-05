import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

export default interface ITransacaoContaQueryRepo {
    findContaTransactions(contaId: string, userId?: string): Promise<Transacao[]>;
    findAllContaTransactions(userId?: string, bancoId?: string): Promise<Transacao[]>;
    findAllByBanco(bancoId: string, userId?: string): Promise<Transacao[]>;
    findContaTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Transacao[]>;
    findContaTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Transacao[]>;
}

