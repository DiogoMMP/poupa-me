import { Service, Inject } from 'typedi';
import { In } from 'typeorm';
import type { DataSource, Repository } from 'typeorm';
import type IDespesaRecorrenteRepo from './IRepos/IDespesaRecorrenteRepo.js';
import { DespesaRecorrenteMap } from '../../mappers/DespesaRecorrenteMap.js';
import { DespesaRecorrenteEntity } from '../../persistence/entities/DespesaRecorrenteEntity.js';
import { DespesaRecorrente } from '../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';
import { CategoriaEntity } from '../../persistence/entities/CategoriaEntity.js';
import { ContaEntity } from '../../persistence/entities/ContaEntity.js';
import { DespesaRecorrenteIdHelper, extractSequenceNumber } from '../../utils/IDGenerator.js';

/**
 * Repository implementation for Recurring Expenses using TypeORM
 */
@Service()
export default class DespesaRecorrenteRepo implements IDespesaRecorrenteRepo {
    private repo: Repository<DespesaRecorrenteEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(DespesaRecorrenteEntity);
    }

    /**
     * Save a Recurring Expense to the database
     */
    public async save(despesa: DespesaRecorrente): Promise<DespesaRecorrente> {
        try {
            const raw = DespesaRecorrenteMap.toPersistence(despesa) as Record<string, unknown>;

            // Generate sequential domain ID
            const allDespesas = await this.repo.find({ select: ['domainId'], order: { id: 'DESC' }, take: 100 });
            let maxSeq = 0;
            for (const d of allDespesas) {
                const seq = extractSequenceNumber(d.domainId, DespesaRecorrenteIdHelper.prefix);
                if (seq !== null && seq > maxSeq) maxSeq = seq;
            }
            const domainId = maxSeq === 0 ? DespesaRecorrenteIdHelper.generateFirst() : DespesaRecorrenteIdHelper.generateNext(maxSeq);

            const nome = String(raw.nome ?? '');
            const icon = String(raw.icon ?? '');
            const valorNum = raw.valor !== null && raw.valor !== undefined ? Number(raw.valor) : null;
            const moeda = raw.moeda !== null && raw.moeda !== undefined ? String(raw.moeda) : null;
            const diaDoMes = raw.dia_do_mes !== null && raw.dia_do_mes !== undefined ? Number(raw.dia_do_mes) : null;
            const diaDaSemana = raw.dia_da_semana !== null && raw.dia_da_semana !== undefined ? Number(raw.dia_da_semana) : null;
            const mes = raw.mes !== null && raw.mes !== undefined ? Number(raw.mes) : null;
            const userDomainId = String(raw.user_domain_id ?? '');
            const ultimoProcessamento = raw.ultimo_processamento ? new Date(String(raw.ultimo_processamento)) : null;
            const ativo = raw.ativo !== undefined ? Boolean(raw.ativo) : true;
            const imediata = raw.imediata !== undefined ? Boolean(raw.imediata) : false;

            // Resolve category ID
            const categoriaIdRaw = raw.categoria_id ?? '';
            const categoriaRepo = this.dataSource.getRepository(CategoriaEntity);
            const categoriaRow = await categoriaRepo.findOne({ where: { domainId: String(categoriaIdRaw) } });
            if (!categoriaRow) {
                this.logger.error('DespesaRecorrenteRepo.save: category not found for domainId %s', categoriaIdRaw);
                return Promise.reject(new Error('Category not found for recurring expense: ' + categoriaIdRaw));
            }

            // Resolve origin account ID
            const contaOrigemIdRaw = raw.conta_origem_id ?? '';
            const contaRepo = this.dataSource.getRepository(ContaEntity);
            const contaOrigemRow = await contaRepo.findOne({ where: { domainId: String(contaOrigemIdRaw) } });
            if (!contaOrigemRow) {
                this.logger.error('DespesaRecorrenteRepo.save: origin account not found for domainId %s', contaOrigemIdRaw);
                return Promise.reject(new Error('Origin account not found for recurring expense: ' + contaOrigemIdRaw));
            }

            // Resolve destination account ID (optional when immediate)
            const contaDestinoIdRaw = raw.conta_destino_id;
            let contaDestinoId: number | null = null;
            if (contaDestinoIdRaw !== null && contaDestinoIdRaw !== undefined && String(contaDestinoIdRaw).trim() !== '') {
                const contaDestinoRow = await contaRepo.findOne({ where: { domainId: String(contaDestinoIdRaw) } });
                if (!contaDestinoRow) {
                    this.logger.error('DespesaRecorrenteRepo.save: destination account not found for domainId %s', contaDestinoIdRaw);
                    return Promise.reject(new Error('Destination account not found for recurring expense: ' + contaDestinoIdRaw));
                }
                contaDestinoId = contaDestinoRow.id;
            } else if (!imediata) {
                this.logger.error('DespesaRecorrenteRepo.save: destination account is required when immediate is false');
                return Promise.reject(new Error('Destination account is required when immediate is false'));
            }

            // Resolve savings account ID (optional, only for "Poupança")
            let contaPoupancaId: number | null = null;
            const contaPoupancaIdRaw = raw.conta_poupanca_id ?? '';
            if (contaPoupancaIdRaw) {
                const contaPoupancaRow = await contaRepo.findOne({ where: { domainId: String(contaPoupancaIdRaw) } });
                contaPoupancaId = contaPoupancaRow ? contaPoupancaRow.id : null;
            }

            const entityObj: Record<string, unknown> = {
                domainId,
                nome,
                icon,
                valor: valorNum,
                moeda,
                diaDoMes,
                diaDaSemana,
                mes,
                categoriaId: categoriaRow.id,
                contaOrigemId: contaOrigemRow.id,
                contaDestinoId,
                ...(contaPoupancaId ? { contaPoupancaId } : {}),
                tipo: String(raw.tipo ?? 'Despesa Mensal'),
                ultimoProcessamento,
                ativo,
                imediata,
                userDomainId
            };

            const entity = this.repo.create(entityObj as unknown as DespesaRecorrenteEntity);
            const saved = await this.repo.save(entity);
            if (!saved) return Promise.reject(new Error('Failed to save recurring expense'));

            // Re-query with relations
            const savedRow = await this.repo.findOne({
                where: { id: saved.id },
                relations: ['categoria', 'contaOrigem', 'contaDestino', 'contaPoupanca']
            });
            if (!savedRow) return Promise.reject(new Error('Failed to find saved recurring expense'));

            const savedEntity = savedRow as DespesaRecorrenteEntity;
            const savedRaw: Record<string, unknown> = { ...(savedRow as unknown as Record<string, unknown>), user_domain_id: savedEntity.userDomainId };

            const domain = await DespesaRecorrenteMap.toDomain(savedRaw);
            if (!domain) {
                this.logger.error('DespesaRecorrenteRepo.save - DespesaRecorrenteMap.toDomain returned null');
                return Promise.reject(new Error('Failed to map saved recurring expense to domain'));
            }
            return domain;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Update an existing recurring expense
     */
    public async update(despesa: DespesaRecorrente): Promise<DespesaRecorrente> {
        try {
            const raw = DespesaRecorrenteMap.toPersistence(despesa) as Record<string, unknown>;
            const domainId = String(raw.domainId ?? '');
            if (!domainId) return Promise.reject(new Error('DespesaRecorrente missing domainId for update'));

            const nome = String(raw.nome ?? '');
            const icon = String(raw.icon ?? '');
            const valorNum = raw.valor !== null && raw.valor !== undefined ? Number(raw.valor) : null;
            const moeda = raw.moeda !== null && raw.moeda !== undefined ? String(raw.moeda) : null;
            const diaDoMes = raw.dia_do_mes !== null && raw.dia_do_mes !== undefined ? Number(raw.dia_do_mes) : null;
            const diaDaSemana = raw.dia_da_semana !== null && raw.dia_da_semana !== undefined ? Number(raw.dia_da_semana) : null;
            const mes = raw.mes !== null && raw.mes !== undefined ? Number(raw.mes) : null;
            const userDomainId = String(raw.user_domain_id ?? '');
            const ultimoProcessamento = raw.ultimo_processamento ? new Date(String(raw.ultimo_processamento)) : null;
            const ativo = raw.ativo !== undefined ? Boolean(raw.ativo) : true;
            const imediata = raw.imediata !== undefined ? Boolean(raw.imediata) : false;

            // Resolve IDs
            const categoriaIdRaw = raw.categoria_id ?? '';
            const categoriaRepo = this.dataSource.getRepository(CategoriaEntity);
            const categoriaRow = await categoriaRepo.findOne({ where: { domainId: String(categoriaIdRaw) } });
            const categoriaId = categoriaRow ? categoriaRow.id : null;

            const contaOrigemIdRaw = raw.conta_origem_id ?? '';
            const contaRepo = this.dataSource.getRepository(ContaEntity);
            const contaOrigemRow = await contaRepo.findOne({ where: { domainId: String(contaOrigemIdRaw) } });
            const contaOrigemId = contaOrigemRow ? contaOrigemRow.id : null;

            const contaDestinoIdRaw = raw.conta_destino_id;
            let contaDestinoId: number | null = null;
            if (contaDestinoIdRaw !== null && contaDestinoIdRaw !== undefined && String(contaDestinoIdRaw).trim() !== '') {
                const contaDestinoRow = await contaRepo.findOne({ where: { domainId: String(contaDestinoIdRaw) } });
                if (!contaDestinoRow) {
                    this.logger.error('DespesaRecorrenteRepo.update: destination account not found for domainId %s', contaDestinoIdRaw);
                    return Promise.reject(new Error('Destination account not found for recurring expense: ' + contaDestinoIdRaw));
                }
                contaDestinoId = contaDestinoRow.id;
            } else if (!imediata) {
                this.logger.error('DespesaRecorrenteRepo.update: destination account is required when immediate is false');
                return Promise.reject(new Error('Destination account is required when immediate is false'));
            }

            let contaPoupancaIdForUpdate: number | null = null;
            const contaPoupancaIdRaw = raw.conta_poupanca_id ?? '';
            if (contaPoupancaIdRaw) {
                const cpRow = await contaRepo.findOne({ where: { domainId: String(contaPoupancaIdRaw) } });
                contaPoupancaIdForUpdate = cpRow ? cpRow.id : null;
            }

            const updateSet: Record<string, unknown> = {
                nome,
                icon,
                valor: valorNum,
                moeda,
                diaDoMes,
                diaDaSemana,
                mes,
                categoriaId: categoriaId as number,
                contaOrigemId: contaOrigemId as number,
                contaDestinoId,
                tipo: String(raw.tipo ?? 'Despesa Mensal'),
                ultimoProcessamento,
                ativo,
                imediata,
                userDomainId
            };
            if (contaPoupancaIdForUpdate !== null) updateSet['contaPoupancaId'] = contaPoupancaIdForUpdate;

            await this.repo.createQueryBuilder()
                .update(DespesaRecorrenteEntity)
                .set(updateSet)
                .where('domain_id = :domainId', { domainId })
                .execute();

            const saved = await this.repo.findOne({
                where: { domainId },
                relations: ['categoria', 'contaOrigem', 'contaDestino', 'contaPoupanca']
            });
            if (!saved) return Promise.reject(new Error('Failed to find updated recurring expense'));

            const savedEntity2 = saved as DespesaRecorrenteEntity;
            const savedRaw: Record<string, unknown> = { ...(saved as unknown as Record<string, unknown>), user_domain_id: savedEntity2.userDomainId };

            const domain = await DespesaRecorrenteMap.toDomain(savedRaw);
            if (!domain) {
                this.logger.error('DespesaRecorrenteRepo.update - DespesaRecorrenteMap.toDomain returned null');
                return Promise.reject(new Error('Failed to map updated recurring expense to domain'));
            }
            return domain;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.update error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a recurring expense by domainId only if it is not soft-deleted. A paused rule (ativo = false) is still found.
     * Used by the manual generation of transações, so a deleted rule cannot produce new movimentos.
     * @param despesaId - The domainId of the DespesaRecorrente.
     */
    public async findActiveById(despesaId: string): Promise<DespesaRecorrente | null> {
        const ativa = await this.repo.count({ where: { domainId: despesaId, isActive: true } });
        return ativa > 0 ? this.findById(despesaId) : null;
    }

    /**
     * Counts the active (not soft-deleted) recurring expenses whose origin, destination or savings account is the given Conta.
     * Paused rules (ativo = false) still count: they still reference the Conta.
     * @param contaDomainId - The domainId of the Conta.
     */
    public async countActiveByConta(contaDomainId: string): Promise<number> {
        try {
            return await this.repo.count({ where: this.activeByContaWhere(contaDomainId) });
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.countActiveByConta error: %o', err);
            throw err;
        }
    }

    /**
     * Soft-deletes (is_active = false) the active recurring expenses that reference the given Conta. Used when cascading.
     * @param contaDomainId - The domainId of the Conta.
     */
    public async deactivateByConta(contaDomainId: string): Promise<void> {
        try {
            const rows = await this.repo.find({ select: ['id'], where: this.activeByContaWhere(contaDomainId) });
            if (rows.length > 0) await this.repo.update({ id: In(rows.map(r => r.id)) }, { isActive: false });
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.deactivateByConta error: %o', err);
            throw err;
        }
    }

    /**
     * Delete a recurring expense by domain ID (soft: is_active = false). `ativo` is left untouched, so a deleted
     * rule is never confused with a paused one.
     */
    public async delete(despesaId: string): Promise<void> {
        try {
            await this.repo.update({ domainId: despesaId }, { isActive: false });
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.delete error: %o', err);
            throw err;
        }
    }

    private activeByContaWhere(contaDomainId: string) {
        return [
            { contaOrigem: { domainId: contaDomainId }, isActive: true },
            { contaDestino: { domainId: contaDomainId }, isActive: true },
            { contaPoupanca: { domainId: contaDomainId }, isActive: true }
        ];
    }

    /**
     * Find a recurring expense by domain ID
     */
    public async findById(despesaId: string): Promise<DespesaRecorrente | null> {
        try {
            const row = await this.repo.findOne({
                where: { domainId: despesaId },
                relations: ['categoria', 'contaOrigem', 'contaDestino', 'contaPoupanca']
            });
            if (!row) return null;

            const rowEntity = row as DespesaRecorrenteEntity;
            const raw: Record<string, unknown> = { ...(row as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };

            const domain = await DespesaRecorrenteMap.toDomain(raw);
            if (!domain) {
                this.logger.error('DespesaRecorrenteRepo.findById - DespesaRecorrenteMap.toDomain returned null');
                return null;
            }
            return domain;
        } catch (err) {
            this.logger.error('DespesaRecorrenteRepo.findById error: %o', err);
            throw err;
        }
    }
}
