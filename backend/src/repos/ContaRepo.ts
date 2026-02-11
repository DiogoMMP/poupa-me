import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type IContaRepo from './IRepos/IContaRepo.js';
import { ContaMap } from '../mappers/ContaMap.js';
import { ContaEntity } from '../persistence/entities/ContaEntity.js';
import { Conta } from '../domain/Conta/Entities/Conta.js';
import { ContaIdHelper, extractSequenceNumber } from '../utils/IDGenerator.js';

/**
 * Repository implementation for Conta using TypeORM. Handles all database interactions for Conta entities.
 */
@Service()
export default class ContaRepo implements IContaRepo {
    private repo: Repository<ContaEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(ContaEntity);
    }

    /**
     * Saves a new Conta to the database. Converts the domain object to a persistence format, creates an entity, and saves it.
     * @param conta The Conta domain object to save.
     * @returns The saved Conta domain object with updated information from the database.
     */
    public async save(conta: Conta): Promise<Conta> {
        try {
            const raw = ContaMap.toPersistence(conta) as {
                domainId?: string;
                nome?: string;
                icon?: string;
                saldo?: { valor?: number; moeda?: string } | number;
                user_domain_id?: string;
                userDomainId?: string;
            };

            let domainId = String(raw.domainId ?? '');

            // Always generate sequential domain ID (override UUID from domain entity)
            const allContas = await this.repo.find({ select: ['domainId'], order: { id: 'DESC' }, take: 100 });
            let maxSeq = 0;
            for (const c of allContas) {
                const seq = extractSequenceNumber(c.domainId, ContaIdHelper.prefix);
                if (seq !== null && seq > maxSeq) maxSeq = seq;
            }
            domainId = maxSeq === 0 ? ContaIdHelper.generateFirst() : ContaIdHelper.generateNext(maxSeq);

            const nome = String(raw.nome ?? '');
            const icon = String(raw.icon ?? '');
            const userDomainId = String(raw.user_domain_id ?? raw.userDomainId ?? '');

            const saldoVal = typeof raw.saldo === 'number'
                ? Number(raw.saldo)
                : Number((raw.saldo && (raw.saldo as { valor?: number }).valor) ?? 0);
            const moedaVal = typeof raw.saldo === 'object' && raw.saldo ? (raw.saldo as { moeda?: string }).moeda ?? 'EUR' : 'EUR';

            const entityObj: Record<string, unknown> = {
                domainId,
                nome,
                icon,
                saldo: saldoVal,
                moeda: moedaVal,
                userDomainId
            };

            // Check for existing account with same name (global uniqueness in DB)
            if (nome) {
                const existingByName = await this.repo.createQueryBuilder('c')
                    .where('LOWER(c.nome) = LOWER(:nome)', { nome })
                    .getOne();

                if (existingByName) {
                    // If the existing by-name belongs to the same user, update and return it
                    if (existingByName.userDomainId === userDomainId) {
                        await this.repo.createQueryBuilder()
                            .update(ContaEntity)
                            .set({
                                nome,
                                icon,
                                saldo: saldoVal,
                                moeda: moedaVal,
                                userDomainId
                            })
                            .where('id = :id', { id: existingByName.id })
                            .execute();

                        const savedRow = await this.repo.findOne({ where: { id: existingByName.id } });
                        if (!savedRow) throw new Error('Failed to find updated conta after duplicate-name update');
                        const savedRaw: Record<string, unknown> = { ...(savedRow as unknown as Record<string, unknown>), user_domain_id: (savedRow as ContaEntity).userDomainId };
                        const domain = await ContaMap.toDomain(savedRaw);
                        if (!domain) throw new Error('Failed to map updated conta to domain');
                        return domain;
                    }

                    // Name already taken by another user -> conflict
                    throw new Error('Conta nome already in use');
                }
            }

            const entity = this.repo.create(entityObj as unknown as ContaEntity);
            const saved = await this.repo.save(entity);
            if (!saved) throw new Error('Failed to save conta');

            const savedRaw: Record<string, unknown> = { ...(saved as unknown as Record<string, unknown>), user_domain_id: (saved as ContaEntity).userDomainId };
            const domain = await ContaMap.toDomain(savedRaw);
            if (!domain) throw new Error('Failed to map saved conta to domain');
            return domain;
        } catch (err) {
            this.logger.error('ContaRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Updates an existing Conta in the database. Uses the domainId to find the record and updates the fields accordingly.
     * @param conta The Conta domain object with updated information. Must include the domainId to identify which record to update.
     * @returns The updated Conta domain object after saving the changes to the database.
     */
    public async update(conta: Conta): Promise<Conta> {
        try {
            const raw = ContaMap.toPersistence(conta) as {
                domainId?: string;
                nome?: string;
                icon?: string;
                saldo?: { valor?: number; moeda?: string } | number;
                user_domain_id?: string;
                userDomainId?: string;
            };

            const domainId = String(raw.domainId ?? '');
            if (!domainId) throw new Error('Conta missing domainId for update');

            const nomeVal = String(raw.nome ?? '');
            const iconVal = String(raw.icon ?? '');
            const saldoVal2 = typeof raw.saldo === 'number' ? Number(raw.saldo) : Number((raw.saldo && (raw.saldo as { valor?: number }).valor) ?? 0);
            const moedaVal2 = typeof raw.saldo === 'object' && raw.saldo ? (raw.saldo as { moeda?: string }).moeda ?? 'EUR' : 'EUR';
            const userDomainIdVal = String(raw.user_domain_id ?? raw.userDomainId ?? '');

            await this.repo.createQueryBuilder()
                .update(ContaEntity)
                .set({
                    nome: nomeVal,
                    icon: iconVal,
                    saldo: saldoVal2,
                    moeda: moedaVal2,
                    userDomainId: userDomainIdVal
                })
                .where('domain_id = :domainId', { domainId })
                .execute();

            const saved = await this.repo.findOne({ where: { domainId } });
            if (!saved) throw new Error('Failed to find updated conta by domainId');

            const savedRaw2: Record<string, unknown> = { ...(saved as unknown as Record<string, unknown>), user_domain_id: (saved as ContaEntity).userDomainId };
            const domain2 = await ContaMap.toDomain(savedRaw2);
            if (!domain2) throw new Error('Failed to map updated conta to domain');
            return domain2;
        } catch (err) {
            this.logger.error('ContaRepo.update error: %o', err);
            throw err;
        }
    }

    /**
     * Deletes a Conta from the database using its domainId. Executes a delete query and removes the record permanently.
     * @param contaId The domainId of the Conta to delete.
     */
    public async delete(contaId: string): Promise<void> {
        try {
            await this.repo.createQueryBuilder()
                .delete()
                .from(ContaEntity)
                .where('domain_id = :domainId', { domainId: contaId })
                .execute();
        } catch (err) {
            this.logger.error('ContaRepo.delete error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a Conta by its domainId. Executes a query to retrieve the record and maps it back to the domain object.
     * @param contaId The domainId of the Conta to find.
     * @returns The found Conta domain object, or null if not found.
     */
    public async findById(contaId: string): Promise<Conta | null> {
        try {
            const row = await this.repo.findOne({ where: { domainId: contaId } });
            if (!row) return null;
            const rowEntity = row as ContaEntity;
            const raw: Record<string, unknown> = { ...(row as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
            return await ContaMap.toDomain(raw);
        } catch (err) {
            this.logger.error('ContaRepo.findById error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Conta records, optionally filtering by user domain ID. Executes a query to retrieve the records and maps them back to domain objects.
     * @param userId Optional user domain ID to filter the Conta records. If provided, only Conta records associated with this user will be returned.
     * @returns An array of Conta domain objects matching the criteria.
     */
    public async findAll(userId?: string): Promise<Conta[]> {
        try {
            let rows: ContaEntity[];
            if (userId) {
                rows = await this.repo.createQueryBuilder('c')
                    .where('c.user_domain_id = :userId', { userId })
                    .orderBy('c.id', 'ASC')
                    .getMany();
            } else {
                rows = await this.repo.find({ order: { id: 'ASC' } });
            }

            const res: Conta[] = [];
            for (const r of rows) {
                const rowEntity = r as ContaEntity;
                const raw: Record<string, unknown> = { ...(r as unknown as Record<string, unknown>), user_domain_id: rowEntity.userDomainId };
                const d = await ContaMap.toDomain(raw);
                if (d) res.push(d);
            }
            return res;
        } catch (err) {
            this.logger.error('ContaRepo.findAll error: %o', err);
            throw err;
        }
    }
}
