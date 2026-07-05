import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoDespesasRecorrentesRepo from './IRepos/ITransacaoDespesasRecorrentesRepo.js';
import type { ITransacaoDespesasRecorrentesFilters } from './IRepos/ITransacaoDespesasRecorrentesRepo.js';
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
     * Finds recurring expense transactions with optional filters.
     * All filters are optional and can be combined freely.
     */
    public async findDespesaRecorrente(filters: ITransacaoDespesasRecorrentesFilters = {}): Promise<Transacao[]> {
        try {
            const { userId, bancoId, categoriaId, status, period } = filters;

            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.contaDestino', 'cd')
                .leftJoinAndSelect('t.contaPoupanca', 'cp')
                .where('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança', 'Despesa Semanal', 'Despesa Anual'] });

            if (bancoId) qb.andWhere('co.banco_id = :bancoId', { bancoId });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            if (categoriaId) qb.andWhere('c.domain_id = :categoriaId', { categoriaId });
            if (status) qb.andWhere('t.status = :status', { status });

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
            this.logger.error('TransacaoDespesasRecorrentesRepo.findDespesaRecorrente error: %o', err);
            throw err;
        }
    }
}
