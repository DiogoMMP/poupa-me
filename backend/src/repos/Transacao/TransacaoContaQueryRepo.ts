import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoContaQueryRepo from './IRepos/ITransacaoContaQueryRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../../persistence/entities/TransacaoEntity.js';
import { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Query repository for Conta-based (Entrada/Saída) Transacao reads.
 * Handles all find*Conta* methods and findAllByBanco.
 */
@Service()
export default class TransacaoContaQueryRepo implements ITransacaoContaQueryRepo {
    private repo: Repository<TransacaoEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(TransacaoEntity);
    }

    /**
     * Finds all Entrada and Saída transactions for a specific account.
     * @param contaId - The domain ID of the Conta to filter transactions by.
     * @param userId - Optional user ID to scope the search.
     */
    public async findContaTransactions(contaId: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('t.tipo IN (:...tipos)', { tipos: ['Entrada', 'Saída'] })
                .andWhere('co.domain_id = :contaId', { contaId });
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
            this.logger.error('TransacaoContaQueryRepo.findContaTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds ALL Entrada and Saída transactions across every account belonging to the user.
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findAllContaTransactions(userId?: string, bancoId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .where('t.tipo IN (:...tipos)', { tipos: ['Entrada', 'Saída'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoContaQueryRepo.findAllContaTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds ALL transactions that belong to a specific banco (across contas and cartões).
     * @param bancoId - The domain ID of the Banco to filter transactions by.
     * @param userId - Optional user ID to scope the search.
     */
    public async findAllByBanco(bancoId: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.cartaoCredito', 'cc');

            // bancoId is required for this method: filter by banco across conta or cartao
            qb.where('co.banco_id = :bancoId OR cc.banco_id = :bancoId', { bancoId });

            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });

            const rows = await qb.orderBy('t.ano', 'DESC').addOrderBy('t.mes', 'DESC').addOrderBy('t.dia', 'DESC').addOrderBy('t.id', 'DESC').limit(5).getMany();

            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoContaQueryRepo.findAllByBanco error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Entrada/Saída transactions by categoria across all accounts.
     * @param categoriaId - The domain ID of the Categoria to filter by.
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findContaTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('c.domain_id = :domainId', { domainId: categoriaId })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Entrada', 'Saída'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoContaQueryRepo.findContaTransactionsByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Entrada/Saída transactions by predefined period across all accounts.
     * @param period - The period to filter by.
     * @param userId - Optional user ID to scope the search.
     * @param bancoId - Optional banco database ID to filter by bank.
     */
    public async findContaTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Transacao[]> {
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
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('(t.ano * 10000 + t.mes * 100 + t.dia) >= :startInt AND (t.ano * 10000 + t.mes * 100 + t.dia) <= :endInt', { startInt, endInt })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Entrada', 'Saída'] });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoContaQueryRepo.findContaTransactionsByPeriod error: %o', err);
            throw err;
        }
    }
}

