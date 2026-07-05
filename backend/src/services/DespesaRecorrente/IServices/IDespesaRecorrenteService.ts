import type { Result } from '../../../core/logic/Result.js';
import type { IDespesaRecorrenteDTO, ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO } from '../../../dto/IDespesaRecorrenteDTO.js';

/**
 * Service interface for DespesaRecorrente CRUD operations
 */
export default interface IDespesaRecorrenteService {
    createDespesa(dto: ICreateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>>;
    updateDespesa(despesaId: string, dto: IUpdateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>>;
    deleteDespesa(despesaId: string, userId: string): Promise<Result<void>>;
    getDespesa(despesaId: string, userId: string): Promise<Result<IDespesaRecorrenteDTO>>;
    getAllDespesas(userId: string, bancoId?: string): Promise<Result<IDespesaRecorrenteDTO[]>>;
    getDespesasComValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>>;
    getDespesasSemValorByTipo(userId: string, tipo: string, bancoId?: string): Promise<Result<IDespesaRecorrenteDTO[]>>;
    getDespesasSemValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>>;
}
