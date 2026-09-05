import { Service, Inject } from 'typedi';
import type { DataSource } from 'typeorm';
import type ITransacaoPagarCartaoRepo from './IRepos/ITransacaoPagarCartaoRepo.js';
import type ITransacaoRepo from './IRepos/ITransacaoRepo.js';
import { TransacaoEntity } from '../../persistence/entities/TransacaoEntity.js';
import { CartaoCreditoEntity } from '../../persistence/entities/CartaoCreditoEntity.js';
import { CategoriaEntity } from '../../persistence/entities/CategoriaEntity.js';
import { Transacao } from '../../domain/Transacao/Entities/Transacao.js';
import { CategoriaMap } from '../../mappers/CategoriaMap.js';
import { CartaoCreditoMap } from '../../mappers/CartaoCreditoMap.js';

/**
 * Repository for processing credit card payments.
 * Marks pending Crédito transactions as Concluído and creates a Saída transaction.
 */
@Service()
export default class TransacaoPagarCartaoRepo implements ITransacaoPagarCartaoRepo {
    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Processes card payment: marks all pending Crédito transactions within the period as Concluído
     * and creates a Saída transaction.
     * @param cartaoCreditoId - Domain ID of the CartaoCredito.
     * @param valorPagamento - Payment amount.
     * @param userId - User domain ID for access control.
     * @param periodo - Period to filter transactions (inicio and fecho dates).
     * @returns The created payment transaction (Saída).
     */
    public async pagarCartao(cartaoCreditoId: string, valorPagamento: number, userId: string, periodo: { inicio: Date; fecho: Date }): Promise<Transacao> {
        try {
            // Resolve cartao domain ID to database ID
            const cartaoRepo = this.dataSource.getRepository(CartaoCreditoEntity);
            const cartaoRow = await cartaoRepo.findOne({ where: { domainId: cartaoCreditoId } });

            if (!cartaoRow) {
                this.logger.error('TransacaoPagarCartaoRepo.pagarCartao: cartao not found for id %s', cartaoCreditoId);
                throw new Error('Cartao not found');
            }

            // 1. Mark all pending Crédito transactions within the period as Concluído
            const inicioDay = periodo.inicio.getDate();
            const inicioMonth = periodo.inicio.getMonth() + 1;
            const inicioYear = periodo.inicio.getFullYear();

            const fechoDay = periodo.fecho.getDate();
            const fechoMonth = periodo.fecho.getMonth() + 1;
            const fechoYear = periodo.fecho.getFullYear();

            const transacaoRepo = this.dataSource.getRepository(TransacaoEntity);
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

            // 2. Create Saída transaction using save() - this will trigger saldoUtilizado update
            const categoriaRepo = this.dataSource.getRepository(CategoriaEntity);
            const categoriaRow = await categoriaRepo.createQueryBuilder('cat')
                .orderBy('cat.id', 'ASC')
                .limit(1)
                .getOne();

            if (!categoriaRow) throw new Error('No categoria found for payment');

            const categoriaDomain = await CategoriaMap.toDomain(categoriaRow as unknown as Record<string, unknown>);
            if (!categoriaDomain) throw new Error('Failed to map categoria to domain');

            const cartaoDomain = await CartaoCreditoMap.toDomain({
                ...cartaoRow,
                user_domain_id: cartaoRow.userDomainId
            } as unknown as Record<string, unknown>);
            if (!cartaoDomain) throw new Error('Failed to map cartao to domain');

            // Create domain objects for the payment transaction
            const now = new Date();
            const Data = (await import('../../domain/Shared/ValueObjects/Data.js')).Data;
            const Descricao = (await import('../../domain/Transacao/ValueObjects/Descricao.js')).Descricao;
            const Tipo = (await import('../../domain/Shared/ValueObjects/Tipo.js')).Tipo;
            const Status = (await import('../../domain/Transacao/ValueObjects/Status.js')).Status;
            const Dinheiro = (await import('../../domain/Shared/ValueObjects/Dinheiro.js')).Dinheiro;

            const dataOrError = Data.createFromParts(now.getDate(), now.getMonth() + 1, now.getFullYear());
            const descricaoOrError = Descricao.create(`Pagamento ${cartaoRow.nome}`);
            const tipoOrError = Tipo.create('Crédito');
            const statusOrError = Status.create('Concluído');
            const valorOrError = Dinheiro.create(valorPagamento, cartaoRow.moeda);

            if (dataOrError.isFailure || descricaoOrError.isFailure || tipoOrError.isFailure ||
                statusOrError.isFailure || valorOrError.isFailure) {
                throw new Error('Failed to create payment transaction value objects');
            }

            const paymentProps = {
                data: dataOrError.getValue(),
                descricao: descricaoOrError.getValue(),
                valor: valorOrError.getValue(),
                tipo: tipoOrError.getValue(),
                categoria: categoriaDomain,
                status: statusOrError.getValue(),
                cartaoCredito: cartaoDomain,
                // This record only documents that a payment happened; the actual balance changes (marking the
                // paid-off transactions as Concluído and reducing saldoUtilizado) already happened above, directly.
                // It must never be treated as a normal Crédito charge that debits the payment account.
                isPagamentoCartao: true
            };

            const paymentOrError = Transacao.create(paymentProps);
            if (paymentOrError.isFailure) throw new Error('Failed to create payment transaction');

            const paymentDomain = paymentOrError.getValue();
            (paymentDomain as unknown as { userDomainId?: string }).userDomainId = userId;

            // Use save() to create the transaction - this will update saldoUtilizado automatically
            return await this.transacaoRepo.save(paymentDomain);
        } catch (err) {
            this.logger.error('TransacaoPagarCartaoRepo.pagarCartao error: %o', err);
            throw err;
        }
    }
}

