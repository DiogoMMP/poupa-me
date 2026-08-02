import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type ITransacaoContaQueryService from './IServices/ITransacaoContaQueryService.js';
import type ITransacaoContaQueryRepo from '../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';
import type { ITransacaoContaQueryFilters } from '../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';
import type IUserRepo from '../../repos/User/IUserRepo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import type { Transacao } from '../../domain/Transacao/Entities/Transacao.js';

/**
 * Service responsible for Conta-based transaction queries (Entrada/Saída).
 */
@Service()
export default class TransacaoContaQueryService implements ITransacaoContaQueryService {
    constructor(
        @Inject('TransacaoContaQueryRepo') private transacaoContaQueryRepo: ITransacaoContaQueryRepo,
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
     * Finds Entrada/Saída transactions with optional filters.
     * Filters: userId, bancoId, contaId, categoriaId, period.
     */
    public async findAllContaTransactions(filters?: ITransacaoContaQueryFilters): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findAllContaTransactions(filters);
            const dtos = await this.enrichTransactionsWithUserName(rows);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findAllContaTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions');
        }
    }

    /**
     * Finds ALL transactions for a specific banco (conta + cartão). Returns 5 most recent.
     */
    public async findAllByBanco(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoContaQueryRepo.findAllByBanco(bancoId, userId);
            const dtos = await this.enrichTransactionsWithUserName(rows);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoContaQueryService.findAllByBanco error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions for banco');
        }
    }
}
