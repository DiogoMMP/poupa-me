import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type IContaService from './IServices/IContaService.js';
import type IContaRepo from '../repos/IRepos/IContaRepo.js';
import type { IContaDTO, IContaInputDTO, IContaUpdateDTO } from '../dto/IContaDTO.js';
import { ContaMap } from '../mappers/ContaMap.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { Conta } from '../domain/Conta/Entities/Conta.js';

/**
 * Service layer for managing Conta entities. Handles business logic and interacts with the Conta repository.
 */
@Service()
export default class ContaService implements IContaService {
    constructor(
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Creates a new Conta based on the provided input DTO. Validates and maps the input to a domain entity, then persists it using the repository.
     * @param inputDTO - Data transfer object containing the necessary information to create a Conta. Must include userId, nome, and optionally icon and saldo.
     * @returns A Result object containing the created Conta DTO on success, or an error message on failure.
     */
    public async createConta(inputDTO: IContaInputDTO): Promise<Result<IContaDTO>> {
        try {
            // Build domain value objects
            const nomeOrError = Nome.create(inputDTO.nome ?? '');
            const iconOrError = Icon.create(inputDTO.icon ?? '');
            const dinheiroOrError = Dinheiro.create(Number(inputDTO.saldo?.valor ?? 0), String(inputDTO.saldo?.moeda ?? 'EUR'));

            const combine = Result.combine([nomeOrError, iconOrError, dinheiroOrError]);
            if (combine.isFailure) return Result.fail<IContaDTO>(combine.errorValue() as string);

            if (!inputDTO.userId) return Result.fail<IContaDTO>('User id is required');

            const props = {
                userId: new UniqueEntityID(String(inputDTO.userId)),
                nome: nomeOrError.getValue(),
                icon: iconOrError.getValue(),
                saldo: dinheiroOrError.getValue(),
                bancoId: inputDTO.bancoId
            };

            const contaOrError = Conta.create(props);
            if (contaOrError.isFailure) return Result.fail<IContaDTO>(String(contaOrError.error));

            const contaDomain = contaOrError.getValue();
            const saved = await this.contaRepo.save(contaDomain);
            return Result.ok<IContaDTO>(ContaMap.toDTO(saved));
        } catch (err) {
            this.logger.error('ContaService.createConta error: %o', err);
            return Result.fail<IContaDTO>('Error creating Conta');
        }
    }

    /**
     * Updates an existing Conta with the provided ID using the update DTO. Only name and icon can be updated.
     * @param id - The domain ID of the Conta to update.
     * @param inputDTO - Data transfer object containing the fields to update. Can include nome, icon, and/or saldo.
     * @returns A Result object containing the updated Conta DTO on success, or an error message on failure.
     */
    public async updateConta(id: string, inputDTO: IContaUpdateDTO): Promise<Result<IContaDTO>> {
        try {
            const existing = await this.contaRepo.findById(id);
            if (!existing) return Result.fail<IContaDTO>('Conta not found');

            // Build updated value objects
            const nomeOrError = Nome.create(inputDTO.nome ?? existing.nome.value);
            const iconOrError = Icon.create(inputDTO.icon ?? existing.icon.value);
            // Preserve existing saldo when updating via IContaUpdateDTO
            const dinheiroOrError = Dinheiro.create(existing.saldo.value, existing.saldo.moeda);

            const combine = Result.combine([nomeOrError, iconOrError, dinheiroOrError]);
            if (combine.isFailure) return Result.fail<IContaDTO>(combine.errorValue() as string);

            const props = {
                userId: existing.userId,
                nome: nomeOrError.getValue(),
                icon: iconOrError.getValue(),
                saldo: dinheiroOrError.getValue(),
                bancoId: inputDTO.bancoId ?? existing.bancoId
            };

            const updatedOrError = Conta.create(props, existing.id);
            if (updatedOrError.isFailure) return Result.fail<IContaDTO>(String(updatedOrError.error));

            const saved = await this.contaRepo.update(updatedOrError.getValue());
            return Result.ok<IContaDTO>(ContaMap.toDTO(saved));
        } catch (err) {
            this.logger.error('ContaService.updateConta error: %o', err);
            return Result.fail<IContaDTO>('Error updating Conta');
        }
    }

    /**
     * Deletes a Conta by its domain ID. If the Conta does not exist, it will still return success to avoid leaking information about existing IDs.
     * @param id - The domain ID of the Conta to delete.
     * @returns A Result object containing true on successful deletion, or an error message on failure.
     */
    public async deleteConta(id: string): Promise<Result<boolean>> {
        try {
            await this.contaRepo.delete(id);
            return Result.ok<boolean>(true);
        } catch (err) {
            this.logger.error('ContaService.deleteConta error: %o', err);
            return Result.fail<boolean>('Error deleting Conta');
        }
    }

    /**
     * Finds a Conta by its domain ID. If the Conta is not found, it returns a failure result with a 'Not found' message.
     * @param id - The domain ID of the Conta to find.
     * @returns A Result object containing the found Conta DTO on success, or an error message on failure.
     */
    public async findContaById(id: string): Promise<Result<IContaDTO>> {
        try {
            const conta = await this.contaRepo.findById(id);
            if (!conta) return Result.fail<IContaDTO>('Not found');
            return Result.ok<IContaDTO>(ContaMap.toDTO(conta));
        } catch (err) {
            this.logger.error('ContaService.findContaById error: %o', err);
            return Result.fail<IContaDTO>('Error fetching Conta');
        }
    }

    /**
     * Finds all Contas, optionally filtered by a user ID and banco ID. If a user ID is provided, only Contas associated with that user will be returned.
     * If a banco ID is provided, only Contas associated with that banco will be returned. If neither is provided, all Contas will be returned.
     * @param userId - Optional user ID to filter Contas by. If provided, only Contas with a matching user_domain_id will be returned.
     * @param bancoId - Optional banco ID to filter Contas by. If provided, only Contas with a matching banco_id will be returned.
     * @returns A Result object containing an array of Conta DTOs on success, or an error message on failure.
     */
    public async findAllContas(userId?: string, bancoId?: string): Promise<Result<IContaDTO[]>> {
        try {
            const contas = await this.contaRepo.findAll(userId, bancoId);
            return Result.ok<IContaDTO[]>(contas.map(c => ContaMap.toDTO(c)));
        } catch (err) {
            this.logger.error('ContaService.findAllContas error: %o', err);
            return Result.fail<IContaDTO[]>('Error fetching Contas');
        }
    }
}
