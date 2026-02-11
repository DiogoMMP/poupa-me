import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type ICartaoCreditoService from './IServices/ICartaoCreditoService.js';
import type ICartaoCreditoRepo from '../repos/IRepos/ICartaoCreditoRepo.js';
import type { ICartaoCreditoDTO, ICartaoCreditoInputDTO, ICartaoCreditoUpdateDTO } from '../dto/ICartaoCreditoDTO.js';
import { CartaoCreditoMap } from '../mappers/CartaoCreditoMap.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Periodo } from '../domain/CartaoCredito/ValueObjects/Periodo.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { CartaoCredito } from '../domain/CartaoCredito/Entities/CartaoCredito.js';
import { Data } from '../domain/Shared/ValueObjects/Data.js';

/**
 * Service layer for managing CartaoCredito entities. Handles business logic and interacts with the CartaoCredito repository.
 */
@Service()
export default class CartaoCreditoService implements ICartaoCreditoService {
    constructor(
        @Inject('CartaoCreditoRepo') private cartaoRepo: ICartaoCreditoRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Creates a new CartaoCredito based on the provided input DTO. Validates and maps the input to a domain entity, then persists it using the repository.
     * @param inputDTO - Data transfer object containing the necessary information to create a CartaoCredito. Must
     * include userId, nome, and optionally icon, limiteCredito, saldoUtilizado, periodo, and contaPagamentoId.
     * @return A Result object containing the created CartaoCredito DTO on success, or an error message on failure.
     */
    public async createCartao(inputDTO: ICartaoCreditoInputDTO): Promise<Result<ICartaoCreditoDTO>> {
        try {
            const nomeOrError = Nome.create(inputDTO.nome ?? '');
            const iconOrError = Icon.create(inputDTO.icon ?? '');
            const limiteOrError = Dinheiro.create(Number(inputDTO.limiteCredito?.valor ?? 0), String(inputDTO.limiteCredito?.moeda ?? 'EUR'));
            const saldoOrError = Dinheiro.create(Number(inputDTO.saldoUtilizado?.valor ?? 0), String(inputDTO.saldoUtilizado?.moeda ?? 'EUR'));

            // Build Data VOs for periodo
            const inicioDTO = inputDTO.periodo?.inicio;
            const fechoDTO = inputDTO.periodo?.fecho;
            // allow future dates for card-period (this context permits future dates)
            const inicioDataOrError = Data.createFromParts(Number(inicioDTO?.dia ?? 1), Number(inicioDTO?.mes ?? 1), Number(inicioDTO?.ano ?? new Date().getFullYear()), true);
            const fechoDataOrError = Data.createFromParts(Number(fechoDTO?.dia ?? 1), Number(fechoDTO?.mes ?? 1), Number(fechoDTO?.ano ?? new Date().getFullYear()), true);
            const dataCombine = Result.combine([inicioDataOrError, fechoDataOrError]);
            if (dataCombine.isFailure) return Result.fail<ICartaoCreditoDTO>(dataCombine.errorValue() as string);
            const periodoOrError = Periodo.create(inicioDataOrError.getValue(), fechoDataOrError.getValue());

            const combine = Result.combine([nomeOrError, iconOrError, limiteOrError, saldoOrError, periodoOrError]);
            if (combine.isFailure) return Result.fail<ICartaoCreditoDTO>(combine.errorValue() as string);

            if (!inputDTO.userId) return Result.fail<ICartaoCreditoDTO>('User id is required');

            const props = {
                userId: new UniqueEntityID(String(inputDTO.userId)),
                nome: nomeOrError.getValue(),
                icon: iconOrError.getValue(),
                limiteCredito: limiteOrError.getValue(),
                saldoUtilizado: saldoOrError.getValue(),
                periodo: periodoOrError.getValue(),
                contaPagamentoId: new UniqueEntityID(String(inputDTO.contaPagamentoId))
            };

            const cartaoOrError = CartaoCredito.create(props);
            if (cartaoOrError.isFailure) return Result.fail<ICartaoCreditoDTO>(String(cartaoOrError.error));

            const cartaoDomain = cartaoOrError.getValue();
            const saved = await this.cartaoRepo.save(cartaoDomain);
            return Result.ok<ICartaoCreditoDTO>(CartaoCreditoMap.toDTO(saved));
        } catch (err) {
            this.logger.error('CartaoCreditoService.createCartao error: %o', err);
            return Result.fail<ICartaoCreditoDTO>('Error creating CartaoCredito');
        }
    }

    /**
     * Updates an existing CartaoCredito with the provided ID using the update DTO. Only name, icon, limiteCredito,
     * periodo, and contaPagamentoId can be updated.
     * @param id - The domain ID of the CartaoCredito to update.
     * @param inputDTO - Data transfer object containing the fields to update. Can include nome, icon, limiteCredito,
     * periodo, and/or contaPagamentoId.
     * @returns A Result object containing the updated CartaoCredito DTO on success, or an error message on failure.
     */
    public async updateCartao(id: string, inputDTO: ICartaoCreditoUpdateDTO): Promise<Result<ICartaoCreditoDTO>> {
        try {
            const existing = await this.cartaoRepo.findById(id);
            if (!existing) return Result.fail<ICartaoCreditoDTO>('Cartao not found');

            const nomeOrError = Nome.create(inputDTO.nome ?? existing.nome.value);
            const iconOrError = Icon.create(inputDTO.icon ?? existing.icon.value);

            const limiteVal = inputDTO.limiteCredito ? Number(inputDTO.limiteCredito.valor ?? existing.limiteCredito.value) : existing.limiteCredito.value;
            const limiteMoeda = inputDTO.limiteCredito ? String(inputDTO.limiteCredito.moeda ?? existing.limiteCredito.moeda) : existing.limiteCredito.moeda;
            const limiteOrError = Dinheiro.create(limiteVal, limiteMoeda);

            // Preserve existing saldoUtilizado on update (not present on update DTO)
            const saldoOrError = Dinheiro.create(existing.saldoUtilizado.value, existing.saldoUtilizado.moeda);

            const inicioDTO2 = inputDTO.periodo?.inicio;
            const fechoDTO2 = inputDTO.periodo?.fecho;
            // allow future dates for card-period (this context permits future dates)
            const inicioDataOrError2 = inicioDTO2 ? Data.createFromParts(Number(inicioDTO2.dia), Number(inicioDTO2.mes), Number(inicioDTO2.ano), true) : Data.createFromParts(existing.periodo.inicio.day, existing.periodo.inicio.month, existing.periodo.inicio.year, true);
            const fechoDataOrError2 = fechoDTO2 ? Data.createFromParts(Number(fechoDTO2.dia), Number(fechoDTO2.mes), Number(fechoDTO2.ano), true) : Data.createFromParts(existing.periodo.fecho.day, existing.periodo.fecho.month, existing.periodo.fecho.year, true);
            const dataCombine2 = Result.combine([inicioDataOrError2, fechoDataOrError2]);
            if (dataCombine2.isFailure) return Result.fail<ICartaoCreditoDTO>(dataCombine2.errorValue() as string);
            const periodoOrError = Periodo.create(inicioDataOrError2.getValue(), fechoDataOrError2.getValue());

            const combine = Result.combine([nomeOrError, iconOrError, limiteOrError, saldoOrError, periodoOrError]);
            if (combine.isFailure) return Result.fail<ICartaoCreditoDTO>(combine.errorValue() as string);

            const props = {
                userId: existing.userId,
                nome: nomeOrError.getValue(),
                icon: iconOrError.getValue(),
                limiteCredito: limiteOrError.getValue(),
                saldoUtilizado: saldoOrError.getValue(),
                periodo: periodoOrError.getValue(),
                contaPagamentoId: inputDTO.contaPagamentoId ? new UniqueEntityID(String(inputDTO.contaPagamentoId)) : existing.contaPagamentoId
            };

            const updatedOrError = CartaoCredito.create(props, existing.id);
            if (updatedOrError.isFailure) return Result.fail<ICartaoCreditoDTO>(String(updatedOrError.error));

            const saved = await this.cartaoRepo.update(updatedOrError.getValue());
            return Result.ok<ICartaoCreditoDTO>(CartaoCreditoMap.toDTO(saved));
        } catch (err) {
            this.logger.error('CartaoCreditoService.updateCartao error: %o', err);
            return Result.fail<ICartaoCreditoDTO>('Error updating CartaoCredito');
        }
    }

    /**
     * Deletes a CartaoCredito by its domain ID. This method attempts to delete the CartaoCredito using the repository
     * and returns a Result indicating success or failure.
     * @param id - The domain ID of the CartaoCredito to delete.
     * @returns A Result object containing true on successful deletion, or an error message on failure.
     */
    public async deleteCartao(id: string): Promise<Result<boolean>> {
        try {
            await this.cartaoRepo.delete(id);
            return Result.ok<boolean>(true);
        } catch (err) {
            this.logger.error('CartaoCreditoService.deleteCartao error: %o', err);
            return Result.fail<boolean>('Error deleting CartaoCredito');
        }
    }

    /**
     * Finds a CartaoCredito by its domain ID. This method retrieves the CartaoCredito from the repository and returns
     * it as a DTO if found. If the CartaoCredito is not found, it returns a failure Result with a 'Not found' message.
     * @param id - The domain ID of the CartaoCredito to find.
     * @returns A Result object containing the found CartaoCredito DTO on success, or an error message on failure.
     */
    public async findCartaoById(id: string): Promise<Result<ICartaoCreditoDTO>> {
        try {
            const cartao = await this.cartaoRepo.findById(id);
            if (!cartao) return Result.fail<ICartaoCreditoDTO>('Not found');
            return Result.ok<ICartaoCreditoDTO>(CartaoCreditoMap.toDTO(cartao));
        } catch (err) {
            this.logger.error('CartaoCreditoService.findCartaoById error: %o', err);
            return Result.fail<ICartaoCreditoDTO>('Error fetching CartaoCredito');
        }
    }

    /**
     * Finds all CartaoCredito entities, optionally filtered by user ID. This method retrieves CartaoCredito entities
     * from the repository, maps them to DTOs, and returns them in a Result. If a user ID is provided, only CartaoCredito
     * entities associated with that user will be returned. If no user ID is provided, all CartaoCredito entities will be returned.
     * @param userId - Optional user ID to filter CartaoCredito entities by. If provided, only CartaoCredito entities
     * with a matching user_domain_id will be returned. If not provided, all CartaoCredito entities will be returned.
     */
    public async findAllCartoes(userId?: string): Promise<Result<ICartaoCreditoDTO[]>> {
        try {
            const cartoes = await this.cartaoRepo.findAll(userId);
            return Result.ok<ICartaoCreditoDTO[]>(cartoes.map(c => CartaoCreditoMap.toDTO(c)));
        } catch (err) {
            this.logger.error('CartaoCreditoService.findAllCartoes error: %o', err);
            return Result.fail<ICartaoCreditoDTO[]>('Error fetching Cartoes');
        }
    }
}
