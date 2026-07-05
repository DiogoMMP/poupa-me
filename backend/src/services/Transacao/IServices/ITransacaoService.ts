import { Result } from '../../../core/logic/Result.js';
import type {
    ITransacaoDTO,
    ITransacaoInputDTO,
    ITransacaoReembolsoDTO,
    ITransacaoUpdateDTO
} from '../../../dto/ITransacaoDTO.js';
import type { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';

/**
 * Service interface for core Transacao operations: create, update, delete, findById, and balance impact helpers.
 */
export default interface ITransacaoService {

    // --- Create ---
    createEntrada(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;
    createSaida(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;
    createCredito(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>>;
    createReembolso(inputDTO: ITransacaoReembolsoDTO): Promise<Result<ITransacaoDTO>>;

    // --- Update & Delete ---
    updateTransacao(id: string, updateDTO: ITransacaoUpdateDTO): Promise<Result<ITransacaoDTO>>;
    deleteTransacao(id: string): Promise<Result<boolean>>;
    findTransacaoById(id: string): Promise<Result<ITransacaoDTO>>;

    // --- Balance impact helpers (used internally by update/delete and by other services) ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    revertEntradaSaidaImpact(transacao: Transacao): Promise<Result<void>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    revertCreditoImpact(transacao: Transacao): Promise<Result<void>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    revertReembolsoImpact(transacao: Transacao): Promise<Result<void>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyEntradaSaidaImpact(transacao: Transacao): Promise<Result<void>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyCreditoImpact(transacao: Transacao): Promise<Result<void>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyReembolsoImpact(transacao: Transacao): Promise<Result<void>>;
}
