import type { ICartaoCreditoDTO, ICartaoCreditoInputDTO, ICartaoCreditoUpdateDTO } from '../../dto/ICartaoCreditoDTO.js';
import type {Result} from "../../core/logic/Result.js";

export default interface ICartaoCreditoService {
    createCartao(inputDTO: ICartaoCreditoInputDTO): Promise<Result<ICartaoCreditoDTO>>;
    updateCartao(id: string, inputDTO: ICartaoCreditoUpdateDTO): Promise<Result<ICartaoCreditoDTO>>;
    deleteCartao(id: string): Promise<Result<boolean>>;
    findCartaoById(id: string): Promise<Result<ICartaoCreditoDTO>>;
    findAllCartoes(userId?: string): Promise<Result<ICartaoCreditoDTO[]>>;
}
