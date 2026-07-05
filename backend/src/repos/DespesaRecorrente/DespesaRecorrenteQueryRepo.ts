import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type IDespesaRecorrenteQueryRepo from './IRepos/IDespesaRecorrenteQueryRepo.js';
import { DespesaRecorrenteMap } from '../../mappers/DespesaRecorrenteMap.js';
import { DespesaRecorrenteEntity } from '../../persistence/entities/DespesaRecorrenteEntity.js';
import { DespesaRecorrente } from '../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';

/**
 * Query repository implementation for Recurring Expenses using TypeORM
 */
@Service()
export default class DespesaRecorrenteQueryRepo implements IDespesaRecorrenteQueryRepo {
    private repo: Repository<DespesaRecorrenteEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(DespesaRecorrenteEntity);
    }

    /**
     * Find all recurring expenses for a user, optionally filtered by bank (via origin account)
     */
    public async findAll(userId: string, bancoId?: string): Promise<DespesaRecorrente[]> {
        try {
            const qb = this.repo.createQueryBuilder('d')
                .leftJoinAndSelect('d.categoria', 'categoria')
                .leftJoinAndSelect('d.contaOrigem', 'contaOrigem')
                .leftJoinAndSelect('d.contaDestino', 'contaDestino')
                .leftJoinAndSelect('d.contaPoupanca', 'contaPoupanca')
                .where('d.user_domain_id = :userId', { userId })
                .orderBy('d.id', 'ASC');

            if (bancoId) {
                qb.andWhere('contaOrigem.banco_id = :bancoId', { bancoId });
            }

            const rows = await qb.getMany();

            const res: DespesaRecorrente[] = [];
            for (const r of rows) {
                const rowEntityLoop = r as DespesaRecorrenteEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntityLoop.userDomainId };
                const d = await DespesaRecorrenteMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.findAll error: %o', err);
            throw err;
        }
    }

    /**
     * Find all active recurring expenses for a user
     */
    public async findActiveByUserId(userId: string): Promise<DespesaRecorrente[]> {
        try {
            const rows = await this.repo.createQueryBuilder('d')
                .leftJoinAndSelect('d.categoria', 'categoria')
                .leftJoinAndSelect('d.contaOrigem', 'contaOrigem')
                .leftJoinAndSelect('d.contaDestino', 'contaDestino')
                .leftJoinAndSelect('d.contaPoupanca', 'contaPoupanca')
                .where('d.user_domain_id = :userId', { userId })
                .andWhere('d.ativo = :ativo', { ativo: true })
                .orderBy('d.id', 'ASC')
                .getMany();

            const res: DespesaRecorrente[] = [];
            for (const r of rows) {
                const rowEntityLoop2 = r as DespesaRecorrenteEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntityLoop2.userDomainId };
                const d = await DespesaRecorrenteMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.findActiveByUserId error: %o', err);
            throw err;
        }
    }

    /**
     * Find recurring expenses that are fully scheduled for their recurrence type,
     * whose origin account belongs to the given bank
     */
    public async findWithValor(userId: string, bancoId: string): Promise<DespesaRecorrente[]> {
        try {
            const qb = this.repo.createQueryBuilder('d')
                .leftJoinAndSelect('d.categoria', 'categoria')
                .leftJoinAndSelect('d.contaOrigem', 'contaOrigem')
                .leftJoinAndSelect('d.contaDestino', 'contaDestino')
                .leftJoinAndSelect('d.contaPoupanca', 'contaPoupanca')
                .where(`(
                    (d.tipo IN (:...mensalTipos) AND d.valor IS NOT NULL AND d.dia_do_mes IS NOT NULL)
                    OR (d.tipo = :tipoSemanal AND d.valor IS NOT NULL AND d.dia_da_semana IS NOT NULL)
                    OR (d.tipo = :tipoAnual AND d.valor IS NOT NULL AND d.dia_do_mes IS NOT NULL AND d.mes IS NOT NULL)
                )`, {
                    mensalTipos: ['Despesa Mensal', 'Poupança'],
                    tipoSemanal: 'Despesa Semanal',
                    tipoAnual: 'Despesa Anual'
                })
                .andWhere('contaOrigem.banco_id = :bancoId', { bancoId })
                .orderBy('d.id', 'ASC');

            if (userId) {
                qb.andWhere('d.user_domain_id = :userId', { userId });
            }

            const rows = await qb.getMany();
            const res: DespesaRecorrente[] = [];
            for (const r of rows) {
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: (r as DespesaRecorrenteEntity).userDomainId };
                const d = await DespesaRecorrenteMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.findWithValor error: %o', err);
            throw err;
        }
    }

    /**
     * Find recurring expenses that are not fully scheduled for their recurrence type,
     * whose origin account belongs to the given bank
     */
    public async findWithoutValor(userId: string, bancoId: string): Promise<DespesaRecorrente[]> {
        try {
            const qb = this.repo.createQueryBuilder('d')
                .leftJoinAndSelect('d.categoria', 'categoria')
                .leftJoinAndSelect('d.contaOrigem', 'contaOrigem')
                .leftJoinAndSelect('d.contaDestino', 'contaDestino')
                .leftJoinAndSelect('d.contaPoupanca', 'contaPoupanca')
                .where(`(
                    (d.tipo IN (:...mensalTipos) AND (d.valor IS NULL OR d.dia_do_mes IS NULL))
                    OR (d.tipo = :tipoSemanal AND (d.valor IS NULL OR d.dia_da_semana IS NULL))
                    OR (d.tipo = :tipoAnual AND (d.valor IS NULL OR d.dia_do_mes IS NULL OR d.mes IS NULL))
                )`, {
                    mensalTipos: ['Despesa Mensal', 'Poupança'],
                    tipoSemanal: 'Despesa Semanal',
                    tipoAnual: 'Despesa Anual'
                })
                .andWhere('contaOrigem.banco_id = :bancoId', { bancoId })
                .orderBy('d.id', 'ASC');

            if (userId) {
                qb.andWhere('d.user_domain_id = :userId', { userId });
            }

            const rows = await qb.getMany();
            const res: DespesaRecorrente[] = [];
            for (const r of rows) {
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: (r as DespesaRecorrenteEntity).userDomainId };
                const d = await DespesaRecorrenteMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.findWithoutValor error: %o', err);
            throw err;
        }
    }

    /**
     * Find recurring sem-valor expenses by tipo for a user, optionally filtered by bank
     */
    public async findByTipo(userId: string, tipo: string, bancoId?: string): Promise<DespesaRecorrente[]> {
        try {
            const qb = this.repo.createQueryBuilder('d')
                .leftJoinAndSelect('d.categoria', 'categoria')
                .leftJoinAndSelect('d.contaOrigem', 'contaOrigem')
                .leftJoinAndSelect('d.contaDestino', 'contaDestino')
                .leftJoinAndSelect('d.contaPoupanca', 'contaPoupanca')
                .where('d.tipo = :tipo', { tipo })
                .andWhere('d.user_domain_id = :userId', { userId })
                .orderBy('d.id', 'ASC');

            if (tipo === 'Despesa Mensal' || tipo === 'Poupança') {
                qb.andWhere('(d.valor IS NULL OR d.dia_do_mes IS NULL)');
            } else if (tipo === 'Despesa Semanal') {
                qb.andWhere('(d.valor IS NULL OR d.dia_da_semana IS NULL)');
            } else if (tipo === 'Despesa Anual') {
                qb.andWhere('(d.valor IS NULL OR d.dia_do_mes IS NULL OR d.mes IS NULL)');
            } else {
                qb.andWhere('d.valor IS NULL');
            }

            if (bancoId) {
                qb.andWhere('contaOrigem.banco_id = :bancoId', {bancoId});
            }

            const rows = await qb.getMany();
            const res: DespesaRecorrente[] = [];
            for (const r of rows) {
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: (r as DespesaRecorrenteEntity).userDomainId };
                const d = await DespesaRecorrenteMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.findByTipo error: %o', err);
            throw err;
        }
    }
}
