import {Service, Inject} from 'typedi';
import type {DataSource, Repository} from 'typeorm';
import type ICartaoCreditoRepo from './IRepos/ICartaoCreditoRepo.js';
import {CartaoCreditoMap} from '../mappers/CartaoCreditoMap.js';
import {CartaoCreditoEntity} from '../persistence/entities/CartaoCreditoEntity.js';
import {CartaoCredito} from '../domain/CartaoCredito/Entities/CartaoCredito.js';
import {ContaEntity} from '../persistence/entities/ContaEntity.js';
import {CartaoCreditoIdHelper, extractSequenceNumber} from '../utils/IDGenerator.js';
import { Dinheiro } from "../domain/Shared/ValueObjects/Dinheiro.js";
import { TransacaoMap } from '../mappers/TransacaoMap.js';
import { TransacaoEntity } from '../persistence/entities/TransacaoEntity.js';
import type {Transacao} from "../domain/Transacao/Entities/Transacao.js";

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
            const allCartoes = await this.repo.find({select: ['domainId'], order: {id: 'DESC'}, take: 100});
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
                    // If looks like a pure number, treat as PK
                    const asNum = Number(rawStr);
                    if (!Number.isNaN(asNum) && String(asNum) === rawStr) {
                        contaPagamentoId = asNum;
                    } else {
                        // lookup ContaEntity by domainId
                        const contaRepo = this.dataSource.getRepository(ContaEntity);
                        const contaRow = await contaRepo.findOne({ where: { domainId: rawStr } });
                        if (!contaRow) {
                            this.logger.error('CartaoCreditoRepo.save: contaPagamentoId lookup failed for domainId %s (userDomainId=%s)', rawStr, userDomainId);
                            return Promise.reject(new Error('Conta not found for cartao.contaPagamentoId: ' + rawStr));
                        }
                        contaPagamentoId = contaRow.id;
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
                contaPagamentoId,
                bancoId: raw.banco_id ?? null
            };

            // Unique name check scoped to the same bank
            if (nome) {
                const bancoId = entityObj.bancoId as string | null ?? null;
                const qb = this.repo.createQueryBuilder('c')
                    .where('LOWER(c.nome) = LOWER(:nome)', {nome});
                if (bancoId) {
                    qb.andWhere('c.bancoId = :bancoId', {bancoId});
                } else {
                    qb.andWhere('c.bancoId IS NULL');
                }
                const existingByName = await qb.getOne();

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
                            .where('id = :id', {id: existingByName.id})
                            .execute();

                        const savedRow = await this.repo.findOne({
                            where: {id: existingByName.id},
                            relations: ['contaPagamento']
                        });
                        if (!savedRow) return Promise.reject(new Error('Failed to find updated cartao after duplicate-name update'));
                        const savedRaw: Record<string, unknown> = {
                            ...(savedRow as unknown as Record<string, unknown>),
                            user_domain_id: (savedRow as CartaoCreditoEntity).userDomainId,
                            conta_pagamento_id: (savedRow as CartaoCreditoEntity).contaPagamento ? (savedRow as CartaoCreditoEntity).contaPagamento.domainId : (savedRow as CartaoCreditoEntity).contaPagamentoId
                        };
                        // use mapper only
                        const domain = await CartaoCreditoMap.toDomain(savedRaw);
                        if (!domain) {
                            this.logger.error('CartaoCreditoRepo.save - CartaoCreditoMap.toDomain returned null for duplicate-name update. raw: %o', savedRaw);
                            return Promise.reject(new Error('Failed to map saved cartao to domain'));
                        }
                        return domain;
                    }

                    return Promise.reject(new Error('CartaoCredito nome already in use'));
                }
            }

            const entity = this.repo.create(entityObj as unknown as CartaoCreditoEntity);
            const saved = await this.repo.save(entity);
            if (!saved) return Promise.reject(new Error('Failed to save cartao'));

            // Re-query the saved row to get the normalized entity shape from TypeORM/DB
            const savedRow = await this.repo.findOne({
                where: {id: (saved as CartaoCreditoEntity).id},
                relations: ['contaPagamento']
            });
            if (!savedRow) return Promise.reject(new Error('Failed to find saved cartao after insert'));
            const savedRaw: Record<string, unknown> = {
                ...(savedRow as unknown as Record<string, unknown>),
                user_domain_id: (savedRow as CartaoCreditoEntity).userDomainId,
                conta_pagamento_id: (savedRow as CartaoCreditoEntity).contaPagamento ? (savedRow as CartaoCreditoEntity).contaPagamento.domainId : (savedRow as CartaoCreditoEntity).contaPagamentoId
            };
            const domain = await CartaoCreditoMap.toDomain(savedRaw);
            if (!domain) {
                this.logger.error('CartaoCreditoRepo.save - CartaoCreditoMap.toDomain returned null after insert. raw: %o', savedRaw);
                return Promise.reject(new Error('Failed to map saved cartao to domain'));
            }
            return domain;
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
                        const contaRow2 = await contaRepo2.findOne({where: {domainId: String(contaPagamentoIdRaw)}});
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
                    contaPagamentoId: contaPagamentoId2,
                    bancoId: raw.banco_id as string | null | undefined
                })
                .where('domain_id = :domainId', {domainId})
                .execute();

            const saved = await this.repo.findOne({where: {domainId}, relations: ['contaPagamento']});
            if (!saved) return Promise.reject(new Error('Failed to find updated cartao by domainId'));

            const savedRaw: Record<string, unknown> = {
                ...(saved as unknown as Record<string, unknown>),
                user_domain_id: (saved as CartaoCreditoEntity).userDomainId,
                conta_pagamento_id: (saved as CartaoCreditoEntity).contaPagamento ? (saved as CartaoCreditoEntity).contaPagamento.domainId : (saved as CartaoCreditoEntity).contaPagamentoId
            };
            const domain = await CartaoCreditoMap.toDomain(savedRaw);
            if (!domain) {
                this.logger.error('CartaoCreditoRepo.update - CartaoCreditoMap.toDomain returned null after update. raw: %o', savedRaw);
                return Promise.reject(new Error('Failed to map saved cartao to domain'));
            }
            return domain;
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
                .where('domain_id = :domainId', {domainId: cartaoId})
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
            const row = await this.repo.findOne({where: {domainId: cartaoId}, relations: ['contaPagamento']});
            if (!row) return null;
            const rowEntity = row as CartaoCreditoEntity;
            const raw: Record<string, unknown> = {
                ...(row as unknown as Record<string, unknown>),
                user_domain_id: rowEntity.userDomainId,
                conta_pagamento_id: rowEntity.contaPagamento ? rowEntity.contaPagamento.domainId : rowEntity.contaPagamentoId
            };
            const domain = await CartaoCreditoMap.toDomain(raw);
            if (!domain) {
                this.logger.error('CartaoCreditoRepo.findById - CartaoCreditoMap.toDomain returned null for raw: %o', raw);
                return null;
            }
            return domain;
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.findById error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all CartaoCredito domain entities, optionally filtered by userId and bancoId. If userId is provided, only CartaoCredito
     * records associated with that user will be returned. If bancoId is provided, only CartaoCredito records associated with that banco will be returned.
     * @param userId - Optional userId to filter CartaoCredito records by user association.
     * @param bancoId - Optional bancoId to filter CartaoCredito records by banco association.
     * @returns An array of CartaoCredito domain entities matching the filter criteria.
     */
    public async findAll(userId?: string, bancoId?: string): Promise<CartaoCredito[]> {
        try {
            let rows: CartaoCreditoEntity[];
            const qb = this.repo.createQueryBuilder('c')
                .leftJoinAndSelect('c.contaPagamento', 'contaPagamento')
                .orderBy('c.id', 'ASC');

            if (userId) {
                qb.andWhere('c.user_domain_id = :userId', { userId });
            }
            if (bancoId) {
                qb.andWhere('c.banco_id = :bancoId', { bancoId });
            }

            // eslint-disable-next-line prefer-const
            rows = await qb.getMany();

            const res: CartaoCredito[] = [];
            for (const r of rows) {
                const rowEntity = r as CartaoCreditoEntity;
                const raw: Record<string, unknown> = {
                    ...(r as unknown as Record<string, unknown>),
                    user_domain_id: rowEntity.userDomainId,
                    conta_pagamento_id: rowEntity.contaPagamento ? rowEntity.contaPagamento.domainId : rowEntity.contaPagamentoId
                };
                const d = await CartaoCreditoMap.toDomain(raw);
                if (d) {
                    res.push(d);
                } else {
                    this.logger.error('CartaoCreditoRepo.findAll - CartaoCreditoMap.toDomain returned null for raw: %o', raw);
                }
            }
            return res;
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.findAll error: %o', err);
            throw err;
        }
    }

    /**
     * Gets the extrato (transaction history and current balance) for a specific CartaoCredito. It retrieves all pending
     * 'Crédito' and 'Reembolso' transactions linked to the CartaoCredito, optionally filtered by userId for access control.
     * It then computes the current balance as the sum of 'Crédito' transactions minus the sum of 'Reembolso'
     * transactions, and returns both the list of 'Crédito' transactions and the computed balance.
     * @param cartaoCreditoId - The domainId of the CartaoCredito to get the extrato for.
     * @param userId - Optional userId to filter transactions for access control. If provided, only transactions
     * associated with that user will be included in the extrato.
     * @return An object containing an array of 'Crédito' transactions and the current balance of the CartaoCredito.
     * If the CartaoCredito is not found, it returns an empty transaction list and a zero balance.
     */
    public async getExtrato(cartaoCreditoId: string, userId?: string): Promise<{
        transacoes: Transacao[];
        saldoAtual: Dinheiro
    }> {
        try {
            // load cartao (including contaPagamento to determine ownership if needed)
            const cartaoRow = await this.repo.findOne({ where: { domainId: cartaoCreditoId }, relations: ['contaPagamento'] });
            if (!cartaoRow) {
                this.logger.error('CartaoCreditoRepo.getExtrato: cartao not found for id %s', cartaoCreditoId);
                const fallback = Dinheiro.create(0, 'EUR');
                return { transacoes: [], saldoAtual: fallback.isSuccess ? fallback.getValue() : Dinheiro.create(0, 'EUR').getValue() };
            }

            // determine period (inclusive)
            const inicio: Date | null = cartaoRow.periodoInicio ? new Date(cartaoRow.periodoInicio) : null;
            const fecho: Date | null = cartaoRow.periodoFecho ? new Date(cartaoRow.periodoFecho) : null;

            // Build query for crédito and reembolso pendentes linked to this card (we'll compute sums from both)
            const transacaoRepo = this.dataSource.getRepository(TransacaoEntity);
            const qbAll = transacaoRepo.createQueryBuilder('t')
                .leftJoinAndSelect('t.categoria', 'c')
                .leftJoinAndSelect('t.cartaoCredito', 'cc')
                .where('cc.id = :cartaoRowId', { cartaoRowId: cartaoRow.id })
                .andWhere('t.tipo IN (:...tipos)', { tipos: ['Crédito', 'Reembolso'] })
                .andWhere('t.status = :status', { status: 'Pendente' });

            if (userId) qbAll.andWhere('t.user_domain_id = :userId', { userId });

            if (inicio && fecho) {
                // Filter by transaction date (dia/mes/ano) instead of created_at
                // Build a date comparison using SQL date construction
                const inicioDay = inicio.getDate();
                const inicioMonth = inicio.getMonth() + 1; // Date.getMonth() returns 0-11
                const inicioYear = inicio.getFullYear();

                const fechoDay = fecho.getDate();
                const fechoMonth = fecho.getMonth() + 1; // Date.getMonth() returns 0-11
                const fechoYear = fecho.getFullYear();

                // Create a comparable integer format: YYYYMMDD
                // Note: t.mes in DB is already 1-12 (not 0-11)
                qbAll.andWhere(
                    '(t.ano * 10000 + t.mes * 100 + t.dia) >= :inicioInt AND (t.ano * 10000 + t.mes * 100 + t.dia) <= :fechoInt',
                    {
                        inicioInt: inicioYear * 10000 + inicioMonth * 100 + inicioDay,
                        fechoInt: fechoYear * 10000 + fechoMonth * 100 + fechoDay
                    }
                );
            }

            const rowsAll = await qbAll.orderBy('t.id', 'ASC').getMany();

            // compute sums: credito sum - reembolso sum
            let sumCredito = 0;
            let sumReembolso = 0;
            const transacoesCreditos: Transacao[] = [];

            for (const r of rowsAll) {
                const rowEntity = r as TransacaoEntity;
                const valorNum = Number(rowEntity.valor ?? 0);
                const tipo = String(rowEntity.tipo ?? '');

                if (tipo === 'Crédito') sumCredito += isFinite(valorNum) ? valorNum : 0;
                if (tipo === 'Reembolso') sumReembolso += isFinite(valorNum) ? valorNum : 0;

                // map domain; only push créditos to the returned list
                const raw: Record<string, unknown> = {
                    ...(r as unknown as Record<string, unknown>),
                    user_domain_id: rowEntity.userDomainId,
                    categoria: rowEntity.categoria ?? undefined,
                    cartaoCredito: rowEntity.cartaoCredito ?? undefined,
                    conta: rowEntity.conta ?? undefined
                };
                const domain = await TransacaoMap.toDomain(raw);
                if (!domain) {
                    this.logger.error('CartaoCreditoRepo.getExtrato - TransacaoMap.toDomain returned null for raw: %o', raw);
                    continue;
                }

                if (domain.tipo.value === 'Crédito') transacoesCreditos.push(domain);
            }

            const saldoValue = sumCredito - sumReembolso;
            const saldoRes = Dinheiro.create(saldoValue, String(cartaoRow.moeda ?? 'EUR'));
            const saldoAtual = saldoRes.isSuccess ? saldoRes.getValue() : Dinheiro.create(0, 'EUR').getValue();

            return { transacoes: transacoesCreditos, saldoAtual };
        } catch (err) {
            this.logger.error('CartaoCreditoRepo.getExtrato error: %o', err);
            throw err;
        }
    }
}
