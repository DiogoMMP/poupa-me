import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoCartaoQueryRepo from './IRepos/ITransacaoCartaoQueryRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../../persistence/entities/TransacaoEntity.js';
import { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Query repository for CartaoCredito-based (Crédito/Reembolso) Transacao reads.
 * Handles all find*Cartao* methods.
 */
@Service()
export default class TransacaoCartaoQueryRepo implements ITransacaoCartaoQueryRepo {
    private repo: Repository<TransacaoEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(TransacaoEntity);
    }

    /**
     * Finds all Crédito and Reembolso transactions for a specific credit card.
     * @param cartaoCreditoId - The domain ID of the CartaoCredito to filter by.
     * @param userId - Optional user ID to scope the search.
     */
    public async findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('t.tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] })
                .andWhere('cc.domain_id = :cartaoCreditoId', { cartaoCreditoId });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            const rows = await qb.orderBy('t.ano', 'DESC').addOrderBy('t.mes', 'DESC').addOrderBy('t.dia', 'DESC').addOrderBy('t.id', 'DESC').getMany();

            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoCartaoQueryRepo.findCartaoTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds ALL Crédito and Reembolso transactions across every credit card belonging to the user.
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findAllCartaoTransactions(userId?: string, bancoId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('t.tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('cc.banco_id = :bancoId', { bancoId });
            const rows = await qb.orderBy('t.ano', 'DESC').addOrderBy('t.mes', 'DESC').addOrderBy('t.dia', 'DESC').addOrderBy('t.id', 'DESC').getMany();

            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoCartaoQueryRepo.findAllCartaoTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by categoria across all credit cards.
     * @param categoriaId - The domain ID of the Categoria to filter by.
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findCartaoTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('c.domain_id = :domainId', { domainId: categoriaId })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('cc.banco_id = :bancoId', { bancoId });
            const rows = await qb.orderBy('t.ano', 'DESC').addOrderBy('t.mes', 'DESC').addOrderBy('t.dia', 'DESC').addOrderBy('t.id', 'DESC').getMany();

            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoCartaoQueryRepo.findCartaoTransactionsByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Crédito and Reembolso transactions by status across all credit cards.
     * @param status - The status value to filter by (e.g., "Concluído", "Pendente").
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findCartaoTransactionsByStatus(status: string, userId?: string, bancoId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('t.status = :status', { status })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('cc.banco_id = :bancoId', { bancoId });
            const rows = await qb.orderBy('t.ano', 'DESC').addOrderBy('t.mes', 'DESC').addOrderBy('t.dia', 'DESC').addOrderBy('t.id', 'DESC').getMany();
            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoCartaoQueryRepo.findCartaoTransactionsByStatus error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by predefined period across all credit cards.
     * @param period - The period to filter by.
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findCartaoTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Transacao[]> {
        try {
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'Este Mês':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'Últimos 3 Meses':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    break;
                case 'Último Ano':
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            const startInt = startDate.getFullYear() * 10000 + (startDate.getMonth() + 1) * 100 + startDate.getDate();
            const endInt = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('(t.ano * 10000 + t.mes * 100 + t.dia) >= :startInt AND (t.ano * 10000 + t.mes * 100 + t.dia) <= :endInt', { startInt, endInt })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('cc.banco_id = :bancoId', { bancoId });
            const rows = await qb.orderBy('t.ano', 'DESC').addOrderBy('t.mes', 'DESC').addOrderBy('t.dia', 'DESC').addOrderBy('t.id', 'DESC').getMany();

            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoCartaoQueryRepo.findCartaoTransactionsByPeriod error: %o', err);
            throw err;
        }
    }
}

