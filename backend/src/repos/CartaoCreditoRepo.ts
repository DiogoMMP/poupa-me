import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type ICartaoCreditoRepo from './IRepos/ICartaoCreditoRepo.js';
import { CartaoCreditoMap } from '../mappers/CartaoCreditoMap.js';
import { CartaoCreditoEntity } from '../persistence/entities/CartaoCreditoEntity.js';
import { CartaoCredito } from '../domain/CartaoCredito/Entities/CartaoCredito.js';
import { ContaEntity } from '../persistence/entities/ContaEntity.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Data } from '../domain/Shared/ValueObjects/Data.js';
import { Periodo } from '../domain/CartaoCredito/ValueObjects/Periodo.js';
import { Result } from '../core/logic/Result.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { CartaoCreditoIdHelper, extractSequenceNumber } from '../utils/IDGenerator.js';

/**
 * Repository for CartaoCredito entity, handling database operations using TypeORM.
 * Implements ICartaoCreditoRepo interface.
 * Uses CartaoCreditoMap for mapping between domain and persistence models.
 * Includes error handling and logging for all operations.
 */
@Service()
export default class CartaoCreditoRepo implements ICartaoCreditoRepo {
    private repo: Repository<CartaoCreditoEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(CartaoCreditoEntity);
    }

    /**
     * Saves a CartaoCredito domain entity to the database. If a CartaoCredito with the same name exists for the same user, it updates that record instead.
     * @param cartao - The CartaoCredito domain entity to save or update.
     * @returns The saved or updated CartaoCredito domain entity.
     */
    public async save(cartao: CartaoCredito): Promise<CartaoCredito> {
        try {
            const raw = CartaoCreditoMap.toPersistence(cartao) as Record<string, unknown>;

            let domainId = String(raw.domainId ?? '');

            // Always generate sequential domain ID (override UUID from domain entity)
            const allCartoes = await this.repo.find({ select: ['domainId'], order: { id: 'DESC' }, take: 100 });
            let maxSeq = 0;
            for (const c of allCartoes) {
                const seq = extractSequenceNumber(c.domainId, CartaoCreditoIdHelper.prefix);
                if (seq !== null && seq > maxSeq) maxSeq = seq;
            }
            domainId = maxSeq === 0 ? CartaoCreditoIdHelper.generateFirst() : CartaoCreditoIdHelper.generateNext(maxSeq);

            const nome = String(raw.nome ?? '');
            const icon = String(raw.icon ?? '');
            const limiteCreditoVal = Number(raw.limiteCredito ?? 0);
            const saldoUtilizadoVal = Number(raw.saldoUtilizado ?? 0);
            const moedaVal = String(raw.moeda ?? 'EUR');
            // accept periodo_inicio/periodo_fecho as dates or date strings
            const periodoObj = (raw['periodo'] as Record<string, unknown> | undefined) ?? undefined;
            const periodoFechoRaw = raw['periodo_fecho'] ?? raw['periodoFecho'] ?? (periodoObj ? periodoObj['fecho'] : null) ?? null;
            const periodoInicioRaw = raw['periodo_inicio'] ?? raw['periodoInicio'] ?? (periodoObj ? periodoObj['inicio'] : null) ?? null;
            const periodoFechoVal = periodoFechoRaw ? new Date(String(periodoFechoRaw)) : null;
            const periodoInicioVal = periodoInicioRaw ? new Date(String(periodoInicioRaw)) : null;
            const userDomainId = String(raw.user_domain_id ?? raw.userDomainId ?? '');
            const contaPagamentoIdRaw = raw.conta_pagamento_id ?? raw.contaPagamentoId ?? '';
            let contaPagamentoId: number | null = null;
            if (contaPagamentoIdRaw === null || contaPagamentoIdRaw === undefined || contaPagamentoIdRaw === '') {
                contaPagamentoId = null;
            } else if (typeof contaPagamentoIdRaw === 'number') {
                contaPagamentoId = Number(contaPagamentoIdRaw);
            } else {
                // could be a domainId string - try to resolve to numeric PK
                const rawStr = String(contaPagamentoIdRaw).trim();
                if (rawStr.length === 0 || rawStr.toLowerCase() === 'nan' || rawStr.toLowerCase() === 'undefined') {
                    contaPagamentoId = null;
                } else {
                    const asNum = Number(rawStr);
                    if (!Number.isNaN(asNum)) {
                        contaPagamentoId = asNum;
                    } else {
                        // lookup ContaEntity by domainId
                        const contaRepo = this.dataSource.getRepository(ContaEntity);
                        const contaRow = await contaRepo.findOne({ where: { domainId: String(contaPagamentoIdRaw) } });
                        contaPagamentoId = contaRow ? contaRow.id : null;
                    }
                }
            }

            const entityObj: Record<string, unknown> = {
                domainId,
                nome,
                icon,
                limiteCredito: limiteCreditoVal,
                saldoUtilizado: saldoUtilizadoVal,
                moeda: moedaVal,
                periodoFecho: periodoFechoVal,
                periodoInicio: periodoInicioVal,
                userDomainId,
                contaPagamentoId
            };

            // Unique name check
            if (nome) {
                const existingByName = await this.repo.createQueryBuilder('c')
                    .where('LOWER(c.nome) = LOWER(:nome)', { nome })
                    .getOne();

                if (existingByName) {
                    if (existingByName.userDomainId === userDomainId) {
                        await this.repo.createQueryBuilder()
                            .update(CartaoCreditoEntity)
                            .set({
                                nome,
                                icon,
                                limiteCredito: limiteCreditoVal,
                                saldoUtilizado: saldoUtilizadoVal,
                                moeda: moedaVal,
                                periodoFecho: periodoFechoVal,
                                periodoInicio: periodoInicioVal,
                                userDomainId,
                                contaPagamentoId
                            })
                            .where('id = :id', { id: existingByName.id })
                            .execute();

                        const savedRow = await this.repo.findOne({ where: { id: existingByName.id }, relations: ['contaPagamento'] });
                        if (!savedRow) return Promise.reject(new Error('Failed to find updated cartao after duplicate-name update'));
                        const savedRaw: Record<string, unknown> = { ...(savedRow as unknown as Record<string, unknown>), user_domain_id: (savedRow as CartaoCreditoEntity).userDomainId, conta_pagamento_id: (savedRow as CartaoCreditoEntity).contaPagamento ? (savedRow as CartaoCreditoEntity).contaPagamento.domainId : (savedRow as CartaoCreditoEntity).contaPagamentoId };
                        try {
                            const domain = await this.mapRawToDomain(savedRaw);
                            return domain;
                        } catch (err) {
                            this.logger.error('CartaoCreditoRepo.save - failed mapping savedRow (duplicate-name update). raw: %o, err: %o', savedRaw, err);
                            return Promise.reject(err);
                        }
                    }

                    return Promise.reject(new Error('CartaoCredito nome already in use'));
                }
            }

            const entity = this.repo.create(entityObj as unknown as CartaoCreditoEntity);
            const saved = await this.repo.save(entity);
            if (!saved) return Promise.reject(new Error('Failed to save cartao'));

            // Re-query the saved row to get the normalized entity shape from TypeORM/DB
            const savedRow = await this.repo.findOne({ where: { id: (saved as CartaoCreditoEntity).id }, relations: ['contaPagamento'] });
            if (!savedRow) return Promise.reject(new Error('Failed to find saved cartao after insert'));
            const savedRaw: Record<string, unknown> = { ...(savedRow as unknown as Record<string, unknown>), user_domain_id: (savedRow as CartaoCreditoEntity).userDomainId, conta_pagamento_id: (savedRow as CartaoCreditoEntity).contaPagamento ? (savedRow as CartaoCreditoEntity).contaPagamento.domainId : (savedRow as CartaoCreditoEntity).contaPagamentoId };
            try {
                const domain = await this.mapRawToDomain(savedRaw);
                return domain;
            } catch (err) {
                this.logger.error('CartaoCreditoRepo.save - failed mapping savedRow after insert. raw: %o, err: %o', savedRaw, err);
                return Promise.reject(err);
            }
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Updates an existing CartaoCredito domain entity in the database. The CartaoCredito to update is identified by its domainId.
     * @param cartao - The CartaoCredito domain entity with updated data. Must include a valid domainId.
     * @returns The updated CartaoCredito domain entity.
     */
    public async update(cartao: CartaoCredito): Promise<CartaoCredito> {
        try {
            const raw = CartaoCreditoMap.toPersistence(cartao) as Record<string, unknown>;
            const domainId = String(raw.domainId ?? '');
            if (!domainId) return Promise.reject(new Error('CartaoCredito missing domainId for update'));

            const nome = String(raw.nome ?? '');
            const icon = String(raw.icon ?? '');
            const limiteCreditoVal = Number(raw.limiteCredito ?? 0);
            const saldoUtilizadoVal = Number(raw.saldoUtilizado ?? 0);
            const moedaVal = String(raw.moeda ?? 'EUR');
            const userDomainId = String(raw.user_domain_id ?? raw.userDomainId ?? '');
            const contaPagamentoIdRaw = raw.conta_pagamento_id ?? raw.contaPagamentoId ?? '';
            let contaPagamentoId2: number | null = null;
            if (contaPagamentoIdRaw === null || contaPagamentoIdRaw === undefined || contaPagamentoIdRaw === '') {
                contaPagamentoId2 = null;
            } else if (typeof contaPagamentoIdRaw === 'number') {
                contaPagamentoId2 = Number(contaPagamentoIdRaw);
            } else {
                const rawStr2 = String(contaPagamentoIdRaw).trim();
                if (rawStr2.length === 0 || rawStr2.toLowerCase() === 'nan' || rawStr2.toLowerCase() === 'undefined') {
                    contaPagamentoId2 = null;
                } else {
                    const asNum2 = Number(rawStr2);
                    if (!Number.isNaN(asNum2)) {
                        contaPagamentoId2 = asNum2;
                    } else {
                        const contaRepo2 = this.dataSource.getRepository(ContaEntity);
                        const contaRow2 = await contaRepo2.findOne({ where: { domainId: String(contaPagamentoIdRaw) } });
                        contaPagamentoId2 = contaRow2 ? contaRow2.id : null;
                    }
                }
            }

            const periodoObj2 = (raw['periodo'] as Record<string, unknown> | undefined) ?? undefined;
            const periodoFechoRaw2 = raw['periodo_fecho'] ?? raw['periodoFecho'] ?? (periodoObj2 ? periodoObj2['fecho'] : null) ?? null;
            const periodoInicioRaw2 = raw['periodo_inicio'] ?? raw['periodoInicio'] ?? (periodoObj2 ? periodoObj2['inicio'] : null) ?? null;
            const periodoFechoVal2 = periodoFechoRaw2 ? new Date(String(periodoFechoRaw2)) : null;
            const periodoInicioVal2 = periodoInicioRaw2 ? new Date(String(periodoInicioRaw2)) : null;

            await this.repo.createQueryBuilder()
                .update(CartaoCreditoEntity)
                .set({
                    nome,
                    icon,
                    limiteCredito: limiteCreditoVal,
                    saldoUtilizado: saldoUtilizadoVal,
                    moeda: moedaVal,
                    periodoFecho: periodoFechoVal2,
                    periodoInicio: periodoInicioVal2,
                    userDomainId,
                    contaPagamentoId: contaPagamentoId2
                })
                .where('domain_id = :domainId', { domainId })
                .execute();

            const saved = await this.repo.findOne({ where: { domainId }, relations: ['contaPagamento'] });
            if (!saved) return Promise.reject(new Error('Failed to find updated cartao by domainId'));

            const savedRaw: Record<string, unknown> = { ...(saved as unknown as Record<string, unknown>), user_domain_id: (saved as CartaoCreditoEntity).userDomainId, conta_pagamento_id: (saved as CartaoCreditoEntity).contaPagamento ? (saved as CartaoCreditoEntity).contaPagamento.domainId : (saved as CartaoCreditoEntity).contaPagamentoId };
            try {
                const domain = await this.mapRawToDomain(savedRaw);
                return domain;
            } catch (err) {
                this.logger.error('CartaoCreditoRepo.update - failed mapping savedRow after update. raw: %o, err: %o', savedRaw, err);
                return Promise.reject(err);
            }
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.update error: %o', err);
            throw err;
        }
    }

    /**
     * Deletes a CartaoCredito record from the database based on its domainId.
     * @param cartaoId - The domainId of the CartaoCredito to delete.
     */
    public async delete(cartaoId: string): Promise<void> {
        try {
            await this.repo.createQueryBuilder()
                .delete()
                .from(CartaoCreditoEntity)
                .where('domain_id = :domainId', { domainId: cartaoId })
                .execute();
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.delete error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a CartaoCredito domain entity by its domainId. Returns null if not found.
     * @param cartaoId - The domainId of the CartaoCredito to find.
     * @returns The found CartaoCredito domain entity, or null if not found.
     */
    public async findById(cartaoId: string): Promise<CartaoCredito | null> {
        try {
            const row = await this.repo.findOne({ where: { domainId: cartaoId }, relations: ['contaPagamento'] });
            if (!row) return null;
            const rowEntity = row as CartaoCreditoEntity;
            const raw: Record<string, unknown> = { ...(row as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId, conta_pagamento_id: rowEntity.contaPagamento ? rowEntity.contaPagamento.domainId : rowEntity.contaPagamentoId };
            return await this.mapRawToDomain(raw);
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.findById error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all CartaoCredito domain entities, optionally filtered by userId. If userId is provided, only CartaoCredito
     * records associated with that user will be returned. If no userId is provided, all CartaoCredito records will be returned.
     * @param userId - Optional userId to filter CartaoCredito records by user association.
     * @returns An array of CartaoCredito domain entities matching the filter criteria.
     */
    public async findAll(userId?: string): Promise<CartaoCredito[]> {
        try {
            let rows: CartaoCreditoEntity[];
            if (userId) {
                rows = await this.repo.createQueryBuilder('c')
                    .leftJoinAndSelect('c.contaPagamento', 'contaPagamento')
                    .where('c.user_domain_id = :userId', { userId })
                    .orderBy('c.id', 'ASC')
                    .getMany();
            } else {
                rows = await this.repo.find({ relations: ['contaPagamento'], order: { id: 'ASC' } });
            }

            const res: CartaoCredito[] = [];
            for (const r of rows) {
                const rowEntity = r as CartaoCreditoEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId, conta_pagamento_id: rowEntity.contaPagamento ? rowEntity.contaPagamento.domainId : rowEntity.contaPagamentoId };
                const d = await this.mapRawToDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.findAll error: %o', err);
            throw err;
        }
    }

    /**
     * Try to map a raw DB row to CartaoCredito domain. Use CartaoCreditoMap first, then fall back to manual construction
     * with detailed logging to help debugging mapping failures.
     */
    private async mapRawToDomain(raw: Record<string, unknown>): Promise<CartaoCredito> {
        // try mapper first
        const direct = await CartaoCreditoMap.toDomain(raw);
        if (direct) return direct;

        // manual fallback
        try {
            this.logger.error('CartaoCreditoMap.toDomain returned null, attempting manual mapping. Raw: %o', raw);
            const nomeOr = Nome.create(String(raw['nome'] ?? ''));
            const iconOr = Icon.create(String(raw['icon'] ?? ''));
            const moeda = String(raw['moeda'] ?? 'EUR');
            const limiteVal = Number(raw['limiteCredito'] ?? raw['limite_credito'] ?? 0);
            const limiteOr = Dinheiro.create(Number(limiteVal), moeda);
            const saldoVal = Number(raw['saldoUtilizado'] ?? raw['saldo_utilizado'] ?? 0);
            const saldoOr = Dinheiro.create(Number(saldoVal), moeda);

            const pInicioRaw = raw['periodo_inicio'] ?? raw['periodoInicio'] ?? null;
            const pFechoRaw = raw['periodo_fecho'] ?? raw['periodoFecho'] ?? null;
            const now = new Date();
            const dInicio = pInicioRaw ? new Date(String(pInicioRaw)) : now;
            const dFecho = pFechoRaw ? new Date(String(pFechoRaw)) : now;
            const inicioDataOr = Data.createFromParts(dInicio.getDate(), dInicio.getMonth() + 1, dInicio.getFullYear(), true);
            const fechoDataOr = Data.createFromParts(dFecho.getDate(), dFecho.getMonth() + 1, dFecho.getFullYear(), true);

            // Log individual VO failures for diagnostics
            const vos = { nomeOr, iconOr, limiteOr, saldoOr, inicioDataOr, fechoDataOr } as Record<string, any>;
            for (const [k, v] of Object.entries(vos)) {
                if (!v) {
                    this.logger.error('mapRawToDomain missing VO result: %s', k);
                } else if (v.isFailure) {
                    this.logger.error('mapRawToDomain VO %s failed: %o', k, v.errorValue());
                }
            }

            const combine = Result.combine([nomeOr, iconOr, limiteOr, saldoOr, inicioDataOr, fechoDataOr]);
            if (combine.isFailure) {
                this.logger.error('mapRawToDomain value object combine failure (summary): %o; raw: %o', combine.errorValue(), raw);
                return Promise.reject(new Error(String(combine.errorValue())));
            }

            const periodoOr = Periodo.create(inicioDataOr.getValue(), fechoDataOr.getValue());
            if (periodoOr.isFailure) {
                this.logger.error('mapRawToDomain Periodo.create failed: %o', periodoOr.errorValue());
                return Promise.reject(new Error(String(periodoOr.errorValue())));
            }

            const rawConta = raw['conta_pagamento_id'] ?? raw['contaPagamentoId'] ?? null;
            const contaUid = rawConta ? new UniqueEntityID(String(rawConta)) : undefined;

            const props = {
                userId: new UniqueEntityID(String(raw['user_domain_id'] ?? raw['userDomainId'] ?? '')),
                nome: nomeOr.getValue(),
                icon: iconOr.getValue(),
                limiteCredito: limiteOr.getValue(),
                saldoUtilizado: saldoOr.getValue(),
                periodo: periodoOr.getValue(),
                contaPagamentoId: contaUid
            } as any;

            const cartaoOrError = CartaoCredito.create(props, new UniqueEntityID(String(raw['domainId'] ?? raw['id'] ?? '')));
            if (cartaoOrError.isFailure) {
                this.logger.error('mapRawToDomain CartaoCredito.create failed: %o', cartaoOrError.errorValue());
                return Promise.reject(new Error(String(cartaoOrError.errorValue())));
            }
            return cartaoOrError.getValue();
        } catch (err) {
            this.logger.error('mapRawToDomain error: %o', err);
            return Promise.reject(err);
        }
    }
}
