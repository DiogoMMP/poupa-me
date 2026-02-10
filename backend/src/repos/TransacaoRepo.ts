import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoRepo from './IRepos/ITransacaoRepo.js';
import { TransacaoMap } from '../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../persistence/entities/TransacaoEntity.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { CategoriaEntity } from '../persistence/entities/CategoriaEntity.js';
import { ContaEntity } from '../persistence/entities/ContaEntity.js';

/**
 * Repository for managing Transacao entities in the database using TypeORM.
 * Implements the ITransacaoRepo interface for CRUD operations and custom queries.
 */
@Service()
export default class TransacaoRepo implements ITransacaoRepo {
    private repo: Repository<TransacaoEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(TransacaoEntity);
    }

    /**
     * Saves a new Transacao to the database. Handles mapping from domain to persistence format,
     * resolves foreign key for Categoria, and returns the saved Transacao mapped back to domain.
     * @param transacao - The Transacao domain entity to be saved.
     */
    public async save(transacao: Transacao): Promise<Transacao> {
        try {
            const raw = TransacaoMap.toPersistence(transacao);

            // Resolve categoria FK: try to find CategoriaEntity by domainId
            const categoriaRepo = this.dataSource.getRepository(CategoriaEntity);
            const categoriaRow = await categoriaRepo.findOne({ where: { domainId: String(raw['categoriaId']) } });
            if (!categoriaRow) throw new Error('Categoria not found for transacao');

            // typed locals for data and valor to satisfy linter
            const data = (raw['data'] ?? {}) as { dia?: number; mes?: number; ano?: number };
            const valor = (raw['valor'] ?? {}) as { valor?: number; moeda?: string };
            const originalTransactionId = raw['reembolso'] ? String(raw['reembolso']) : undefined;
            const userDomainId = raw['userDomainId'] ? String(raw['userDomainId']) : undefined;
            const contaDomainId = raw['contaId'] ? String(raw['contaId']) : undefined;

            // Prepare entity object; we'll possibly fill userDomainId from contaRow if missing
            const entityObj: Record<string, unknown> = {
                domainId: raw['domainId'],
                descricao: raw['descricao'],
                dia: data.dia ?? 0,
                mes: data.mes ?? 0,
                ano: data.ano ?? 0,
                valor: valor.valor ?? 0,
                moeda: valor.moeda ?? 'EUR',
                tipo: raw['tipo'],
                status: raw['status'],
                categoria: categoriaRow,
                categoriaId: categoriaRow.id,
                originalTransactionId: originalTransactionId
            } as Record<string, unknown>;

            // if contaId provided, resolve ContaEntity and attach
            let contaRow: ContaEntity | null = null;
            if (contaDomainId) {
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                contaRow = await contaRepo.findOne({ where: { domainId: contaDomainId } });
                if (!contaRow) throw new Error('Conta not found for transacao');
                entityObj['conta'] = contaRow;
                entityObj['contaId'] = contaRow.id;
            }

            // determine userDomainId: prefer explicit value from mapped raw, otherwise derive from contaRow.userDomainId if available
            const userDomainIdVal = userDomainId ?? (contaRow ? contaRow.userDomainId : undefined) ?? (raw['user_domain_id'] ?? raw['userId'] ?? raw['userDomainId']);

            if (!userDomainIdVal) {
                this.logger.error('TransacaoRepo.save: missing userDomainId for transacao raw=%o, contaRow=%o', raw, contaRow);
                throw new Error('Missing userDomainId: authenticated user id was not provided in request nor could be derived from target account');
            }

            entityObj['userDomainId'] = String(userDomainIdVal);

            const entity = this.repo.create(entityObj as unknown as TransacaoEntity);

            const saved = await this.repo.save(entity);
            if (!saved) throw new Error('Failed to save transacao');

            // Re-fetch with relations to ensure categoria relation is present and DB types are accurate
            const persisted = await this.repo.findOne({ where: { id: (saved as TransacaoEntity).id }, relations: ['categoria', 'conta'] });
            if (!persisted) throw new Error('Failed to re-fetch saved transacao');

            // map persisted entity to domain; include userDomainId explicitly
            const savedRaw: Record<string, unknown> = {
                ...(persisted as unknown as Record<string, unknown>),
                userDomainId: (persisted as TransacaoEntity).userDomainId,
                categoria: (persisted as TransacaoEntity).categoria ?? categoriaRow,
                conta: (persisted as TransacaoEntity).conta ?? undefined
            };
            const domain = await TransacaoMap.toDomain(savedRaw);
            if (!domain) {
                this.logger.error('TransacaoRepo.save: failed to map savedRaw to domain. savedRaw=%o', savedRaw);
                throw new Error('Failed to map saved transacao to domain');
            }
            return domain;
        } catch (err) {
            this.logger.error('TransacaoRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Updates an existing Transacao in the database. Handles mapping from domain to persistence format,
     * resolves foreign key for Categoria, and returns the updated Transacao mapped back to domain.
     * @param transacao - The Transacao domain entity with updated fields. Must have a valid domainId to identify the record to update.
     */
    public async update(transacao: Transacao): Promise<Transacao> {
        try {
            const raw = TransacaoMap.toPersistence(transacao);

            // Resolve categoria FK
            const categoriaRepo = this.dataSource.getRepository(CategoriaEntity);
            const categoriaRow = await categoriaRepo.findOne({ where: { domainId: String(raw['categoriaId']) } });
            if (!categoriaRow) throw new Error('Categoria not found for transacao');

            const data = (raw['data'] ?? {}) as { dia?: number; mes?: number; ano?: number };
            const valor = (raw['valor'] ?? {}) as { valor?: number; moeda?: string };
            const originalTransactionId = raw['reembolso'] ? String(raw['reembolso']) : undefined;
            const userDomainId = raw['userDomainId'] ? String(raw['userDomainId']) : undefined;
            const contaDomainId = raw['contaId'] ? String(raw['contaId']) : undefined;

            if (raw['domainId']) {
                // If a contaId was provided, resolve the ContaEntity first and ensure it exists
                let contaRowForUpdate: ContaEntity | null = null;
                if (raw['contaId']) {
                    const contaRepo = this.dataSource.getRepository(ContaEntity);
                    contaRowForUpdate = await contaRepo.findOne({ where: { domainId: String(raw['contaId']) } });
                    if (!contaRowForUpdate) throw new Error('Conta not found for transacao');
                }

                await this.repo.createQueryBuilder()
                    .update(TransacaoEntity)
                    .set({
                        descricao: String(raw['descricao'] ?? ''),
                        dia: data.dia ?? 0,
                        mes: data.mes ?? 0,
                        ano: data.ano ?? 0,
                        valor: valor.valor ?? 0,
                        moeda: valor.moeda ?? 'EUR',
                        tipo: String(raw['tipo'] ?? ''),
                        status: String(raw['status'] ?? ''),
                        categoriaId: categoriaRow.id,
                        contaId: contaRowForUpdate ? contaRowForUpdate.id : undefined,
                        originalTransactionId: originalTransactionId
                    })
                    .where('domain_id = :domainId', { domainId: raw['domainId'] })
                    .execute();

                const saved = await this.repo.findOne({ where: { domainId: raw['domainId'] as string }, relations: ['categoria', 'conta'] });
                if (!saved) throw new Error('Failed to find updated transacao by domainId');
                const savedRaw: Record<string, unknown> = { ...(saved as unknown as Record<string, unknown>), userDomainId: (saved as TransacaoEntity).userDomainId, categoria: (saved as TransacaoEntity).categoria ?? categoriaRow, conta: (saved as TransacaoEntity).conta ?? undefined };
                const domain = await TransacaoMap.toDomain(savedRaw);
                if (!domain) {
                    this.logger.error('TransacaoRepo.update: failed to map savedRaw to domain. savedRaw=%o', savedRaw);
                    throw new Error('Failed to map updated transacao to domain');
                }
                return domain;
            }

            // Fallback: save (may insert)
            const entityObj2: Record<string, unknown> = {
                domainId: raw['domainId'],
                descricao: raw['descricao'],
                dia: data.dia ?? 0,
                mes: data.mes ?? 0,
                ano: data.ano ?? 0,
                valor: valor.valor ?? 0,
                moeda: valor.moeda ?? 'EUR',
                tipo: raw['tipo'],
                status: raw['status'],
                categoria: categoriaRow,
                categoriaId: categoriaRow.id,
                originalTransactionId: originalTransactionId,
                userDomainId: userDomainId
            } as Record<string, unknown>;
            if (contaDomainId) {
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                const contaRow = await contaRepo.findOne({ where: { domainId: contaDomainId } });
                if (!contaRow) throw new Error('Conta not found for transacao');
                entityObj2['conta'] = contaRow;
                entityObj2['contaId'] = contaRow.id;
            }
            const entity = this.repo.create(entityObj2 as unknown as TransacaoEntity);

            const saved = await this.repo.save(entity);
            if (!saved) throw new Error('Failed to update transacao');
            const savedRaw: Record<string, unknown> = { ...(saved as unknown as Record<string, unknown>), userDomainId: (saved as TransacaoEntity).userDomainId, categoria: (saved as TransacaoEntity).categoria ?? categoriaRow, conta: (saved as TransacaoEntity).conta ?? undefined };
            const domain = await TransacaoMap.toDomain(savedRaw);
            if (!domain) {
                this.logger.error('TransacaoRepo.update (fallback save): failed to map savedRaw to domain. savedRaw=%o', savedRaw);
                throw new Error('Failed to map updated transacao to domain');
            }
            return domain;
        } catch (err) {
            this.logger.error('TransacaoRepo.update error: %o', err);
            throw err;
        }
    }

    /**
     * Deletes a Transacao from the database by its domain ID.
     * @param transacaoId - The domain ID of the Transacao to delete.
     */
    public async delete(transacaoId: string): Promise<void> {
        try {
            await this.repo.delete({ domainId: transacaoId });
        } catch (err) {
            this.logger.error('TransacaoRepo.delete error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a Transacao by its domain ID. Returns the Transacao mapped to domain format, or null if not found.
     * @param transacaoId - The domain ID of the Transacao to find.
     */
    public async findById(transacaoId: string): Promise<Transacao | null> {
        try {
            const row = await this.repo.findOne({ where: { domainId: transacaoId }, relations: ['categoria', 'conta'] });
            if (!row) return null;
            // include user_domain_id in raw for mapping
            const rowEntity = row as TransacaoEntity;
            const raw: Record<string, unknown> = { ...(row as unknown as Record<string, unknown>), userDomainId: rowEntity.userDomainId };
            return await TransacaoMap.toDomain(raw);
        } catch (err) {
            this.logger.error('TransacaoRepo.findById error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Transacao records in the database. Returns an array of Transacao mapped to domain format, ordered by ID ascending.
     */
    public async findAll(userId?: string): Promise<Transacao[]> {
        try {
            let rows: TransacaoEntity[];
            if (userId) {
                rows = await this.repo.createQueryBuilder('t')
                    .leftJoinAndSelect('t.categoria', 'c')
                    .leftJoinAndSelect('t.conta', 'co')
                    .where('t.user_domain_id = :userId', { userId })
                    .orderBy('t.id', 'ASC')
                    .getMany();
            } else {
                rows = await this.repo.find({ order: { id: 'ASC' }, relations: ['categoria', 'conta'] });
            }
            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), userDomainId: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoRepo.findAll error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Transacao records that belong to a specific Categoria, identified by the Categoria's domain ID. Returns
     * an array of Transacao mapped to domain format, ordered by ID ascending.
     * @param categoriaId - The domain ID of the Categoria to filter Transacao records by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions. If provided, only transactions with a matching userDomainId will be returned.
     */
    public async findByCategoria(categoriaId: string, userId?: string): Promise<Transacao[]> {
        try {
             // Find transactions whose category has the given domainId
             const qb = this.repo.createQueryBuilder('t')
                 .leftJoinAndSelect('t.categoria', 'c')
                 .leftJoinAndSelect('t.conta', 'co')
                 .where('c.domain_id = :domainId', { domainId: categoriaId });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            const rows = await qb.orderBy('t.id', 'ASC').getMany();

             const res: Transacao[] = [];
             for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), userDomainId: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                 if (d) res.push(d);
             }
             return res;
        } catch (err) {
            this.logger.error('TransacaoRepo.findByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Transacao records that have a specific tipo. Returns an array of Transacao mapped to domain format, ordered by ID ascending.
     * @param tipo - The tipo value to filter Transacao records by (e.g., "Entrada", "Saída").
     * @param userId - Optional user ID to scope the search to a specific user's transactions. If provided, only transactions with a matching userDomainId will be returned.
     */
    public async findByTipo(tipo: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .where('t.tipo = :tipo', { tipo });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            const rows = await qb.orderBy('t.id', 'ASC').getMany();
            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), userDomainId: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoRepo.findByTipo error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Transacao records that have a specific status. Returns an array of Transacao mapped to domain format, ordered by ID ascending.
     * @param status - The status value to filter Transacao records by (e.g., "Concluído", "Pendente").
     * @param userId - Optional user ID to scope the search to a specific user's transactions. If provided, only transactions with a matching userDomainId will be returned.
     */
    public async findByStatus(status: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .where('t.status = :status', { status });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            const rows = await qb.orderBy('t.id', 'ASC').getMany();
            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), userDomainId: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoRepo.findByStatus error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Transacao records that have a created_at date between the specified start and end dates. Returns an array of Transacao mapped to domain format, ordered by ID ascending.
     * @param startDate - The start date of the range to filter Transacao records by (inclusive).
     * @param endDate - The end date of the range to filter Transacao records by (inclusive).
     * @param userId - Optional user ID to scope the search to a specific user's transactions. If provided, only transactions with a matching userDomainId will be returned.
     */
    public async findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Transacao[]> {
        try {
             const qb = this.repo.createQueryBuilder('t')
                 .leftJoinAndSelect('t.categoria', 'c')
                 .leftJoinAndSelect('t.conta', 'co')
                 .where('t.created_at BETWEEN :start AND :end', { start: startDate, end: endDate });
            if (userId) qb.andWhere('t.user_domain_id = :userId', { userId });
            const rows = await qb.orderBy('t.id', 'ASC').getMany();

             const res: Transacao[] = [];
             for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), userDomainId: rowEntity.userDomainId };
                const d = await TransacaoMap.toDomain(raw);
                 if (d) res.push(d);
             }
             return res;
        } catch (err) {
            this.logger.error('TransacaoRepo.findByDateRange error: %o', err);
            throw err;
        }
    }
}

