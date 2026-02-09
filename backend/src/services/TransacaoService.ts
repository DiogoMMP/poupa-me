import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
type DomainWithUser = { userDomainId?: string };
import type {
    ITransacaoDTO,
    ITransacaoInputDTO,
    ITransacaoReembolsoDTO,
    ITransacaoUpdateDTO,
    IData
} from '../dto/ITransacaoDTO.js';
import type ITransacaoRepo from '../repos/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../domain/Transacao/ValueObjects/Data.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Tipo } from '../domain/Transacao/ValueObjects/Tipo.js';
import { Status } from '../domain/Transacao/ValueObjects/Status.js';
import { Reembolso } from '../domain/Transacao/ValueObjects/Reembolso.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { TransacaoMap } from '../mappers/TransacaoMap.js';

/**
 * Service class for handling operations related to `Transacao` (Transaction) entities.
 */
@Service()
export default class TransacaoService {
    constructor(
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Helper method to build common Result objects for Descricao, Data, and Dinheiro from the input DTO.
     * @param input - The input DTO containing the raw data for the transaction.
     * @private
     */
    private buildCommonResultsFromInput(input: ITransacaoInputDTO) {
        const descricaoResult = Descricao.create(input.descricao ?? '');
        const dataResult = Data.createFromParts(input.data.dia, input.data.mes, input.data.ano);
        const dinheiroResult = Dinheiro.create(Number(input.valor.valor), String(input.valor.moeda ?? 'EUR'));
        return { descricaoResult, dataResult, dinheiroResult };
    }

    /**
     * Creates and persists an Income transaction (Entrada) based on the provided input DTO.
     * @param inputDTO
     */
    public async createEntrada(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            if (!inputDTO) return Result.fail<ITransacaoDTO>('No transaction data provided');

            const { descricaoResult, dataResult, dinheiroResult } = this.buildCommonResultsFromInput(inputDTO);

            // resolve categoria
            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Categoria not found');

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(combine.errorValue() as unknown as string);

            const transacaoOrError = Transacao.createEntrada(
                {
                    descricao: descricaoResult.getValue(),
                    data: dataResult.getValue(),
                    valor: dinheiroResult.getValue(),
                    categoria: categoria
                }
            );

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(transacaoOrError.errorValue() as unknown as string);

            // Ensure the domain-level object carries the userDomainId for persistence mapping
            (transacaoOrError.getValue() as unknown as DomainWithUser).userDomainId = inputDTO.userId;
            const saved = await this.transacaoRepo.save(transacaoOrError.getValue());
            const dto = TransacaoMap.toDTO(saved) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.createEntrada error: %o', e);
            const message = e instanceof Error ? e.message : 'Error creating transaction';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Creates and persists an Expense transaction (Saída) based on the provided input DTO.
     * @param inputDTO - The input data for creating a Saída transaction.
     */
    public async createSaida(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            if (!inputDTO) return Result.fail<ITransacaoDTO>('No transaction data provided');

            const { descricaoResult, dataResult, dinheiroResult } = this.buildCommonResultsFromInput(inputDTO);

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Categoria not found');

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(combine.errorValue() as unknown as string);

            const transacaoOrError = Transacao.createSaida(
                {
                    descricao: descricaoResult.getValue(),
                    data: dataResult.getValue(),
                    valor: dinheiroResult.getValue(),
                    categoria: categoria
                }
            );

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(transacaoOrError.errorValue() as unknown as string);

            (transacaoOrError.getValue() as unknown as DomainWithUser).userDomainId = inputDTO.userId;
            const saved = await this.transacaoRepo.save(transacaoOrError.getValue());
            const dto = TransacaoMap.toDTO(saved) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.createSaida error: %o', e);
            const message = e instanceof Error ? e.message : 'Error creating transaction';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Creates and persists a Refund transaction linked to an original transaction based on the provided input DTO.
     * @param inputDTO - The input data including the original transaction id (reembolso) to link.
     */
    public async createReembolso(inputDTO: ITransacaoReembolsoDTO): Promise<Result<ITransacaoDTO>> {
        try {
            if (!inputDTO) return Result.fail<ITransacaoDTO>('No transaction data provided');

            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            // ensure original transaction exists
            const original = await this.transacaoRepo.findById(inputDTO.reembolso);
            if (!original) return Result.fail<ITransacaoDTO>('Original transaction for reembolso not found');

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Categoria not found');

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(combine.errorValue() as unknown as string);

            const transacaoOrError = Transacao.createReembolso(
                {
                    descricao: descricaoResult.getValue(),
                    data: dataResult.getValue(),
                    valor: dinheiroResult.getValue(),
                    categoria: categoria
                },
                new UniqueEntityID(inputDTO.reembolso)
            );

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(transacaoOrError.errorValue() as unknown as string);

            (transacaoOrError.getValue() as unknown as DomainWithUser).userDomainId = inputDTO.userId;
            const saved = await this.transacaoRepo.save(transacaoOrError.getValue());
            const dto = TransacaoMap.toDTO(saved) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.createReembolso error: %o', e);
            const message = e instanceof Error ? e.message : 'Error creating reembolso';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Creates and persists a Credit transaction (Crédito) based on the provided input DTO.
     * @param inputDTO - The input data for creating a Crédito transaction.
     */
    public async createCredito(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            if (!inputDTO) return Result.fail<ITransacaoDTO>('No transaction data provided');

            const { descricaoResult, dataResult, dinheiroResult } = this.buildCommonResultsFromInput(inputDTO);

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Categoria not found');

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(combine.errorValue() as unknown as string);

            const transacaoOrError = Transacao.createCredito(
                {
                    descricao: descricaoResult.getValue(),
                    data: dataResult.getValue(),
                    valor: dinheiroResult.getValue(),
                    categoria: categoria
                }
            );

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(transacaoOrError.errorValue() as unknown as string);

            (transacaoOrError.getValue() as unknown as DomainWithUser).userDomainId = inputDTO.userId;
            const saved = await this.transacaoRepo.save(transacaoOrError.getValue());
            const dto = TransacaoMap.toDTO(saved) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.createCredito error: %o', e);
            const message = e instanceof Error ? e.message : 'Error creating transaction';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Creates and persists a Monthly Expense transaction (Despesa Mensal) based on the provided input DTO.
     * @param inputDTO - The input data for creating a Despesa Mensal transaction.
     */
    public async createDespesaMensal(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            if (!inputDTO) return Result.fail<ITransacaoDTO>('No transaction data provided');

            const { descricaoResult, dataResult, dinheiroResult } = this.buildCommonResultsFromInput(inputDTO);

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Categoria not found');

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(combine.errorValue() as unknown as string);

            const transacaoOrError = Transacao.createDespesaMensal(
                {
                    descricao: descricaoResult.getValue(),
                    data: dataResult.getValue(),
                    valor: dinheiroResult.getValue(),
                    categoria: categoria
                }
            );

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(transacaoOrError.errorValue() as unknown as string);

            (transacaoOrError.getValue() as unknown as DomainWithUser).userDomainId = inputDTO.userId;
            const saved = await this.transacaoRepo.save(transacaoOrError.getValue());
            const dto = TransacaoMap.toDTO(saved) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.createDespesaMensal error: %o', e);
            const message = e instanceof Error ? e.message : 'Error creating transaction';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Updates an existing Transacao identified by its domain id with the provided update DTO.
     * @param id - The domain id of the transaction to update.
     * @param updateDTO - Partial properties to update on the transaction.
     */
    public async updateTransacao(id: string, updateDTO: ITransacaoUpdateDTO): Promise<Result<ITransacaoDTO>> {
        try {
            if (!id) return Result.fail<ITransacaoDTO>('ID is required');

            const existing = await this.transacaoRepo.findById(id);
            if (!existing) return Result.fail<ITransacaoDTO>(`Transaction not found with id=${id}`);

            // Build new values, using existing when update fields are not provided
            const descricaoResult = updateDTO.descricao ? Descricao.create(updateDTO.descricao) : Result.ok(existing.descricao);
            const dataResult = updateDTO.data ? Data.createFromParts(updateDTO.data.dia, updateDTO.data.mes, updateDTO.data.ano) : Result.ok(existing.data);
            const dinheiroResult = updateDTO.valor ? Dinheiro.create(Number(updateDTO.valor.valor), String(updateDTO.valor.moeda ?? 'EUR')) : Result.ok(existing.valor);
            const tipoResult = updateDTO.tipo ? Tipo.create(updateDTO.tipo) : Result.ok(existing.tipo);
            const statusResult = updateDTO.status ? Status.create(updateDTO.status) : Result.ok(existing.status);

            let categoriaDomain = existing.categoria;
            if (updateDTO.categoriaId) {
                const c = await this.categoriaRepo.findById(updateDTO.categoriaId);
                if (!c) return Result.fail<ITransacaoDTO>('Categoria not found');
                categoriaDomain = c;
            }

            let reembolsoResult: Result<Reembolso> | undefined;
            if (updateDTO.reembolso) {
                reembolsoResult = Reembolso.create(new UniqueEntityID(updateDTO.reembolso));
            }

            const combineList: Result<unknown>[] = [descricaoResult, dataResult, dinheiroResult, tipoResult, statusResult];
            if (reembolsoResult) combineList.push(reembolsoResult);

            const combine = Result.combine(combineList);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(combine.errorValue() as unknown as string);

            const updatedOrError = Transacao.create(
                {
                    descricao: descricaoResult.getValue(),
                    data: dataResult.getValue(),
                    valor: dinheiroResult.getValue(),
                    tipo: tipoResult.getValue(),
                    categoria: categoriaDomain,
                    status: statusResult.getValue(),
                    reembolso: reembolsoResult ? (reembolsoResult as Result<Reembolso>).getValue() : existing.reembolso
                },
                existing.id
            );

            if (updatedOrError.isFailure) return Result.fail<ITransacaoDTO>(updatedOrError.errorValue() as unknown as string);

            // preserve userDomainId from existing entity when updating
            (updatedOrError.getValue() as unknown as DomainWithUser).userDomainId = (existing as unknown as DomainWithUser).userDomainId;
            const saved = await this.transacaoRepo.update(updatedOrError.getValue());
            const dto = TransacaoMap.toDTO(saved) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.updateTransacao error: %o', e);
            const message = e instanceof Error ? e.message : 'Error updating transaction';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Deletes a Transacao by its domain id.
     * @param id - Domain id of the transaction to delete.
     */
    public async deleteTransacao(id: string): Promise<Result<boolean>> {
        try {
            if (!id) return Result.fail<boolean>('ID is required');
            const existing = await this.transacaoRepo.findById(id);
            if (!existing) return Result.fail<boolean>(`Transaction not found with id=${id}`);
            await this.transacaoRepo.delete(id);
            return Result.ok<boolean>(true);
        } catch (e) {
            this.logger.error('TransacaoService.deleteTransacao error: %o', e);
            const message = e instanceof Error ? e.message : 'Error deleting transaction';
            return Result.fail<boolean>(message);
        }
    }

    /**
     * Finds a Transacao by its domain id.
     * @param id - Domain id to look up.
     */
    public async findTransacaoById(id: string): Promise<Result<ITransacaoDTO>> {
        try {
            if (!id) return Result.fail<ITransacaoDTO>('ID is required');
            const t = await this.transacaoRepo.findById(id);
            if (!t) return Result.fail<ITransacaoDTO>(`Transaction not found with id=${id}`);
            const dto = TransacaoMap.toDTO(t) as ITransacaoDTO;
            return Result.ok<ITransacaoDTO>(dto);
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoById error: %o', e);
            const message = e instanceof Error ? e.message : 'Error finding transaction by id';
            return Result.fail<ITransacaoDTO>(message);
        }
    }

    /**
     * Finds transactions belonging to a specific category (by category domain id).
     * @param categoriaId - Category domain id used to filter transactions.
     */
    public async findTransacaoByCategoria(categoriaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            if (!categoriaId) return Result.fail<ITransacaoDTO[]>('Categoria ID is required');
            const rows = await this.transacaoRepo.findByCategoria(categoriaId, userId);
            const dtos = rows.map(r => TransacaoMap.toDTO(r) as ITransacaoDTO);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByCategoria error: %o', e);
            const message = e instanceof Error ? e.message : 'Error finding transactions by categoria';
            return Result.fail<ITransacaoDTO[]>(message);
        }
    }

    /**
     * Finds transactions by tipo (e.g., "Entrada", "Saída", "Crédito").
     * @param tipo - The tipo value used to filter transactions.
     */
    public async findTransacaoByTipo(tipo: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            if (!tipo) return Result.fail<ITransacaoDTO[]>('Tipo is required');
            const rows = await this.transacaoRepo.findByTipo(tipo, userId);
            const dtos = rows.map(r => TransacaoMap.toDTO(r) as ITransacaoDTO);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByTipo error: %o', e);
            const message = e instanceof Error ? e.message : 'Error finding transactions by tipo';
            return Result.fail<ITransacaoDTO[]>(message);
        }
    }

    /**
     * Finds transactions by status (e.g., "Pendente", "Concluído").
     * @param status - The status value used to filter transactions.
     */
    public async findTransacaoByStatus(status: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            if (!status) return Result.fail<ITransacaoDTO[]>('Status is required');
            const rows = await this.transacaoRepo.findByStatus(status, userId);
            const dtos = rows.map(r => TransacaoMap.toDTO(r) as ITransacaoDTO);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByStatus error: %o', e);
            const message = e instanceof Error ? e.message : 'Error finding transactions by status';
            return Result.fail<ITransacaoDTO[]>(message);
        }
    }

    /**
     * Finds transactions that occurred within a specific date range.
     * @param startDate - Start of the date interval (inclusive).
     * @param endDate - End of the date interval (inclusive).
     */
    public async findTransacaoByDateRange(startDate: IData, endDate: IData, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            if (!startDate || !endDate) return Result.fail<ITransacaoDTO[]>('Start and end dates are required');
            // convert IData to Date (use start at 00:00:00 and end at 23:59:59)
            const start = new Date(startDate.ano, startDate.mes - 1, startDate.dia, 0, 0, 0);
            const end = new Date(endDate.ano, endDate.mes - 1, endDate.dia, 23, 59, 59);
            const rows = await this.transacaoRepo.findByDateRange(start, end, userId);
            const dtos = rows.map(r => TransacaoMap.toDTO(r) as ITransacaoDTO);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByDateRange error: %o', e);
            const message = e instanceof Error ? e.message : 'Error finding transactions by date range';
            return Result.fail<ITransacaoDTO[]>(message);
        }
    }

    /**
     * Retrieves all transactions.
     */
    public async findAllTransacoes(userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows = await this.transacaoRepo.findAll(userId);
            const dtos = rows.map(r => TransacaoMap.toDTO(r) as ITransacaoDTO);
            return Result.ok<ITransacaoDTO[]>(dtos);
        } catch (e) {
            this.logger.error('TransacaoService.findAllTransacoes error: %o', e);
            const message = e instanceof Error ? e.message : 'Error finding all transactions';
            return Result.fail<ITransacaoDTO[]>(message);
        }
    }
}

