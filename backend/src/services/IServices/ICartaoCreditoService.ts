import type {
    ICartaoCreditoDTO,
    ICartaoCreditoInputDTO,
    ICartaoCreditoUpdateDTO,
    IPeriodoProps
} from '../../dto/ICartaoCreditoDTO.js';
import type {Result} from "../../core/logic/Result.js";
import type {IDinheiroProps, ITransacaoDTO} from "../../dto/ITransacaoDTO.js";

export default interface ICartaoCreditoService {
    createCartao(inputDTO: ICartaoCreditoInputDTO): Promise<Result<ICartaoCreditoDTO>>;
    updateCartao(id: string, inputDTO: ICartaoCreditoUpdateDTO): Promise<Result<ICartaoCreditoDTO>>;
    deleteCartao(id: string): Promise<Result<boolean>>;
    findCartaoById(id: string): Promise<Result<ICartaoCreditoDTO>>;
    findAllCartoes(userId?: string, bancoId?: string): Promise<Result<ICartaoCreditoDTO[]>>;
    getExtrato(cartaoCreditoId: string, userId?: string): Promise<Result<{ transacoes: ITransacaoDTO[], saldoAtual: IDinheiroProps }>>;
    pagarCartao(cartaoCreditoId: string, userId: string, novoPeriodo: IPeriodoProps): Promise<Result<ITransacaoDTO>>;
}
