import type { Result } from '../../core/logic/Result.js';
import type { IContaDTO, IContaInputDTO } from '../../dto/IContaDTO.js';

export default interface IContaService {
    createConta(inputDTO: IContaInputDTO): Promise<Result<IContaDTO>>;
    updateConta(id: string, inputDTO: Partial<IContaInputDTO>): Promise<Result<IContaDTO>>;
    deleteConta(id: string): Promise<Result<boolean>>;
    findContaById(id: string): Promise<Result<IContaDTO>>;
    findAllContas(userId?: string): Promise<Result<IContaDTO[]>>;
}

