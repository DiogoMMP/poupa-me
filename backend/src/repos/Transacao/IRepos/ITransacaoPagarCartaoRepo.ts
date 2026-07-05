import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

export default interface ITransacaoPagarCartaoRepo {
    pagarCartao(cartaoCreditoId: string, valorPagamento: number, userId: string, periodo: { inicio: Date; fecho: Date }): Promise<Transacao>;
}

