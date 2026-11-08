import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type { IPaginatedDTO, IPaginationParams } from '../../dto/shared/IPaginatedDTO.js';
import { toPaginated } from '../../core/logic/Pagination.js';
import type ITransacaoCartaoQueryService from './IServices/ITransacaoCartaoQueryService.js';
import type ITransacaoCartaoQueryRepo from '../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';
import type { ITransacaoCartaoQueryFilters } from '../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';
import type IUserRepo from '../../repos/User/IUserRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import type { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Service responsible for Cartão-based transaction queries (Crédito/Reembolso).
 */
@Service()
export default class TransacaoCartaoQueryService implements ITransacaoCartaoQueryService {
    constructor(
        @Inject('TransacaoCartaoQueryRepo') private transacaoCartaoQueryRepo: ITransacaoCartaoQueryRepo,
        @Inject('UserRepo') private userRepo: IUserRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    private async getUserNome(userId?: string): Promise<string | undefined> {
        if (!userId) return undefined;
        try {
            const user = await this.userRepo.findByDomainId(userId);
            return user?.name.value;
        } catch {
            return undefined;
        }
    }

    private async enrichTransactionsWithUserName(rows: Transacao[]): Promise<ITransacaoDTO[]> {
        const userNameCache = new Map<string, string | undefined>();
        return await Promise.all(rows.map(async (r) => {
            const uid = (r as unknown as { userDomainId?: string }).userDomainId;
            if (uid && !userNameCache.has(uid)) {
                userNameCache.set(uid, await this.getUserNome(uid));
            }
            return TransacaoMap.toDTO(r, uid ? userNameCache.get(uid) : undefined);
        }));
    }

    /**
     * Finds one page of Crédito/Reembolso transactions with optional filters.
     * Filters: userId, bancoId, cartaoCreditoId, categoriaId, status, period.
     */
    public async findAllCartaoTransactions(filters: ITransacaoCartaoQueryFilters, pagination: IPaginationParams): Promise<Result<IPaginatedDTO<ITransacaoDTO>>> {
        try {
            const { items, total } = await this.transacaoCartaoQueryRepo.findCartaoTransactionsPage(filters, pagination);
            const dtos = await this.enrichTransactionsWithUserName(items);
            return Result.ok<IPaginatedDTO<ITransacaoDTO>>(toPaginated(dtos, total, pagination));
        } catch (e) {
            this.logger.error('TransacaoCartaoQueryService.findAllCartaoTransactions error: %o', e);
            return Result.fail<IPaginatedDTO<ITransacaoDTO>>('Error fetching cartão transactions');
        }
    }
}
