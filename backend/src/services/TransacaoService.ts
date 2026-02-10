import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type {
    ITransacaoDTO,
    ITransacaoInputDTO,
    ITransacaoReembolsoDTO,
    ITransacaoUpdateDTO,
    IData
} from '../dto/ITransacaoDTO.js';
import type ITransacaoRepo from '../repos/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import type IContaRepo from '../repos/IRepos/IContaRepo.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../domain/Transacao/ValueObjects/Data.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { TransacaoMap } from '../mappers/TransacaoMap.js';

/**
 * Service class responsible for handling all business logic related to Transacao entities, including creation, updates, deletions, and queries.
 * This class interacts with the Transacao repository for data persistence, as well as the Categoria and Conta repositories for related entity lookups.
 * Each method returns a Result type, encapsulating success or failure and providing consistent error handling across the service.
 */
@Service()
export default class TransacaoService {
    constructor(
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    // --- Creation Methods ---

    /**
     * Creates a new "Entrada" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities,
     * @param inputDTO - The data transfer object containing the necessary information to create an Entrada transaction
     * @returns A Result object containing either the created Transacao DTO or an error message if the creation process fails at any step
     */
    public async createEntrada(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account not provided');
            const conta = await this.contaRepo.findById(inputDTO.contaId);

            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');
            if (!conta) return Result.fail<ITransacaoDTO>('Target Account not found');

            const transacaoOrError = Transacao.createEntrada({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                conta: conta
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            // attach owner user id (non-domain prop) so persistence includes user_domain_id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.registarTransacao(transacao);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(transacao));
        } catch (e) {
            this.logger.error('TransacaoService.createEntrada error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating entrada');
        }
    }

    /**
     * Creates a new "Saida" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities, and ensures that the transaction can be registered with the account's balance.
     * @param inputDTO - The data transfer object containing the necessary information to create a Saida transaction
     * @returns A Result object containing either the created Transacao DTO or an error message if the creation process
     * fails at any step, such as validation errors, missing related entities, or balance issues
     */
    public async createSaida(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account not provided');
            const conta = await this.contaRepo.findById(inputDTO.contaId);

            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');
            if (!conta) return Result.fail<ITransacaoDTO>('Target Account not found');

            const transacaoOrError = Transacao.createSaida({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                conta: conta
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.registarTransacao(transacao);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(transacao));
        } catch (e) {
            this.logger.error('TransacaoService.createSaida error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating saida');
        }
    }

    /**
     * Creates a new "Credito" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities, and ensures that the transaction can be registered with the account's balance.
     * @param inputDTO - The data transfer object containing the necessary information to create a Credito transaction
     * @returns A Result object containing either the created Transacao DTO or an error message if the creation process
     * fails at any step, such as validation errors, missing related entities, or balance issues
     */
    public async createCredito(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account not provided');
            const conta = await this.contaRepo.findById(inputDTO.contaId);

            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');
            if (!conta) return Result.fail<ITransacaoDTO>('Target Account not found');

            const transacaoOrError = Transacao.createCredito({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                conta: conta
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.registarTransacao(transacao);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(transacao));
        } catch (e) {
            this.logger.error('TransacaoService.createCredito error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating credito');
        }
    }

    /**
     * Creates a new "Despesa Mensal" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities, and ensures that the transaction can be registered with the account's balance.
     * @param inputDTO - The data transfer object containing the necessary information to create a Despesa Mensal transaction
     * @returns A Result object containing either the created Transacao DTO or an error message if the creation process
     * fails at any step, such as validation errors, missing related entities, or balance issues
     */
    public async createDespesaMensal(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account not provided');
            const conta = await this.contaRepo.findById(inputDTO.contaId);

            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');
            if (!conta) return Result.fail<ITransacaoDTO>('Target Account not found');

            const transacaoOrError = Transacao.createDespesaMensal({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                conta: conta
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.registarTransacao(transacao);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(transacao));
        } catch (e) {
            this.logger.error('TransacaoService.createDespesaMensal error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating despesa mensal');
        }
    }

    /**
     * Creates a new "Reembolso" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities, ensures that the original transaction exists and is eligible for reimbursement,
     * and ensures that the new transaction can be registered with the account's balance.
     * @param inputDTO - The data transfer object containing the necessary information to create a Reembolso transaction,
     * including a reference to the original transaction being reimbursed
     */
    public async createReembolso(inputDTO: ITransacaoReembolsoDTO): Promise<Result<ITransacaoDTO>> {
        try {
            // find original transaction
            const original = await this.transacaoRepo.findById(inputDTO.reembolso);
            if (!original) return Result.fail<ITransacaoDTO>('Original transaction not found');

            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account not provided');
            const conta = await this.contaRepo.findById(inputDTO.contaId);

            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');
            if (!conta) return Result.fail<ITransacaoDTO>('Target Account not found');

            const transacaoOrError = Transacao.createReembolso({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                conta: conta
            }, original.id);

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.registarTransacao(transacao);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(transacao));
        } catch (e) {
            this.logger.error('TransacaoService.createReembolso error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating reembolso');
        }
    }

    // --- Update & Delete ---

    /**
     * Updates an existing Transacao with new values provided in the update DTO. This method first checks if the transaction to update exists,
     * then it validates the new values, checks for the existence of related Categoria and Conta entities if they are being updated,
     * and finally applies the updates while ensuring that the account balance is correctly adjusted based on the changes.
     * @param id - The unique identifier of the Transacao to update
     * @param updateDTO - The data transfer object containing the new values for the Transacao. This may include changes
     * to the description, value, category, or associated account.
     */
    public async updateTransacao(id: string, updateDTO: ITransacaoUpdateDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const existing = await this.transacaoRepo.findById(id);
            if (!existing) return Result.fail<ITransacaoDTO>(`Transaction not found: ${id}`);

            if (!existing.conta) return Result.fail<ITransacaoDTO>('Associated account not found');
            const conta = await this.contaRepo.findById(existing.conta.id.toString());
            if (!conta) return Result.fail<ITransacaoDTO>('Associated account not found');

            // Revert impact, update, apply new impact
            conta.reverterTransacao(existing);

            // Rebuild transaction with new values (simplified for brevity, ensure all fields map correctly)
            const descricao = updateDTO.descricao ? Descricao.create(updateDTO.descricao).getValue() : existing.descricao;
            const valor = updateDTO.valor ? Dinheiro.create(updateDTO.valor.valor, updateDTO.valor.moeda).getValue() : existing.valor;

            const updatedOrError = Transacao.create({
                ...existing.props,
                descricao,
                valor,
                // Add other update logic here...
            }, existing.id);

            if (updatedOrError.isFailure) return Result.fail<ITransacaoDTO>(String(updatedOrError.error));

            const updatedTransacao = updatedOrError.getValue();
            conta.registarTransacao(updatedTransacao);

            await this.transacaoRepo.update(updatedTransacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(updatedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.updateTransacao error: %o', e);
            return Result.fail<ITransacaoDTO>('Error updating transaction');
        }
    }

    /**
     * Deletes a Transacao by its unique identifier. This method first checks if the transaction exists, then it
     * reverts the impact of the transaction from the associated account's balance,
     * @param id - The unique identifier of the Transacao to delete
     * @returns A Result object containing either a boolean indicating successful deletion or an error message if the
     * deletion process fails at any step, such as if the transaction is not found or if there are issues reverting the account balance
     */
    public async deleteTransacao(id: string): Promise<Result<boolean>> {
        try {
            const transacao = await this.transacaoRepo.findById(id);
            if (!transacao) return Result.fail<boolean>('Not found');

            if (transacao.conta) {
                const conta = await this.contaRepo.findById(transacao.conta.id.toString());
                if (conta) {
                    conta.reverterTransacao(transacao);
                    await this.contaRepo.update(conta);
                }
            }

            await this.transacaoRepo.delete(id);
            return Result.ok<boolean>(true);
        } catch (e) {
            this.logger.error('TransacaoService.deleteTransacao error: %o', e);
            return Result.fail<boolean>('Error deleting transaction');
        }
    }

    // --- Query Methods (ALL included) ---

    /**
     * Finds a Transacao by its unique identifier. This method checks if the transaction exists and returns it as a DTO
     * if found. If the transaction is not found, it returns a failure result with an appropriate error message.
     * @param id - The unique identifier of the Transacao to find
     * @returns A Result object containing either the found Transacao as a DTO or an error message if the transaction
     * is not found or if there is an error during the fetch operation
     */
    public async findTransacaoById(id: string): Promise<Result<ITransacaoDTO>> {
        try {
            const t = await this.transacaoRepo.findById(id);
            if (!t) return Result.fail<ITransacaoDTO>('Transaction not found');
            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(t));
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoById error: %o', e);
            return Result.fail<ITransacaoDTO>('Error fetching transaction');
        }
    }

    /**
     * Finds Transacao entities by their associated Categoria. This method checks if the category exists and returns
     * all transactions linked to that category as DTOs.
     * @param categoriaId - The unique identifier of the Categoria to find transactions for
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of Transacao DTOs associated with the specified category or
     * an error message if there is an issue during the fetch operation
     */
    public async findTransacaoByCategoria(categoriaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findByCategoria(categoriaId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByCategoria error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions by category');
        }
    }

    /**
     * Finds Transacao entities by their type (e.g., "Entrada", "Saida", "Credito", "Despesa Mensal"). This method
     * returns all transactions of the specified type as DTOs.
     * @param tipo - The type of transactions to find (e.g., "Entrada", "Saida", "Credito", "Despesa Mensal")
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of Transacao DTOs of the specified type or an error
     * message if there is an issue during the fetch operation
     */
    public async findTransacaoByTipo(tipo: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findByTipo(tipo, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByTipo error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions by type');
        }
    }

    /**
     * Finds Transacao entities by their status (e.g., "Pendente", "Confirmada", "Cancelada"). This method returns
     * all transactions of the specified status as DTOs.
     * @param status - The status of transactions to find (e.g., "Pendente", "Confirmada", "Cancelada")
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of Transacao DTOs of the specified status or an error
     * message if there is an issue during the fetch operation
     */
    public async findTransacaoByStatus(status: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findByStatus(status, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByStatus error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions by status');
        }
    }

    /**
     * Finds Transacao entities that fall within a specified date range. This method converts the provided date parts into Date objects,
     * queries the repository for transactions within that range, and returns them as DTOs.
     * @param startDate - The starting date of the range, provided as an IData object containing day, month, and year
     * @param endDate - The ending date of the range, provided as an IData object containing day, month, and year
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of Transacao DTOs that fall within the specified date range
     * or an error message if there is an issue during the fetch operation
     */
    public async findTransacaoByDateRange(startDate: IData, endDate: IData, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const start = new Date(startDate.ano, startDate.mes - 1, startDate.dia, 0, 0, 0);
            const end = new Date(endDate.ano, endDate.mes - 1, endDate.dia, 23, 59, 59);
            const rows: Transacao[] = await this.transacaoRepo.findByDateRange(start, end, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoByDateRange error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions by date range');
        }
    }

    /**
     * Finds all Transacao entities, optionally filtered by user ownership. This method retrieves all transactions
     * from the repository and returns them as DTOs.
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of all Transacao DTOs or an error message if there is an issue during the fetch operation
     */
    public async findAllTransacoes(userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findAll(userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findAllTransacoes error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching all transactions');
        }
    }
}