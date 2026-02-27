import {Service, Inject} from 'typedi';
import {Result} from '../core/logic/Result.js';
import type ICartaoCreditoService from './IServices/ICartaoCreditoService.js';
import type ICartaoCreditoRepo from '../repos/IRepos/ICartaoCreditoRepo.js';
import type ITransacaoRepo from '../repos/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import type {ICartaoCreditoDTO, ICartaoCreditoInputDTO, ICartaoCreditoUpdateDTO, IPeriodoProps} from '../dto/ICartaoCreditoDTO.js';
import {CartaoCreditoMap} from '../mappers/CartaoCreditoMap.js';
import {Nome} from '../domain/Shared/ValueObjects/Nome.js';
import {Icon} from '../domain/Shared/ValueObjects/Icon.js';
import {Dinheiro} from '../domain/Shared/ValueObjects/Dinheiro.js';
import {Periodo} from '../domain/CartaoCredito/ValueObjects/Periodo.js';
import {UniqueEntityID} from '../core/domain/UniqueEntityID.js';
import {CartaoCredito} from '../domain/CartaoCredito/Entities/CartaoCredito.js';
import {Data} from '../domain/Shared/ValueObjects/Data.js';
import type {IDinheiroProps, ITransacaoDTO} from "../dto/ITransacaoDTO.js";
import { TransacaoMap } from '../mappers/TransacaoMap.js';

/**
 * Service layer for managing CartaoCredito entities. Handles business logic and interacts with the CartaoCredito repository.
 */
@Service()
export default class CartaoCreditoService implements ICartaoCreditoService {
    constructor(
        @Inject('CartaoCreditoRepo') private cartaoRepo: ICartaoCreditoRepo,
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('ContaRepo') private contaRepo: any,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {
    }

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

            // validate contaPagamentoId existence
            if (!inputDTO.contaPagamentoId) return Result.fail<ICartaoCreditoDTO>('contaPagamentoId is required');
            const contaRow = await this.contaRepo.findById(inputDTO.contaPagamentoId);
            if (!contaRow) return Result.fail<ICartaoCreditoDTO>('Conta pagamento not found');

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
                contaPagamentoId: new UniqueEntityID(String(inputDTO.contaPagamentoId)),
                bancoId: inputDTO.bancoId
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
                contaPagamentoId: inputDTO.contaPagamentoId ? new UniqueEntityID(String(inputDTO.contaPagamentoId)) : existing.contaPagamentoId,
                bancoId: inputDTO.bancoId ?? existing.bancoId
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
     * Finds all CartaoCredito entities, optionally filtered by user ID and banco ID. This method retrieves CartaoCredito entities
     * from the repository, maps them to DTOs, and returns them in a Result. If a user ID is provided, only CartaoCredito
     * entities associated with that user will be returned. If a banco ID is provided, only CartaoCredito entities associated
     * with that banco will be returned. If neither is provided, all CartaoCredito entities will be returned.
     * @param userId - Optional user ID to filter CartaoCredito entities by. If provided, only CartaoCredito entities
     * with a matching user_domain_id will be returned.
     * @param bancoId - Optional banco ID to filter CartaoCredito entities by. If provided, only CartaoCredito entities
     * with a matching banco_id will be returned.
     */
    public async findAllCartoes(userId?: string, bancoId?: string): Promise<Result<ICartaoCreditoDTO[]>> {
        try {
            const cartoes = await this.cartaoRepo.findAll(userId, bancoId);
            return Result.ok<ICartaoCreditoDTO[]>(cartoes.map(c => CartaoCreditoMap.toDTO(c)));
        } catch (err) {
            this.logger.error('CartaoCreditoService.findAllCartoes error: %o', err);
            return Result.fail<ICartaoCreditoDTO[]>('Error fetching Cartoes');
        }
    }

    /**
     * Retrieves the extrato (statement) for a given CartaoCredito by its domain ID. This method fetches the transactions and current balance
     * @param cartaoCreditoId - The domain ID of the CartaoCredito for which to retrieve the extrato. This ID is used
     * to query the repository for related transactions and balance information.
     * @param userId - Optional user ID to further filter transactions by. If provided, only transactions associated
     * with the given user will be included in the extrato.
     */
    public async getExtrato(cartaoCreditoId: string, userId?: string): Promise<Result<{
        transacoes: ITransacaoDTO[],
        saldoAtual: IDinheiroProps
    }>> {
        try {
            const extrato = await this.cartaoRepo.getExtrato(cartaoCreditoId, userId);

            // Map domain Transacao[] to DTOs
            const transacoesDTO: ITransacaoDTO[] = [];
            for (const t of extrato.transacoes) {
                try {
                    transacoesDTO.push(TransacaoMap.toDTO(t));
                } catch (e) {
                    this.logger.error('CartaoCreditoService.getExtrato: failed to map transacao to DTO %o', e);
                }
            }

            // Convert Dinheiro VO to IDinheiroProps
            const saldoAtualVO = extrato.saldoAtual;
            const saldoAtual: IDinheiroProps = {
                valor: saldoAtualVO.value,
                moeda: saldoAtualVO.moeda
            };

            return Result.ok<{ transacoes: ITransacaoDTO[], saldoAtual: IDinheiroProps }>({ transacoes: transacoesDTO, saldoAtual });
        } catch (err) {
            this.logger.error('CartaoCreditoService.getExtrato error: %o', err);
            return Result.fail<{ transacoes: ITransacaoDTO[], saldoAtual: IDinheiroProps }>('Error fetching extrato');
        }
    }

    /**
     * Processes the card payment.
     * Logic:
     * 1. Calculates the amount to pay based on the current statement (extrato).
     * 2. Updates the card period and saldo.
     * 3. Calls TransacaoRepo to mark pending transactions and create payment transaction.
     */
    public async pagarCartao(cartaoId: string, userId: string, novoPeriodo: IPeriodoProps): Promise<Result<ITransacaoDTO>> {
        try {
            // 1. Get the amount to pay from the current statement (no userId filter — admin must be able to pay any card)
            const extratoResult = await this.getExtrato(cartaoId);
            if (extratoResult.isFailure) return Result.fail<ITransacaoDTO>(String(extratoResult.error));
            const { saldoAtual } = extratoResult.getValue();

            const valorPagar = Dinheiro.create(saldoAtual.valor, saldoAtual.moeda).getValue();

            // Check if there is anything to pay
            if (valorPagar.value === 0) return Result.fail<ITransacaoDTO>("No amount to pay on the card statement");

            // 2. Load the Card Entity
            const cartao = await this.cartaoRepo.findById(cartaoId);
            if (!cartao) return Result.fail<ITransacaoDTO>("Cartão não encontrado");

            // 3. Prepare new period dates
            const novoPeriodoInicioOrError = Data.createFromParts(novoPeriodo.inicio.dia, novoPeriodo.inicio.mes, novoPeriodo.inicio.ano, true);
            const novoPeriodoFechoOrError = Data.createFromParts(novoPeriodo.fecho.dia, novoPeriodo.fecho.mes, novoPeriodo.fecho.ano, true);

            if (novoPeriodoInicioOrError.isFailure || novoPeriodoFechoOrError.isFailure) {
                return Result.fail<ITransacaoDTO>('Invalid dates for new period');
            }

            const novoPeriodoVO = Periodo.create(novoPeriodoInicioOrError.getValue(), novoPeriodoFechoOrError.getValue());
            if (novoPeriodoVO.isFailure) return Result.fail<ITransacaoDTO>(String(novoPeriodoVO.error));

            // 4. Subtract payment from current saldoUtilizado
            const novoSaldoResult = cartao.saldoUtilizado.subtract(valorPagar);
            if (novoSaldoResult.isFailure) {
                return Result.fail<ITransacaoDTO>(String(novoSaldoResult.error));
            }
            const novoSaldoUtilizado = novoSaldoResult.getValue();

            // 5. Update the Card Entity with new balance and period
            const updatedCartaoProps = {
                userId: cartao.userId,
                nome: cartao.nome,
                icon: cartao.icon,
                limiteCredito: cartao.limiteCredito,
                saldoUtilizado: novoSaldoUtilizado,
                periodo: novoPeriodoVO.getValue(),
                contaPagamentoId: cartao.contaPagamentoId
            };

            const updatedCartaoOrError = CartaoCredito.create(updatedCartaoProps, cartao.id);
            if (updatedCartaoOrError.isFailure) {
                return Result.fail<ITransacaoDTO>(String(updatedCartaoOrError.error));
            }

            // 6. Persist the updated card
            await this.cartaoRepo.update(updatedCartaoOrError.getValue());

            // 7. Call TransacaoRepo to mark pending transactions and create payment transaction
            // Use the card owner's userId, not the caller's (caller may be admin)
            const cartaoOwnerId = cartao.userId.toString();
            const periodoAntigoInicio = new Date(Date.UTC(cartao.periodo.inicio.year, cartao.periodo.inicio.month - 1, cartao.periodo.inicio.day));
            const periodoAntigoFecho = new Date(Date.UTC(cartao.periodo.fecho.year, cartao.periodo.fecho.month - 1, cartao.periodo.fecho.day));

            const transacaoPagamento = await this.transacaoRepo.pagarCartao(
                cartaoId,
                valorPagar.value,
                cartaoOwnerId,
                { inicio: periodoAntigoInicio, fecho: periodoAntigoFecho }
            );

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(transacaoPagamento));

        } catch (err) {
            this.logger.error('CartaoCreditoService.pagarCartao error: %o', err);
            return Result.fail<ITransacaoDTO>('Erro ao processar pagamento do cartão');
        }
    }
}