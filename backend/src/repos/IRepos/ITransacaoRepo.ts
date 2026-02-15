import type {Transacao} from "../../domain/Transacao/Entities/Transacao.js";

export default interface ITransacaoRepo {
    save(transacao: Transacao): Promise<Transacao>;
    update(transacao: Transacao): Promise<Transacao>;
    delete(transacaoId: string): Promise<void>;
    findById(transacaoId: string): Promise<Transacao | null>;

    findAll(userId: string): Promise<Transacao[]>;

    // Processes card payment: marks pending Crédito transactions as Concluído, creates a Saída transaction for payment, and updates card period.
    pagarCartao(cartaoCreditoId: string, valorPagamento: number, userId: string, periodo: { inicio: Date; fecho: Date }): Promise<Transacao>;

    // Get all by type (with id filters)
    findContaTransactions(contaId: string, userId?: string): Promise<Transacao[]>;
    findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Transacao[]>;
    findDespesaMensal(contaId: string, userId?: string): Promise<Transacao[]>;

    // Filter by categoria (one per type, with id filters)
    findContaTransactionsByCategoria(contaId: string, categoriaId: string, userId?: string): Promise<Transacao[]>;
    findCartaoTransactionsByCategoria(cartaoCreditoId: string, categoriaId: string, userId?: string): Promise<Transacao[]>;
    findDespesaMensalByCategoria(contaId: string, categoriaId: string, userId?: string): Promise<Transacao[]>;

    // Filter by status (one for cartão, one for despesa mensal, with id filters)
    findCartaoTransactionsByStatus(cartaoCreditoId: string, status: string, userId?: string): Promise<Transacao[]>;
    findDespesaMensalByStatus(contaId: string, status: string, userId?: string): Promise<Transacao[]>;

    // Filter by period (one per type, with id filters)
    findContaTransactionsByPeriod(contaId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Transacao[]>;
    findCartaoTransactionsByPeriod(cartaoCreditoId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Transacao[]>;
    findDespesaMensalByPeriod(contaId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Transacao[]>;
}