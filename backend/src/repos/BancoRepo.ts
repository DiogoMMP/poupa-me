import { Service, Inject } from 'typedi';
import type { DataSource, Repository } from 'typeorm';
import type IBancoRepo from './IRepos/IBancoRepo.js';
import { BancoEntity } from '../persistence/entities/BancoEntity.js';
import { BancoMap } from '../mappers/BancoMap.js';
import { Banco } from '../domain/Banco/Entities/Banco.js';
import { BancoIdHelper, extractSequenceNumber } from '../utils/IDGenerator.js';

/**
 * Repository for managing Banco entities in the database using TypeORM.
 */
@Service()
export default class BancoRepo implements IBancoRepo {
    private repo: Repository<BancoEntity>;

    constructor(
        @Inject('dataSource') private dataSource: DataSource,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
        this.repo = this.dataSource.getRepository(BancoEntity);
    }

    /**
     * Saves a new Banco to the database
     */
    public async save(banco: Banco): Promise<Banco> {
        try {
            const raw = BancoMap.toPersistence(banco);

            // Generate sequential domain ID
            const allBancos = await this.repo.find({ select: ['domainId'], order: { id: 'DESC' }, take: 100 });
            let maxSeq = 0;
            for (const b of allBancos) {
                const seq = extractSequenceNumber(b.domainId, 'BNC');
                if (seq !== null && seq > maxSeq) maxSeq = seq;
            }
            const domainId = maxSeq === 0 ? BancoIdHelper.generateFirst() : BancoIdHelper.generateNext(maxSeq);

            const entity = this.repo.create({
                domainId,
                nome: String(raw.nome),
                icon: String(raw.icon),
                userDomainId: String(raw.user_domain_id)
            });

            const saved = await this.repo.save(entity);
            const domain = await BancoMap.toDomain(saved);
            if (!domain) throw new Error('Failed to map saved banco to domain');

            return domain;
        } catch (err) {
            this.logger.error('BancoRepo.save error: %o', err);
            throw err;
        }
    }

    /**
     * Updates an existing Banco
     */
    public async update(banco: Banco): Promise<Banco> {
        try {
            const raw = BancoMap.toPersistence(banco);

            await this.repo.createQueryBuilder()
                .update(BancoEntity)
                .set({
                    nome: String(raw.nome),
                    icon: String(raw.icon)
                })
                .where('domain_id = :domainId', { domainId: raw.domainId })
                .execute();

            const updated = await this.repo.findOne({ where: { domainId: String(raw.domainId) } });
            if (!updated) throw new Error('Failed to find updated banco');

            const domain = await BancoMap.toDomain(updated);
            if (!domain) throw new Error('Failed to map updated banco to domain');

            return domain;
        } catch (err) {
            this.logger.error('BancoRepo.update error: %o', err);
            throw err;
        }
    }

    /**
     * Deletes a Banco by domain ID
     */
    public async delete(bancoId: string): Promise<void> {
        try {
            await this.repo.delete({ domainId: bancoId });
        } catch (err) {
            this.logger.error('BancoRepo.delete error: %o', err);
            throw err;
        }
    }

    /**
     * Finds a Banco by domain ID
     */
    public async findById(bancoId: string): Promise<Banco | null> {
        try {
            const entity = await this.repo.findOne({ where: { domainId: bancoId } });
            if (!entity) return null;

            return await BancoMap.toDomain(entity);
        } catch (err) {
            this.logger.error('BancoRepo.findById error: %o', err);
            throw err;
        }
    }

    /**
     * Finds all Bancos, optionally filtered by user
     */
    public async findAll(userId?: string): Promise<Banco[]> {
        try {
            const query = this.repo.createQueryBuilder('banco');

            if (userId) {
                query.where('banco.user_domain_id = :userId', { userId });
            }

            const entities = await query.orderBy('banco.id', 'DESC').getMany();

            const bancos: Banco[] = [];
            for (const entity of entities) {
                const domain = await BancoMap.toDomain(entity);
                if (domain) bancos.push(domain);
            }

            return bancos;
        } catch (err) {
            this.logger.error('BancoRepo.findAll error: %o', err);
            throw err;
        }
    }
}

