import { Service, Inject } from 'typedi';
import type { DataSource } from 'typeorm';
import type ITransacaoPagarCartaoRepo from './IRepos/ITransacaoPagarCartaoRepo.js';
import { TransacaoEntity } from '../../persistence/entities/TransacaoEntity.js';
import { CartaoCreditoEntity } from '../../persistence/entities/CartaoCreditoEntity.js';
import { CategoriaEntity } from '../../persistence/entities/CategoriaEntity.js';
import type { Transacao } from '../../domain/Transacao/Entities/Transacao.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import { TransacaoIdHelper } from '../../utils/IDGenerator.js';

/**
 * Repository for processing credit card payments.
 * Marks pending Crédito transactions as Concluído and creates a Saída transaction.
 */
@Service()
export default class TransacaoPagarCartaoRepo implements ITransacaoPagarCartaoRepo {
    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Processes card payment atomically: updates the card's saldoUtilizado/período, marks all pending
     * Crédito/Reembolso transactions within the old period as Concluído, and creates the payment
     * record — all inside a single DB transaction, so a failure partway through leaves nothing changed.
     * @param cartaoCreditoId - Domain ID of the CartaoCredito.
     * @param valorPagamento - Payment amount.
     * @param userId - User domain ID for access control.
     * @param periodoAntigo - Period to filter transactions (inicio and fecho dates), before payment.
     * @param novoSaldoUtilizado - The card's saldoUtilizado after this payment is applied.
     * @param novoPeriodo - The card's new period after this payment.
     * @returns The created payment transaction.
     */
    public async pagarCartao(
        cartaoCreditoId: string,
        valorPagamento: number,
        userId: string,
        periodoAntigo: { inicio: Date; fecho: Date },
        novoSaldoUtilizado: number,
        novoPeriodo: { inicio: Date; fecho: Date }
    ): Promise<Transacao> {
        try {
            return await this.dataSource.transaction(async (manager) => {
                // Resolve cartao domain ID to database ID
                const cartaoRepo = manager.getRepository(CartaoCreditoEntity);
                const cartaoRow = await cartaoRepo.findOne({ where: { domainId: cartaoCreditoId } });

                if (!cartaoRow) {
                    this.logger.error('TransacaoPagarCartaoRepo.pagarCartao: cartao not found for id %s', cartaoCreditoId);
                    throw new Error('Cartao not found');
                }

                // 1. Persist the card's new saldoUtilizado and período
                await cartaoRepo.update({ id: cartaoRow.id }, {
                    saldoUtilizado: novoSaldoUtilizado,
                    periodoInicio: novoPeriodo.inicio,
                    periodoFecho: novoPeriodo.fecho
                });

                // 2. Mark all pending Crédito/Reembolso transactions within the old period as Concluído
                const inicioDay = periodoAntigo.inicio.getDate();
                const inicioMonth = periodoAntigo.inicio.getMonth() + 1;
                const inicioYear = periodoAntigo.inicio.getFullYear();

                const fechoDay = periodoAntigo.fecho.getDate();
                const fechoMonth = periodoAntigo.fecho.getMonth() + 1;
                const fechoYear = periodoAntigo.fecho.getFullYear();

                const transacaoRepo = manager.getRepository(TransacaoEntity);
                await transacaoRepo.createQueryBuilder()
                    .update(TransacaoEntity)
                    .set({ status: 'Concluído' })
                    .where('cartao_credito_id = :cartaoId', { cartaoId: cartaoRow.id })
                    .andWhere('user_domain_id = :userId', { userId })
                    .andWhere('status = :status', { status: 'Pendente' })
                    .andWhere('tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] })
                    .andWhere(
                        '(ano * 10000 + mes * 100 + dia) >= :inicioInt AND (ano * 10000 + mes * 100 + dia) <= :fechoInt',
                        {
                            inicioInt: inicioYear * 10000 + inicioMonth * 100 + inicioDay,
                            fechoInt: fechoYear * 10000 + fechoMonth * 100 + fechoDay
                        }
                    )
                    .execute();

                // 3. Create the payment record directly (not via TransacaoRepo.save, so this stays
                // scoped to this transaction's manager without threading it through that shared method)
                const categoriaRepo = manager.getRepository(CategoriaEntity);
                const categoriaRow = await categoriaRepo.createQueryBuilder('cat')
                    .orderBy('cat.id', 'ASC')
                    .limit(1)
                    .getOne();

                if (!categoriaRow) throw new Error('No categoria found for payment');

                const now = new Date();
                const year = now.getFullYear();
                const prefix = TransacaoIdHelper.generatePrefix(year);
                const yearTransactions = await transacaoRepo
                    .createQueryBuilder('t')
                    .select('t.domainId')
                    .where('t.domain_id LIKE :pattern', { pattern: `${prefix}-%` })
                    .orderBy('t.id', 'DESC')
                    .limit(100)
                    .getMany();

                let maxSeq = 0;
                for (const t of yearTransactions) {
                    const seq = TransacaoIdHelper.extractSequence(t.domainId, year);
                    if (seq !== null && seq > maxSeq) maxSeq = seq;
                }
                const domainId = maxSeq === 0 ? TransacaoIdHelper.generateFirst(year) : TransacaoIdHelper.generateNext(maxSeq, year);

                const paymentEntity = transacaoRepo.create({
                    domainId,
                    descricao: `Pagamento ${cartaoRow.nome}`,
                    dia: now.getDate(),
                    mes: now.getMonth() + 1,
                    ano: year,
                    valor: valorPagamento,
                    moeda: cartaoRow.moeda,
                    tipo: 'Crédito',
                    // This record only documents that a payment happened; the actual balance changes (marking
                    // the paid-off transactions as Concluído and reducing saldoUtilizado) already happened
                    // above, directly. It must never be treated as a normal Crédito charge that debits the
                    // payment account.
                    isPagamentoCartao: true,
                    status: 'Concluído',
                    categoria: categoriaRow,
                    categoriaId: categoriaRow.id,
                    cartaoCreditoId: cartaoRow.id,
                    userDomainId: userId
                } as unknown as TransacaoEntity);

                const savedEntity = await transacaoRepo.save(paymentEntity);

                const persisted = await transacaoRepo.findOne({
                    where: { id: savedEntity.id },
                    relations: ['categoria', 'cartaoCredito']
                });
                if (!persisted) throw new Error('Failed to re-fetch saved payment transacao');

                const savedRaw: Record<string, unknown> = {
                    ...(persisted as unknown as Record<string, unknown>),
                    user_domain_id: persisted.userDomainId,
                    categoria: persisted.categoria ?? categoriaRow
                };

                const domain = await TransacaoMap.toDomain(savedRaw);
                if (!domain) throw new Error('Failed to map saved payment transacao to domain');

                return domain;
            });
        } catch (err) {
            this.logger.error('TransacaoPagarCartaoRepo.pagarCartao error: %o', err);
            throw err;
        }
    }
}

