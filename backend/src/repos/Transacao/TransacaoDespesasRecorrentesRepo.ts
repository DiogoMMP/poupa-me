import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoDespesasRecorrentesRepo from './IRepos/ITransacaoDespesasRecorrentesRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../../persistence/entities/TransacaoEntity.js';
import type { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

@Service()
export default class TransacaoDespesasRecorrentesRepo implements ITransacaoDespesasRecorrentesRepo {
    private repo: Repository<TransacaoEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(TransacaoEntity);
    }

    /**
     * Finds all recurring expense transactions (Despesa Mensal + Poupança) for a specific bank.
     * @param bancoId - The domain ID of the Banco to filter transactions by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaRecorrente(bancoId: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.contaDestino', 'cd')
                .leftJoinAndSelect('t.contaPoupanca', 'cp')
                .where('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança', 'Despesa Semanal', 'Despesa Anual'] })
                .andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoRepo.findDespesaRecorrente error: %o', err);
            throw err;
        }
    }

    /**
     * Finds recurring expense transactions (Despesa Mensal + Poupança) by category for a specific bank.
     * @param bancoId - The domain ID of the Banco to filter transactions by.
     * @param categoriaId - The domain ID of the Categoria to filter Transacao records by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaRecorrenteByCategoria(bancoId: string, categoriaId: string, userId?: string): Promise<Transacao[]> {
        try {
             const qb = this.repo.createQueryBuilder('t')
                 .leftJoinAndSelect('t.categoria', 'c')
                 .leftJoinAndSelect('t.conta', 'co')
                 .leftJoinAndSelect('t.contaDestino', 'cd')
                 .leftJoinAndSelect('t.contaPoupanca', 'cp')
                 .where('c.domain_id = :domainId', { domainId: categoriaId })
                 .andWhere('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança', 'Despesa Semanal', 'Despesa Anual'] })
                 .andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoRepo.findDespesaRecorrenteByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds recurring expense transactions (Despesa Mensal + Poupança) by status for a specific bank.
     * @param bancoId - The domain ID of the Banco to filter transactions by.
     * @param status - The status value to filter Transacao records by (e.g., "Concluído", "Pendente").
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaRecorrenteByStatus(bancoId: string, status: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.contaDestino', 'cd')
                .leftJoinAndSelect('t.contaPoupanca', 'cp')
                .where('t.status = :status', { status })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança', 'Despesa Semanal', 'Despesa Anual'] })
                .andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoRepo.findDespesaRecorrenteByStatus error: %o', err);
            throw err;
        }
    }

    /**
     * Finds recurring expense transactions (Despesa Mensal + Poupança) by predefined period for a specific bank.
     * @param bancoId - The domain ID of the Banco to filter transactions by.
     * @param period - The period to filter by: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaRecorrenteByPeriod(bancoId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Transacao[]> {
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
                .leftJoinAndSelect('t.contaDestino', 'cd')
                .leftJoinAndSelect('t.contaPoupanca', 'cp')
                .where('(t.ano * 10000 + t.mes * 100 + t.dia) >= :startInt AND (t.ano * 10000 + t.mes * 100 + t.dia) <= :endInt', { startInt, endInt })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança', 'Despesa Semanal', 'Despesa Anual'] })
                .andWhere('co.banco_id = :bancoId', { bancoId });
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
            this.logger.error('TransacaoRepo.findDespesaRecorrenteByPeriod error: %o', err);
            throw err;
        }
    }
}

