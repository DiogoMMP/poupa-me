import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

export default interface ITransacaoPagarCartaoRepo {
    /**
     * Processes a card payment atomically: updates the card's saldoUtilizado/período, marks pending
     * transactions as Concluído, and creates the payment record, all within a single DB transaction.
     * @param periodoAntigo - The card's period before payment, used to select which transactions to mark.
     * @param novoSaldoUtilizado - The card's saldoUtilizado after this payment is applied.
     * @param novoPeriodo - The card's new period after this payment.
     */
    pagarCartao(
        cartaoCreditoId: string,
        valorPagamento: number,
        userId: string,
        periodoAntigo: { inicio: Date; fecho: Date },
        novoSaldoUtilizado: number,
        novoPeriodo: { inicio: Date; fecho: Date }
    ): Promise<Transacao>;
}

