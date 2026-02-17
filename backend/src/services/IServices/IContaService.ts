import type { Result } from '../../core/logic/Result.js';
import type { IContaDTO, IContaInputDTO, IContaUpdateDTO } from '../../dto/IContaDTO.js';

export default interface IContaService {
    createConta(inputDTO: IContaInputDTO): Promise<Result<IContaDTO>>;
    updateConta(id: string, inputDTO: IContaUpdateDTO): Promise<Result<IContaDTO>>;
    deleteConta(id: string): Promise<Result<boolean>>;
    findContaById(id: string): Promise<Result<IContaDTO>>;
    findAllContas(userId?: string, bancoId?: string): Promise<Result<IContaDTO[]>>;
}
