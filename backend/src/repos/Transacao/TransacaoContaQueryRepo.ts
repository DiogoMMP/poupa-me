import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoContaQueryRepo from './IRepos/ITransacaoContaQueryRepo.js';
import type { ITransacaoContaQueryFilters } from './IRepos/ITransacaoContaQueryRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../../persistence/entities/TransacaoEntity.js';
import { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Query repository for Conta-based (Entrada/Saída) Transacao reads.
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
     * Finds Entrada/Saída transactions with optional filters.
     * All filters are optional and can be combined freely.
     */
    public async findAllContaTransactions(filters: ITransacaoContaQueryFilters = {}): Promise<Transacao[]> {
        try {
            const { userId, bancoId, contaId, categoriaId, period } = filters;

            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('t.tipo IN (:...tipos)', { tipos: ['Entrada', 'Saída'] });

            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (bancoId) qb.andWhere('co.banco_id = :bancoId', { bancoId });
            if (contaId) qb.andWhere('co.domain_id = :contaId', { contaId });
            if (categoriaId) qb.andWhere('c.domain_id = :categoriaId', { categoriaId });

            if (period) {
                const now = new Date();
                let startDate: Date;
                switch (period) {
                    case 'Este Mês':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        break;
                    case 'Últimos 3 Meses':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 4, now.getDate());
                        break;
                    case 'Último Ano':
                        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                        break;
                }
                const startInt = startDate.getFullYear() * 10000 + (startDate.getMonth() + 1) * 100 + startDate.getDate();
                const endInt = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
                qb.andWhere('(t.ano * 10000 + t.mes * 100 + t.dia) >= :startInt AND (t.ano * 10000 + t.mes * 100 + t.dia) <= :endInt', { startInt, endInt });
            }

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
     * Returns the 5 most recent.
     */
    public async findAllByBanco(bancoId: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.cartaoCredito', 'cc');

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
}
