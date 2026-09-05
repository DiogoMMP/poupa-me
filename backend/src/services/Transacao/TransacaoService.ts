import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type {
    ITransacaoDTO,
    ITransacaoInputDTO,
    ITransacaoReembolsoDTO,
    ITransacaoUpdateDTO
} from '../../dto/ITransacaoDTO.js';
import type ITransacaoService from './IServices/ITransacaoService.js';
import type ITransacaoDespesasRecorrentesService from './IServices/ITransacaoDespesasRecorrentesService.js';
import type ITransacaoRepo from '../../repos/Transacao/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../../repos/Categoria/ICategoriaRepo.js';
import type IContaRepo from '../../repos/Conta/IContaRepo.js';
import type ICartaoCreditoRepo from '../../repos/CartaoCredito/ICartaoCreditoRepo.js';
import type IUserRepo from '../../repos/User/IUserRepo.js';
import { Transacao } from '../../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../../domain/Shared/ValueObjects/Data.js';
import { Dinheiro } from '../../domain/Shared/ValueObjects/Dinheiro.js';
import { Tipo } from '../../domain/Shared/ValueObjects/Tipo.js';
import { TransacaoMap } from '../../mappers/TransacaoMap.js';
import { Status } from '../../domain/Transacao/ValueObjects/Status.js';

/**
 * Core service for Transacao: handles creation (Entrada, Saída, Crédito, Reembolso),
 * update, delete, findById and balance impact helpers.
 */
@Service()
export default class TransacaoService implements ITransacaoService {
    constructor(
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('CartaoCreditoRepo') private cartaoCreditoRepo: ICartaoCreditoRepo,
        @Inject('TransacaoDespesasRecorrentesService') private transacaoDespesasRecorrentesService: ITransacaoDespesasRecorrentesService,
        @Inject('UserRepo') private userRepo: IUserRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    private async getUserNome(userId?: string): Promise<string | undefined> {
        if (!userId) return undefined;
        try {
            const user = await this.userRepo.findByDomainId(userId);
            return user?.name.value;
        } catch {
            return undefined;
        }
    }

    private async toEnrichedDTO(transacao: Transacao): Promise<ITransacaoDTO> {
        const uid = (transacao as unknown as { userDomainId?: string }).userDomainId;
        const userNome = await this.getUserNome(uid);
        return TransacaoMap.toDTO(transacao, userNome);
    }

    // --- Creation Methods ---

    /**
     * Creates a new "Entrada" type Transacao.
     */
    public async createEntrada(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account is required for Entrada');
            if (inputDTO.cartaoCreditoId) return Result.fail<ITransacaoDTO>('Entrada cannot be applied to credit cards');

            const conta = await this.contaRepo.findById(inputDTO.contaId);
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

            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.adicionarSaldo(transacao.valor);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            const savedTransacao = await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(await this.toEnrichedDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createEntrada error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating entrada');
        }
    }

    /**
     * Creates a new "Saida" type Transacao.
     */
    public async createSaida(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Target Account is required for Saida');
            if (inputDTO.cartaoCreditoId) return Result.fail<ITransacaoDTO>('Saida cannot be applied to credit cards');

            const conta = await this.contaRepo.findById(inputDTO.contaId);
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

            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            const balanceResult = conta.subtrairSaldo(transacao.valor);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            const savedTransacao = await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(await this.toEnrichedDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createSaida error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating saida');
        }
    }

    /**
     * Creates a new "Credito" type Transacao.
     */
    public async createCredito(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            if (!inputDTO.cartaoCreditoId) {
                return Result.fail<ITransacaoDTO>('cartaoCreditoId is required for Credito');
            }

            const cartaoCredito = await this.cartaoCreditoRepo.findById(inputDTO.cartaoCreditoId);
            if (!cartaoCredito) return Result.fail<ITransacaoDTO>('Target Credit Card not found');

            const contaPagamentoId = cartaoCredito.contaPagamentoId;
            if (!contaPagamentoId) {
                return Result.fail<ITransacaoDTO>('Credit card does not have an associated payment account');
            }
            const conta = await this.contaRepo.findById(contaPagamentoId.toString());
            if (!conta) return Result.fail<ITransacaoDTO>('Payment account associated with credit card not found');

            const userId = inputDTO.userId ?? cartaoCredito.userId.toString();

            const transacaoOrError = Transacao.createCredito({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                cartaoCredito: cartaoCredito
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            (transacao as unknown as Record<string, unknown>)['userDomainId'] = userId;

            const addToCardResult = cartaoCredito.adicionarUtilizacao(transacao.valor);
            if (addToCardResult.isFailure) return Result.fail<ITransacaoDTO>(String(addToCardResult.error));

            const subtractFromAccountResult = conta.subtrairSaldo(transacao.valor);
            if (subtractFromAccountResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractFromAccountResult.error));

            await this.cartaoCreditoRepo.update(cartaoCredito);
            await this.contaRepo.update(conta);

            const savedTransacao = await this.transacaoRepo.save(transacao);

            return Result.ok<ITransacaoDTO>(await this.toEnrichedDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createCredito error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating credito');
        }
    }

    /**
     * Creates a new "Reembolso" type Transacao.
     */
    public async createReembolso(inputDTO: ITransacaoReembolsoDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            if (!inputDTO.cartaoCreditoId) {
                return Result.fail<ITransacaoDTO>('cartaoCreditoId is required for Reembolso');
            }

            const cartaoCredito = await this.cartaoCreditoRepo.findById(inputDTO.cartaoCreditoId);
            if (!cartaoCredito) return Result.fail<ITransacaoDTO>('Target Credit Card not found');

            const contaPagamentoId = cartaoCredito.contaPagamentoId;
            if (!contaPagamentoId) {
                return Result.fail<ITransacaoDTO>('Credit card does not have an associated payment account');
            }
            const conta = await this.contaRepo.findById(contaPagamentoId.toString());
            if (!conta) return Result.fail<ITransacaoDTO>('Payment account associated with credit card not found');

            const userId = inputDTO.userId ?? cartaoCredito.userId.toString();

            const transacaoOrError = Transacao.createReembolso({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                cartaoCredito: cartaoCredito,
                conta: conta
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            (transacao as unknown as Record<string, unknown>)['userDomainId'] = userId;

            const addToAccountResult = conta.adicionarSaldo(transacao.valor);
            if (addToAccountResult.isFailure) return Result.fail<ITransacaoDTO>(String(addToAccountResult.error));

            const subtractFromCardResult = cartaoCredito.reduzirUtilizacao(transacao.valor);
            if (subtractFromCardResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractFromCardResult.error));

            await this.contaRepo.update(conta);
            await this.cartaoCreditoRepo.update(cartaoCredito);

            const savedTransacao = await this.transacaoRepo.save(transacao);

            return Result.ok<ITransacaoDTO>(await this.toEnrichedDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createReembolso error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating reembolso');
        }
    }

    // --- Update & Delete ---

    /** Reverts the impact of an Entrada or Saída transaction. */
    public async revertEntradaSaidaImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.conta) return Result.fail<void>('Conta not found for Entrada/Saída');
        const conta = await this.contaRepo.findById(transacao.conta.id.toString());
        if (!conta) return Result.fail<void>('Associated account not found');

        const revertResult = transacao.tipo.value === 'Entrada'
            ? conta.subtrairSaldo(transacao.valor)
            : conta.adicionarSaldo(transacao.valor);
        if (revertResult.isFailure) return Result.fail<void>(String(revertResult.error));

        await this.contaRepo.update(conta);
        return Result.ok<void>();
    }

    /**
     * Reverts the impact of a Crédito transaction. The payment account was debited at creation time regardless of
     * status, so that debit is always reverted here. The card's saldoUtilizado only tracks unpaid (Pendente)
     * charges, so it is only reverted if this transaction was still Pendente.
     *
     * The auto-generated "Pagamento X" record (isPagamentoCartao) is exempt: it never debited the account and its
     * card impact was already applied directly by pagarCartao, so it carries no impact to revert here.
     */
    public async revertCreditoImpact(transacao: Transacao): Promise<Result<void>> {
        if (transacao.isPagamentoCartao) return Result.ok<void>();
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found for Crédito');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found for credit card');

        const revertAccountResult = contaPagamento.adicionarSaldo(transacao.valor);
        if (revertAccountResult.isFailure) return Result.fail<void>(String(revertAccountResult.error));
        await this.contaRepo.update(contaPagamento);

        if (transacao.status.value === 'Pendente') {
            const revertCardResult = cartao.reduzirUtilizacao(transacao.valor);
            if (revertCardResult.isFailure) return Result.fail<void>(String(revertCardResult.error));
            await this.cartaoCreditoRepo.update(cartao);
        }

        return Result.ok<void>();
    }

    /**
     * Reverts the impact of a Reembolso transaction. The refund credited to the payment account at creation time is
     * always reverted here. The card's saldoUtilizado adjustment only applies while Pendente, so it is only
     * reverted if this transaction was still Pendente.
     */
    public async revertReembolsoImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found for Reembolso');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found for credit card');

        const revertAccountResult = contaPagamento.subtrairSaldo(transacao.valor);
        if (revertAccountResult.isFailure) return Result.fail<void>(String(revertAccountResult.error));
        await this.contaRepo.update(contaPagamento);

        if (transacao.status.value === 'Pendente') {
            const revertCardResult = cartao.adicionarUtilizacao(transacao.valor);
            if (revertCardResult.isFailure) return Result.fail<void>(String(revertCardResult.error));
            await this.cartaoCreditoRepo.update(cartao);
        }

        return Result.ok<void>();
    }

    /** Applies the impact of an Entrada or Saída transaction. */
    public async applyEntradaSaidaImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.conta) return Result.fail<void>('Conta not found');
        const conta = await this.contaRepo.findById(transacao.conta.id.toString());
        if (!conta) return Result.fail<void>('Associated account not found');

        const applyResult = transacao.tipo.value === 'Entrada'
            ? conta.adicionarSaldo(transacao.valor)
            : conta.subtrairSaldo(transacao.valor);
        if (applyResult.isFailure) return Result.fail<void>(String(applyResult.error));

        await this.contaRepo.update(conta);
        return Result.ok<void>();
    }

    /**
     * Applies the impact of a Crédito transaction. The payment account is always debited, mirroring the money
     * leaving the account at purchase time. The card's saldoUtilizado only tracks unpaid charges, so it is only
     * increased while the transaction is Pendente.
     *
     * The auto-generated "Pagamento X" record (isPagamentoCartao) is exempt: editing it must never move money on
     * either the account or the card, since it is only a record of a payment already applied by pagarCartao.
     */
    public async applyCreditoImpact(transacao: Transacao): Promise<Result<void>> {
        if (transacao.isPagamentoCartao) return Result.ok<void>();
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found');

        const applyAccountResult = contaPagamento.subtrairSaldo(transacao.valor);
        if (applyAccountResult.isFailure) return Result.fail<void>(String(applyAccountResult.error));
        await this.contaRepo.update(contaPagamento);

        if (transacao.status.value === 'Pendente') {
            const applyCardResult = cartao.adicionarUtilizacao(transacao.valor);
            if (applyCardResult.isFailure) return Result.fail<void>(String(applyCardResult.error));
            await this.cartaoCreditoRepo.update(cartao);
        }

        return Result.ok<void>();
    }

    /**
     * Applies the impact of a Reembolso transaction. The payment account is always credited with the refund. The
     * card's saldoUtilizado reduction only takes effect while the transaction is Pendente.
     */
    public async applyReembolsoImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found');

        const applyAccountResult = contaPagamento.adicionarSaldo(transacao.valor);
        if (applyAccountResult.isFailure) return Result.fail<void>(String(applyAccountResult.error));
        await this.contaRepo.update(contaPagamento);

        if (transacao.status.value === 'Pendente') {
            const applyCardResult = cartao.reduzirUtilizacao(transacao.valor);
            if (applyCardResult.isFailure) return Result.fail<void>(String(applyCardResult.error));
            await this.cartaoCreditoRepo.update(cartao);
        }

        return Result.ok<void>();
    }

    /**
     * Updates an existing Transacao with new values.
     */
    public async updateTransacao(id: string, updateDTO: ITransacaoUpdateDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const existing = await this.transacaoRepo.findById(id);
            if (!existing) return Result.fail<ITransacaoDTO>(`Transaction not found: ${id}`);

            const tipo = existing.tipo.value;

            // STEP 1: Revert the impact of the OLD transaction
            let revertResult: Result<void>;
            switch (tipo) {
                case 'Entrada':
                case 'Saída':
                    revertResult = await this.revertEntradaSaidaImpact(existing);
                    break;
                case 'Crédito':
                    revertResult = await this.revertCreditoImpact(existing);
                    break;
                case 'Reembolso':
                    revertResult = await this.revertReembolsoImpact(existing);
                    break;
                case 'Despesa Mensal':
                case 'Despesa Semanal':
                case 'Despesa Anual':
                    revertResult = await this.transacaoDespesasRecorrentesService.revertDespesaRecorrenteImpact(existing);
                    break;
                case 'Poupança':
                    revertResult = await this.transacaoDespesasRecorrentesService.revertPoupancaImpact(existing);
                    break;
                default:
                    return Result.fail<ITransacaoDTO>(`Unknown transaction type: ${tipo}`);
            }

            if (revertResult.isFailure) return Result.fail<ITransacaoDTO>(String(revertResult.error));

            // STEP 2: Build updated transaction with new values
            const descricao = updateDTO.descricao ? Descricao.create(updateDTO.descricao).getValue() : existing.descricao;
            const valor = updateDTO.valor ? Dinheiro.create(updateDTO.valor.valor, updateDTO.valor.moeda).getValue() : existing.valor;
            const data = updateDTO.data ? Data.createFromParts(updateDTO.data.dia, updateDTO.data.mes, updateDTO.data.ano).getValue() : existing.data;
            const status = updateDTO.status ? Status.create(updateDTO.status).getValue() : existing.status;
            const tipoVO = updateDTO.tipo ? Tipo.create(updateDTO.tipo).getValue() : existing.tipo;

            let categoria = existing.categoria;
            if (updateDTO.categoriaId) {
                const cat = await this.categoriaRepo.findById(updateDTO.categoriaId);
                if (!cat) return Result.fail<ITransacaoDTO>('Category not found');
                categoria = cat;
            }

            const updatedOrError = Transacao.create({
                descricao,
                data,
                valor,
                tipo: tipoVO,
                categoria,
                status,
                conta: existing.conta,
                cartaoCredito: existing.cartaoCredito,
                contaDestino: existing.contaDestino,
                contaPoupanca: existing.contaPoupanca,
                isPagamentoCartao: existing.isPagamentoCartao
            }, existing.id);

            if (updatedOrError.isFailure) return Result.fail<ITransacaoDTO>(String(updatedOrError.error));
            const updatedTransacao = updatedOrError.getValue();

            (updatedTransacao as unknown as Record<string, unknown>)['userDomainId'] =
                (existing as unknown as Record<string, unknown>)['userDomainId'];

            // STEP 3: Apply the impact of the NEW transaction
            const newTipo = updatedTransacao.tipo.value;
            let applyResult: Result<void>;

            switch (newTipo) {
                case 'Entrada':
                case 'Saída':
                    applyResult = await this.applyEntradaSaidaImpact(updatedTransacao);
                    break;
                case 'Crédito':
                    applyResult = await this.applyCreditoImpact(updatedTransacao);
                    break;
                case 'Reembolso':
                    applyResult = await this.applyReembolsoImpact(updatedTransacao);
                    break;
                case 'Despesa Mensal':
                case 'Despesa Semanal':
                case 'Despesa Anual':
                    applyResult = await this.transacaoDespesasRecorrentesService.applyDespesaRecorrenteImpact(updatedTransacao);
                    break;
                case 'Poupança':
                    applyResult = await this.transacaoDespesasRecorrentesService.applyPoupancaImpact(updatedTransacao);
                    break;
                default:
                    return Result.fail<ITransacaoDTO>(`Unknown transaction type: ${newTipo}`);
            }

            if (applyResult.isFailure) return Result.fail<ITransacaoDTO>(String(applyResult.error));

            const savedUpdated = await this.transacaoRepo.update(updatedTransacao);

            return Result.ok<ITransacaoDTO>(await this.toEnrichedDTO(savedUpdated));
        } catch (e) {
            this.logger.error('TransacaoService.updateTransacao error: %o', e);
            return Result.fail<ITransacaoDTO>('Error updating transaction');
        }
    }

    /**
     * Deletes a Transacao by its unique identifier.
     */
    public async deleteTransacao(id: string): Promise<Result<boolean>> {
        try {
            const transacao = await this.transacaoRepo.findById(id);
            if (!transacao) return Result.fail<boolean>('Not found');

            const tipo = transacao.tipo.value;

            let revertResult: Result<void>;
            switch (tipo) {
                case 'Entrada':
                case 'Saída':
                    revertResult = await this.revertEntradaSaidaImpact(transacao);
                    break;
                case 'Crédito':
                    revertResult = await this.revertCreditoImpact(transacao);
                    break;
                case 'Reembolso':
                    revertResult = await this.revertReembolsoImpact(transacao);
                    break;
                case 'Despesa Mensal':
                case 'Despesa Semanal':
                case 'Despesa Anual':
                    revertResult = await this.transacaoDespesasRecorrentesService.revertDespesaRecorrenteImpact(transacao);
                    break;
                case 'Poupança':
                    revertResult = await this.transacaoDespesasRecorrentesService.revertPoupancaImpact(transacao);
                    break;
                default:
                    return Result.fail<boolean>(`Unknown transaction type: ${tipo}`);
            }

            if (revertResult.isFailure) return Result.fail<boolean>(String(revertResult.error));

            await this.transacaoRepo.delete(id);
            return Result.ok<boolean>(true);
        } catch (e) {
            this.logger.error('TransacaoService.deleteTransacao error: %o', e);
            return Result.fail<boolean>('Error deleting transaction');
        }
    }

    /**
     * Finds a Transacao by its unique identifier.
     */
    public async findTransacaoById(id: string): Promise<Result<ITransacaoDTO>> {
        try {
            const t = await this.transacaoRepo.findById(id);
            if (!t) return Result.fail<ITransacaoDTO>('Transaction not found');
            return Result.ok<ITransacaoDTO>(await this.toEnrichedDTO(t));
        } catch (e) {
            this.logger.error('TransacaoService.findTransacaoById error: %o', e);
            return Result.fail<ITransacaoDTO>('Error fetching transaction');
        }
    }
}
