import type { Result } from '../../../core/logic/Result.js';
import type { IGerarTransacaoSemValorDTO } from '../../../dto/IDespesaRecorrenteDTO.js';
import type { ITransacaoDTO } from '../../../dto/ITransacaoDTO.js';

/**
 * Service interface for DespesaRecorrente processor logic
 */
export default interface IDespesaRecorrenteProcessadorService {
    processarRecorrencias(userId: string): Promise<Result<void>>;
    gerarTransacaoSemValor(despesaId: string, dto: IGerarTransacaoSemValorDTO, userId: string): Promise<Result<ITransacaoDTO>>;
}
