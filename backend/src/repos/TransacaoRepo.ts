import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ITransacaoRepo from './IRepos/ITransacaoRepo.js';
import { TransacaoMap } from '../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../persistence/entities/TransacaoEntity.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { CategoriaEntity } from '../persistence/entities/CategoriaEntity.js';
import { ContaEntity } from '../persistence/entities/ContaEntity.js';
import { CartaoCreditoEntity } from '../persistence/entities/CartaoCreditoEntity.js';
import { TransacaoIdHelper } from '../utils/IDGenerator.js';
import { CategoriaMap } from '../mappers/CategoriaMap.js';
import { CartaoCreditoMap } from '../mappers/CartaoCreditoMap.js';

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

            // Resolve categoria FK: accept both 'categoriaId' (camel) and 'categoria_id' (snake) from the mapped raw
            const categoriaRepo = this.dataSource.getRepository(CategoriaEntity);
            const categoriaDomainId = String(raw['categoriaId'] ?? raw['categoria_id'] ?? raw['categoria'] ?? '');
            if (!categoriaDomainId) throw new Error('Categoria id missing for transacao');
            const categoriaRow = await categoriaRepo.findOne({ where: { domainId: categoriaDomainId } });
            if (!categoriaRow) throw new Error('Categoria not found for transacao');

            // typed locals for data and valor to satisfy linter
            const data = (raw['data'] ?? {}) as { dia?: number; mes?: number; ano?: number };
            const valor = (raw['valor'] ?? {}) as { valor?: number; moeda?: string };
            const userDomainId = raw['userDomainId'] ? String(raw['userDomainId']) : undefined;
            const contaDomainId = raw['contaId'] ?? raw['conta_id'] ?? raw['conta'] ?? undefined;
            const contaDomainIdStr = contaDomainId ? String(contaDomainId) : undefined;

            // Extract year from transaction data for ID generation
            const year = data.ano ?? new Date().getFullYear();

            // Always generate sequential domain ID with year (override UUID from domain entity)
            const prefix = TransacaoIdHelper.generatePrefix(year);
            const yearTransactions = await this.repo
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

            // Prepare entity object; we'll possibly fill userDomainId from contaRow if missing
            const entityObj: Record<string, unknown> = {
                domainId,
                descricao: raw['descricao'],
                dia: data.dia ?? 0,
                mes: data.mes ?? 0,
                ano: data.ano ?? 0,
                valor: valor.valor ?? 0,
                moeda: valor.moeda ?? 'EUR',
                tipo: raw['tipo'],
                status: raw['status'],
                categoria: categoriaRow,
                categoriaId: categoriaRow.id
            } as Record<string, unknown>;

            // if the domain object already contains conta or cartaoCredito, prefer that and resolve to persistence entity
            let contaRow: ContaEntity | null = null;
            if ((transacao as unknown as Record<string, unknown>).conta) {
                const contaDomain = (transacao as unknown as Record<string, unknown>).conta as { id: { toString(): string } };
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                contaRow = await contaRepo.findOne({ where: { domainId: contaDomain.id.toString() } });
                if (!contaRow) throw new Error('Conta (from domain) not found for transacao');
                // Prefer explicit FK column to avoid relation-persistence inconsistencies
                entityObj['contaId'] = contaRow.id;
            } else if (contaDomainIdStr) {
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                contaRow = await contaRepo.findOne({ where: { domainId: contaDomainIdStr } });
                if (!contaRow) throw new Error('Conta not found for transacao');
                entityObj['contaId'] = contaRow.id;
            }

            // If domain object contains contaDestino (for Despesa Mensal), resolve it
            if ((transacao as unknown as Record<string, unknown>).contaDestino) {
                const contaDestinoDomain = (transacao as unknown as Record<string, unknown>).contaDestino as { id: { toString(): string } };
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                const contaDestinoRow = await contaRepo.findOne({ where: { domainId: contaDestinoDomain.id.toString() } });
                if (!contaDestinoRow) throw new Error('ContaDestino (from domain) not found for transacao');
                entityObj['contaDestinoId'] = contaDestinoRow.id;
            }

            // If domain object contains contaPoupanca (for Poupança), resolve it
            if ((transacao as unknown as Record<string, unknown>).contaPoupanca) {
                const contaPoupancaDomain = (transacao as unknown as Record<string, unknown>).contaPoupanca as { id: { toString(): string } };
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                const contaPoupancaRow = await contaRepo.findOne({ where: { domainId: contaPoupancaDomain.id.toString() } });
                if (!contaPoupancaRow) throw new Error('ContaPoupanca (from domain) not found for transacao');
                entityObj['contaPoupancaId'] = contaPoupancaRow.id;
            }

            // determine userDomainId: prefer explicit value from mapped raw, otherwise derive from contaRow.userDomainId if available
            const userDomainIdVal = userDomainId ?? (contaRow ? contaRow.userDomainId : undefined) ?? (raw['user_domain_id'] ?? raw['userId'] ?? raw['userDomainId']);

            if (!userDomainIdVal) {
                this.logger.error('TransacaoRepo.save: missing userDomainId for transacao raw=%o, contaRow=%o', raw, contaRow);
                throw new Error('Missing userDomainId: authenticated user id was not provided in request nor could be derived from target account');
            }

            entityObj['userDomainId'] = String(userDomainIdVal);

            // If domain object contains cartaoCredito, resolve and attach too
            if ((transacao as unknown as Record<string, unknown>).cartaoCredito) {
                const cartaoDomain = (transacao as unknown as Record<string, unknown>).cartaoCredito as { id: { toString(): string } };
                // attempt to find CartaoCreditoEntity by domainId via repository manager
                try {
                    const cartao = await this.dataSource.getRepository(CartaoCreditoEntity).findOne({ where: { domainId: cartaoDomain.id.toString() } });
                    if (cartao) {
                        entityObj['cartaoCredito'] = cartao;
                        entityObj['cartaoCreditoId'] = cartao.id;
                    }
                } catch {
                    // ignore; cartao will remain unset if not found
                }
            }

            const entity = this.repo.create(entityObj as unknown as TransacaoEntity);

            const saved = await this.repo.save(entity);
            if (!saved) throw new Error('Failed to save transacao');

            // Re-fetch with relations to ensure categoria relation is present and DB types are accurate
            const persisted = await this.repo.findOne({ where: { id: (saved as TransacaoEntity).id }, relations: ['categoria', 'conta', 'contaDestino', 'contaPoupanca', 'cartaoCredito'] });
            if (!persisted) throw new Error('Failed to re-fetch saved transacao');

            // map persisted entity to domain; include userDomainId explicitly
            const savedRaw: Record<string, unknown> = {
                ...(persisted as unknown as Record<string, unknown>),
                user_domain_id: (persisted as TransacaoEntity).userDomainId,
                categoria: (persisted as TransacaoEntity).categoria ?? categoriaRow,
                conta: (persisted as TransacaoEntity).conta ?? undefined,
                contaDestino: (persisted as TransacaoEntity).contaDestino ?? undefined,
                contaPoupanca: (persisted as TransacaoEntity).contaPoupanca ?? undefined,
                cartaoCredito: (persisted as TransacaoEntity).cartaoCredito ?? undefined
            };

            // Ensure nested relation objects include snake_case user_domain_id so their mappers can read owner id
            try {
                if (savedRaw['conta']) {
                    const c = savedRaw['conta'] as Record<string, unknown>;
                    const persistedConta = (persisted as TransacaoEntity).conta;
                    if (persistedConta && persistedConta.userDomainId) c['user_domain_id'] = persistedConta.userDomainId;
                }
            } catch {
                // ignore
            }
            try {
                if (savedRaw['cartaoCredito']) {
                    const cc = savedRaw['cartaoCredito'] as Record<string, unknown>;
                    const persistedCc = (persisted as TransacaoEntity).cartaoCredito;
                    if (persistedCc && persistedCc.userDomainId) cc['user_domain_id'] = persistedCc.userDomainId;
                }
            } catch {
                // ignore
            }

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
            const categoriaDomainId2 = String(raw['categoriaId'] ?? raw['categoria_id'] ?? raw['categoria'] ?? '');
            if (!categoriaDomainId2) throw new Error('Categoria id missing for transacao');
            const categoriaRow = await categoriaRepo.findOne({ where: { domainId: categoriaDomainId2 } });
            if (!categoriaRow) throw new Error('Categoria not found for transacao');

            const data = (raw['data'] ?? {}) as { dia?: number; mes?: number; ano?: number };
            const valor = (raw['valor'] ?? {}) as { valor?: number; moeda?: string };
            const userDomainId = raw['userDomainId'] ? String(raw['userDomainId']) : undefined;
            if (raw['domainId']) {
                // Resolve conta if provided
                let contaRowForUpdate: ContaEntity | null = null;
                const contaDomainIdForUpdate = raw['contaId'] ?? raw['conta_id'] ?? raw['conta'] ?? null;
                if (contaDomainIdForUpdate) {
                    const contaRepo = this.dataSource.getRepository(ContaEntity);
                    contaRowForUpdate = await contaRepo.findOne({ where: { domainId: String(contaDomainIdForUpdate) } });
                    if (!contaRowForUpdate) throw new Error('Conta not found for transacao');
                }

                // Resolve contaDestino if provided (for Despesa Mensal)
                let contaDestinoRowForUpdate: ContaEntity | null = null;
                const contaDestinoDomainIdForUpdate = raw['contaDestinoId'] ?? raw['conta_destino_id'] ?? raw['contaDestino'] ?? null;
                if (contaDestinoDomainIdForUpdate) {
                    const contaRepo = this.dataSource.getRepository(ContaEntity);
                    contaDestinoRowForUpdate = await contaRepo.findOne({ where: { domainId: String(contaDestinoDomainIdForUpdate) } });
                    if (!contaDestinoRowForUpdate) throw new Error('Conta destino not found for transacao');
                }

                // Resolve contaPoupanca if provided (for Poupança)
                let contaPoupancaRowForUpdate: ContaEntity | null = null;
                const contaPoupancaDomainIdForUpdate = raw['contaPoupancaId'] ?? raw['conta_poupanca_id'] ?? null;
                if (contaPoupancaDomainIdForUpdate) {
                    const contaRepo = this.dataSource.getRepository(ContaEntity);
                    contaPoupancaRowForUpdate = await contaRepo.findOne({ where: { domainId: String(contaPoupancaDomainIdForUpdate) } });
                    if (!contaPoupancaRowForUpdate) throw new Error('Conta poupanca not found for transacao');
                }

                // Resolve cartaoCredito if provided
                let cartaoRowForUpdate = null;
                const cartaoDomainIdForUpdate = raw['cartaoCreditoId'] ?? raw['cartao_credito_id'] ?? raw['cartaoCredito'] ?? null;
                if (cartaoDomainIdForUpdate) {
                    const cartaoRepo = this.dataSource.getRepository(CartaoCreditoEntity);
                    cartaoRowForUpdate = await cartaoRepo.findOne({ where: { domainId: String(cartaoDomainIdForUpdate) } });
                    if (!cartaoRowForUpdate) throw new Error('Cartao credito not found for transacao');
                }

                const updateSet: Record<string, unknown> = {
                    descricao: String(raw['descricao'] ?? ''),
                    dia: data.dia ?? 0,
                    mes: data.mes ?? 0,
                    ano: data.ano ?? 0,
                    valor: valor.valor ?? 0,
                    moeda: valor.moeda ?? 'EUR',
                    tipo: String(raw['tipo'] ?? ''),
                    status: String(raw['status'] ?? ''),
                    categoriaId: categoriaRow.id
                };

                // Only update foreign keys if they were provided (to avoid overwriting with null)
                if (contaRowForUpdate !== null) updateSet['contaId'] = contaRowForUpdate.id;
                if (contaDestinoRowForUpdate !== null) updateSet['contaDestinoId'] = contaDestinoRowForUpdate.id;
                if (contaPoupancaRowForUpdate !== null) updateSet['contaPoupancaId'] = contaPoupancaRowForUpdate.id;
                if (cartaoRowForUpdate !== null) updateSet['cartaoCreditoId'] = cartaoRowForUpdate.id;

                await this.repo.createQueryBuilder()
                    .update(TransacaoEntity)
                    .set(updateSet)
                    .where('domain_id = :domainId', { domainId: raw['domainId'] })
                    .execute();

                const saved = await this.repo.findOne({
                    where: { domainId: raw['domainId'] as string },
                    relations: ['categoria', 'conta', 'contaDestino', 'contaPoupanca', 'cartaoCredito']
                });
                if (!saved) throw new Error('Failed to find updated transacao by domainId');
                const savedRaw: Record<string, unknown> = {
                    ...(saved as unknown as Record<string, unknown>),
                    user_domain_id: (saved as TransacaoEntity).userDomainId,
                    categoria: (saved as TransacaoEntity).categoria ?? categoriaRow,
                    conta: (saved as TransacaoEntity).conta ?? undefined,
                    contaDestino: (saved as TransacaoEntity).contaDestino ?? undefined,
                    contaPoupanca: (saved as TransacaoEntity).contaPoupanca ?? undefined,
                    cartaoCredito: (saved as TransacaoEntity).cartaoCredito ?? undefined
                };
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
                userDomainId: userDomainId
            } as Record<string, unknown>;
            const contaDomainId2 = raw['contaId'] ?? raw['conta_id'] ?? raw['conta'] ?? undefined;
            if (contaDomainId2) {
                const contaRepo = this.dataSource.getRepository(ContaEntity);
                const contaRow = await contaRepo.findOne({ where: { domainId: String(contaDomainId2) } });
                if (!contaRow) throw new Error('Conta not found for transacao');
                entityObj2['conta'] = contaRow;
                entityObj2['contaId'] = contaRow.id;
            }
            const entity = this.repo.create(entityObj2 as unknown as TransacaoEntity);

            const saved = await this.repo.save(entity);
            if (!saved) throw new Error('Failed to update transacao');
            const savedRaw: Record<string, unknown> = {
                ...(saved as unknown as Record<string, unknown>),
                user_domain_id: (saved as TransacaoEntity).userDomainId,
                categoria: (saved as TransacaoEntity).categoria ?? categoriaRow,
                conta: (saved as TransacaoEntity).conta ?? undefined,
                contaDestino: (saved as TransacaoEntity).contaDestino ?? undefined,
                cartaoCredito: (saved as TransacaoEntity).cartaoCredito ?? undefined
            };
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
     * Processes card payment: marks all pending Crédito transactions within the period as Concluído and creates a Saída transaction.
     * @param cartaoCreditoId - Domain ID of the CartaoCredito
     * @param valorPagamento - Payment amount
     * @param userId - User domain ID for access control
     * @param periodo - Period to filter transactions (inicio and fecho dates)
     * @returns The created payment transaction (Saída)
     */
    public async pagarCartao(cartaoCreditoId: string, valorPagamento: number, userId: string, periodo: { inicio: Date; fecho: Date }): Promise<Transacao> {
        try {
            // Resolve cartao domain ID to database ID
            const cartaoRepo = this.dataSource.getRepository(CartaoCreditoEntity);
            const cartaoRow = await cartaoRepo.findOne({ where: { domainId: cartaoCreditoId } });

            if (!cartaoRow) {
                this.logger.error('TransacaoRepo.pagarCartao: cartao not found for id %s', cartaoCreditoId);
                throw new Error('Cartao not found');
            }

            // 1. Mark all pending Crédito transactions within the period as Concluído
            const inicioDay = periodo.inicio.getDate();
            const inicioMonth = periodo.inicio.getMonth() + 1;
            const inicioYear = periodo.inicio.getFullYear();

            const fechoDay = periodo.fecho.getDate();
            const fechoMonth = periodo.fecho.getMonth() + 1;
            const fechoYear = periodo.fecho.getFullYear();

            await this.repo.createQueryBuilder()
                .update(TransacaoEntity)
                .set({ status: 'Concluído' })
                .where('cartao_credito_id = :cartaoId', { cartaoId: cartaoRow.id })
                .andWhere('user_domain_id = :userId', { userId })
                .andWhere('status = :status', { status: 'Pendente' })
                .andWhere('tipo = :tipo', { tipo: 'Crédito' })
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
            const Data = (await import('../domain/Shared/ValueObjects/Data.js')).Data;
            const Descricao = (await import('../domain/Transacao/ValueObjects/Descricao.js')).Descricao;
            const Tipo = (await import('../domain/Transacao/ValueObjects/Tipo.js')).Tipo;
            const Status = (await import('../domain/Transacao/ValueObjects/Status.js')).Status;
            const Dinheiro = (await import('../domain/Shared/ValueObjects/Dinheiro.js')).Dinheiro;

            const dataOrError = Data.createFromParts(now.getDate(), now.getMonth() + 1, now.getFullYear());
            const descricaoOrError = Descricao.create(`Pagamento Cartão de Crédito ${cartaoRow.nome}`);
            const tipoOrError = Tipo.create('Saída');
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
                cartaoCredito: cartaoDomain
            };

            const paymentOrError = Transacao.create(paymentProps);
            if (paymentOrError.isFailure) throw new Error('Failed to create payment transaction');

            const paymentDomain = paymentOrError.getValue();
            (paymentDomain as unknown as { userDomainId?: string }).userDomainId = userId;

            // Use save() to create the transaction - this will update saldoUtilizado automatically
            return await this.save(paymentDomain);
        } catch (err) {
            this.logger.error('TransacaoRepo.pagarCartao error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a Transacao by its domain ID. Returns the Transacao mapped to domain format, or null if not found.
     * @param transacaoId - The domain ID of the Transacao to find.
     */
    public async findById(transacaoId: string): Promise<Transacao | null> {
        try {
            const row = await this.repo.findOne({
                where: { domainId: transacaoId },
                relations: ['categoria', 'conta', 'contaDestino', 'cartaoCredito']
            });
            if (!row) return null;
            // include user_domain_id in raw for mapping
            const rowEntity = row as TransacaoEntity;
            const raw: Record<string, unknown> = { ...(row as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
            return await TransacaoMap.toDomain(raw);
        } catch (err) {
            this.logger.error('TransacaoRepo.findById error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Entrada, Saída, and Reembolso transactions (conta-based) for a specific account.
     * Returns an array of Transacao mapped to domain format, ordered by ID descending.
     * @param contaId - The domain ID of the Conta to filter transactions by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findContaTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Crédito and Reembolso transactions (cartão-based) for a specific credit card.
     * Returns an array of Transacao mapped to domain format, ordered by ID descending.
     * @param cartaoCreditoId - The domain ID of the CartaoCredito to filter transactions by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findCartaoTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Despesa Mensal transactions for a specific account.
     * Returns an array of Transacao mapped to domain format, ordered by ID descending.
     * @param contaId - The domain ID of the Conta to filter transactions by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaMensal(contaId: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.contaDestino', 'cd')
                .leftJoinAndSelect('t.contaPoupanca', 'cp')
                .where('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança'] })
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
            this.logger.error('TransacaoRepo.findDespesaMensal error: %o', err);
            throw err;
        }
    }

    /**
     * Finds ALL Entrada and Saída transactions across every account belonging to the user.
     * @param userId - Optional user ID to scope the search.
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
            this.logger.error('TransacaoRepo.findAllContaTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds ALL Crédito and Reembolso transactions across every credit card belonging to the user.
     * @param userId - Optional user ID to scope the search.
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
            this.logger.error('TransacaoRepo.findAllCartaoTransactions error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Entrada/Saída transactions by categoria across all accounts.
     * @param categoriaId - The domain ID of the Categoria to filter Transacao records by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findContaTransactionsByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by categoria across all credit cards.
     * @param categoriaId - The domain ID of the Categoria to filter Transacao records by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findCartaoTransactionsByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Despesa Mensal transactions by categoria for a specific account.
     * Returns an array of Transacao mapped to domain format, ordered by ID descending.
     * @param contaId - The domain ID of the Conta to filter transactions by.
     * @param categoriaId - The domain ID of the Categoria to filter Transacao records by.
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaMensalByCategoria(contaId: string, categoriaId: string, userId?: string): Promise<Transacao[]> {
        try {
             const qb = this.repo.createQueryBuilder('t')
                 .leftJoinAndSelect('t.categoria', 'c')
                 .leftJoinAndSelect('t.conta', 'co')
                 .leftJoinAndSelect('t.contaDestino', 'cd')
                 .leftJoinAndSelect('t.contaPoupanca', 'cp')
                 .where('c.domain_id = :domainId', { domainId: categoriaId })
                 .andWhere('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança'] })
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
            this.logger.error('TransacaoRepo.findDespesaMensalByCategoria error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Crédito and Reembolso transactions by status across all credit cards.
     * @param status - The status value to filter Transacao records by (e.g., "Concluído", "Pendente").
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findCartaoTransactionsByStatus error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Despesa Mensal transactions by status for a specific account.
     * Returns an array of Transacao mapped to domain format, ordered by ID descending.
     * @param contaId - The domain ID of the Conta to filter transactions by.
     * @param status - The status value to filter Transacao records by (e.g., "Concluído", "Pendente").
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaMensalByStatus(contaId: string, status: string, userId?: string): Promise<Transacao[]> {
        try {
            const qb = this.repo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.conta', 'co')
                .leftJoinAndSelect('t.contaDestino', 'cd')
                .leftJoinAndSelect('t.contaPoupanca', 'cp')
                .where('t.status = :status', { status })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança'] })
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
            this.logger.error('TransacaoRepo.findDespesaMensalByStatus error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Entrada/Saída transactions by predefined period across all accounts.
     * @param period - The period to filter by
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findContaTransactionsByPeriod error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by predefined period across all credit cards.
     * @param period - The period to filter by
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
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
            this.logger.error('TransacaoRepo.findCartaoTransactionsByPeriod error: %o', err);
            throw err;
        }
    }

    /**
     * Finds Despesa Mensal transactions by predefined period for a specific account.
     * Accepts: 'Este Mês', 'Últimos 3 Meses', 'Último Ano'.
     * Returns an array of Transacao mapped to domain format, ordered by ID descending.
     * @param contaId - The domain ID of the Conta to filter transactions by.
     * @param period - The period to filter by
     * @param userId - Optional user ID to scope the search to a specific user's transactions.
     */
    public async findDespesaMensalByPeriod(contaId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Transacao[]> {
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
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Despesa Mensal', 'Poupança'] })
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
            this.logger.error('TransacaoRepo.findDespesaMensalByPeriod error: %o', err);
            throw err;
        }
    }

    public async findAll(userId: string): Promise<Transacao[]> {
        try {
            const rows = await this.repo.find({
                where: {userDomainId: userId},
                relations: ['categoria', 'conta', 'contaDestino', 'contaPoupanca', 'cartaoCredito'],
                order: {id: 'DESC'}
            });
            const res: Transacao[] = [];
            for (const r of rows) {
                const rowEntity = r as TransacaoEntity;
                const raw: Record<string, unknown> = {
                    ...(r as unknown as Record<string, unknown>),
                    user_domain_id: rowEntity.userDomainId
                };
                const d = await TransacaoMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('TransacaoRepo.findAll error: %o', err);
            throw err;
        }
    }
}

