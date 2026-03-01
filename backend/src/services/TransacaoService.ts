import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type {
    ITransacaoDTO,
    ITransacaoInputDTO,
    ITransacaoReembolsoDTO,
    ITransacaoUpdateDTO
} from '../dto/ITransacaoDTO.js';
import type ITransacaoService from './IServices/ITransacaoService.js';
import type ITransacaoRepo from '../repos/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import type IContaRepo from '../repos/IRepos/IContaRepo.js';
import type ICartaoCreditoRepo from '../repos/IRepos/ICartaoCreditoRepo.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../domain/Shared/ValueObjects/Data.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Tipo } from '../domain/Transacao/ValueObjects/Tipo.js';
import { TransacaoMap } from '../mappers/TransacaoMap.js';
import {Status} from "../domain/Transacao/ValueObjects/Status.js";

/**
 * Service class responsible for handling all business logic related to Transacao entities, including creation, updates, deletions, and queries.
 * This class interacts with the Transacao repository for data persistence, as well as the Categoria and Conta repositories for related entity lookups.
 * Each method returns a Result type, encapsulating success or failure and providing consistent error handling across the service.
 */
@Service()
export default class TransacaoService implements ITransacaoService {
    constructor(
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('CartaoCreditoRepo') private cartaoCreditoRepo: ICartaoCreditoRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    // --- Creation Methods ---

    /**
     * Creates a new "Entrada" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities.
     * Entrada only applies to Conta (bank accounts), not credit cards.
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
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            // Entrada requires a Conta (account), not a credit card
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

            // attach owner user id (non-domain prop) so persistence includes user_domain_id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            // Entrada increases account balance
            const balanceResult = conta.adicionarSaldo(transacao.valor);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            const savedTransacao = await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createEntrada error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating entrada');
        }
    }

    /**
     * Creates a new "Saida" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities, and ensures that the transaction can be registered with the account's balance.
     * Saida only applies to Conta (bank accounts), not credit cards.
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
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            // Saida requires a Conta (account), not a credit card
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

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            // Saida decreases account balance
            const balanceResult = conta.subtrairSaldo(transacao.valor);
            if (balanceResult.isFailure) return Result.fail<ITransacaoDTO>(String(balanceResult.error));

            const savedTransacao = await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createSaida error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating saida');
        }
    }

    /**
     * Creates a new "Credito" type Transacao. This method receives a cartaoCreditoId,
     * gets the associated payment account, adds to card utilization and subtracts from account balance.
     * @param inputDTO - The data transfer object containing the necessary information to create a Credito transaction (requires cartaoCreditoId)
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

            // Credito requires cartaoCreditoId
            if (!inputDTO.cartaoCreditoId) {
                return Result.fail<ITransacaoDTO>('cartaoCreditoId is required for Credito');
            }

            const cartaoCredito = await this.cartaoCreditoRepo.findById(inputDTO.cartaoCreditoId);
            if (!cartaoCredito) return Result.fail<ITransacaoDTO>('Target Credit Card not found');

            // Get the associated payment account from the card
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

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = userId;

            // Crédito: add to card utilization and subtract from account balance
            const addToCardResult = cartaoCredito.adicionarUtilizacao(transacao.valor);
            if (addToCardResult.isFailure) return Result.fail<ITransacaoDTO>(String(addToCardResult.error));

            const subtractFromAccountResult = conta.subtrairSaldo(transacao.valor);
            if (subtractFromAccountResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractFromAccountResult.error));

            await this.cartaoCreditoRepo.update(cartaoCredito);
            await this.contaRepo.update(conta);

            const savedTransacao = await this.transacaoRepo.save(transacao);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createCredito error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating credito');
        }
    }

    /**
     * Creates a new "Reembolso" type Transacao. This method receives a cartaoCreditoId,
     * gets the associated payment account, adds to the account balance and subtracts from card utilization.
     * @param inputDTO - The data transfer object containing the necessary information to create a Reembolso transaction (requires cartaoCreditoId)
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

            // Reembolso requires cartaoCreditoId
            if (!inputDTO.cartaoCreditoId) {
                return Result.fail<ITransacaoDTO>('cartaoCreditoId is required for Reembolso');
            }

            const cartaoCredito = await this.cartaoCreditoRepo.findById(inputDTO.cartaoCreditoId);
            if (!cartaoCredito) return Result.fail<ITransacaoDTO>('Target Credit Card not found');

            // Get the associated payment account from the card
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

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = userId;

            // Reembolso: add to account balance and subtract from card utilization
            const addToAccountResult = conta.adicionarSaldo(transacao.valor);
            if (addToAccountResult.isFailure) return Result.fail<ITransacaoDTO>(String(addToAccountResult.error));

            const subtractFromCardResult = cartaoCredito.reduzirUtilizacao(transacao.valor);
            if (subtractFromCardResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractFromCardResult.error));

            await this.contaRepo.update(conta);
            await this.cartaoCreditoRepo.update(cartaoCredito);

            const savedTransacao = await this.transacaoRepo.save(transacao);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createReembolso error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating reembolso');
        }
    }

    /**
     * Creates a new "Despesa Mensal" type Transacao based on the provided input DTO. This method validates the input,
     * checks for the existence of related Categoria and Conta entities, and ensures that the transaction can be registered with the account's balance.
     * Despesa Mensal only applies to Conta (bank accounts), not credit cards.
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
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            // Despesa Mensal requires both contaId (origin) and contaDestinoId (destination)
            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Origin Account (contaId) is required for Despesa Mensal');
            if (!inputDTO.contaDestinoId) return Result.fail<ITransacaoDTO>('Destination Account (contaDestinoId) is required for Despesa Mensal');
            if (inputDTO.cartaoCreditoId) return Result.fail<ITransacaoDTO>('Despesa Mensal cannot be applied to credit cards');

            const conta = await this.contaRepo.findById(inputDTO.contaId);
            if (!conta) return Result.fail<ITransacaoDTO>('Origin Account not found');

            const contaDestino = await this.contaRepo.findById(inputDTO.contaDestinoId);
            if (!contaDestino) return Result.fail<ITransacaoDTO>('Destination Account not found');

            const transacaoOrError = Transacao.createDespesaMensal({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria: categoria,
                conta: conta,
                contaDestino: contaDestino
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            // attach owner user id
            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            // Save transaction first
            const savedTransacao = await this.transacaoRepo.save(transacao);

            // Load fresh account instances from repo to avoid shared object references
            const contaOrigemFresh = await this.contaRepo.findById(inputDTO.contaId);
            const contaDestinoFresh = await this.contaRepo.findById(inputDTO.contaDestinoId!);
            if (!contaOrigemFresh) return Result.fail<ITransacaoDTO>('Origin Account not found after save');
            if (!contaDestinoFresh) return Result.fail<ITransacaoDTO>('Destination Account not found after save');

            // Subtract from origin account
            const subtractResult = contaOrigemFresh.subtrairSaldo(transacao.valor);
            if (subtractResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractResult.error));

            // Add to destination account
            const addResult = contaDestinoFresh.adicionarSaldo(transacao.valor);
            if (addResult.isFailure) return Result.fail<ITransacaoDTO>(String(addResult.error));

            await this.contaRepo.update(contaOrigemFresh);
            await this.contaRepo.update(contaDestinoFresh);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createDespesaMensal error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating despesa mensal');
        }
    }

    /**
     * Concludes a monthly expense that is in "Pendente" status. Changes status to "Concluído" and subtracts
     * the amount from the destination account (contaDestino).
     * @param transacaoId - The domain ID of the Despesa Mensal transaction to conclude
     * @returns A Result object containing either the updated Transacao DTO or an error message
     */
    public async concluirDespesaMensal(transacaoId: string): Promise<Result<ITransacaoDTO>> {
        try {
            const transacao = await this.transacaoRepo.findById(transacaoId);
            if (!transacao) return Result.fail<ITransacaoDTO>('Transaction not found');

            if (transacao.tipo.value !== 'Despesa Mensal') {
                return Result.fail<ITransacaoDTO>('Transaction is not a Despesa Mensal');
            }

            if (transacao.status.value !== 'Pendente') {
                return Result.fail<ITransacaoDTO>('Transaction is not in Pendente status');
            }

            if (!transacao.contaDestino) {
                return Result.fail<ITransacaoDTO>('Destination account not found for this transaction');
            }

            // Change status to Concluído by recreating the transaction
            const statusResult = Status.create('Concluído');
            if (statusResult.isFailure) return Result.fail<ITransacaoDTO>(String(statusResult.error));

            // Recreate transacao with new status
            const updatedTransacaoOrError = Transacao.create({
                descricao: transacao.descricao,
                data: transacao.data,
                valor: transacao.valor,
                tipo: transacao.tipo,
                categoria: transacao.categoria,
                status: statusResult.getValue(),
                conta: transacao.conta,
                contaDestino: transacao.contaDestino,
                cartaoCredito: transacao.cartaoCredito
            }, transacao.id);

            if (updatedTransacaoOrError.isFailure) {
                return Result.fail<ITransacaoDTO>(String(updatedTransacaoOrError.error));
            }

            const updatedTransacao = updatedTransacaoOrError.getValue();

            // Attach user domain id
            (updatedTransacao as unknown as Record<string, unknown>)['userDomainId'] =
                (transacao as unknown as Record<string, unknown>)['userDomainId'];

            // Balances were already updated when the transaction was created (subtract from origem, add to destino).
            // Concluding only changes the status — no balance changes needed.
            const savedTransacao = await this.transacaoRepo.update(updatedTransacao);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.concluirDespesaMensal error: %o', e);
            return Result.fail<ITransacaoDTO>('Error concluding despesa mensal');
        }
    }

    /**
     * Creates a Poupança transaction — transfers money from origin account to a savings account.
     */
    public async createPoupanca(inputDTO: ITransacaoInputDTO): Promise<Result<ITransacaoDTO>> {
        try {
            const descricaoResult = Descricao.create(inputDTO.descricao ?? '');
            const dataResult = Data.createFromParts(inputDTO.data.dia, inputDTO.data.mes, inputDTO.data.ano);
            const dinheiroResult = Dinheiro.create(Number(inputDTO.valor.valor), String(inputDTO.valor.moeda ?? 'EUR'));

            const combine = Result.combine([descricaoResult, dataResult, dinheiroResult]);
            if (combine.isFailure) return Result.fail<ITransacaoDTO>(String(combine.error));

            const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
            if (!categoria) return Result.fail<ITransacaoDTO>('Target Category not found');

            if (!inputDTO.contaId) return Result.fail<ITransacaoDTO>('Origin Account (contaId) is required for Poupança');
            if (!inputDTO.contaDestinoId) return Result.fail<ITransacaoDTO>('Destination Account (contaDestinoId) is required for Poupança');
            if (!inputDTO.contaPoupancaId) return Result.fail<ITransacaoDTO>('Savings Account (contaPoupancaId) is required for Poupança');
            if (inputDTO.cartaoCreditoId) return Result.fail<ITransacaoDTO>('Poupança cannot be applied to credit cards');

            const conta = await this.contaRepo.findById(inputDTO.contaId);
            if (!conta) return Result.fail<ITransacaoDTO>('Origin Account not found');

            const contaDestino = await this.contaRepo.findById(inputDTO.contaDestinoId);
            if (!contaDestino) return Result.fail<ITransacaoDTO>('Destination Account (Despesas Mensais) not found');

            const contaPoupanca = await this.contaRepo.findById(inputDTO.contaPoupancaId);
            if (!contaPoupanca) return Result.fail<ITransacaoDTO>('Savings Account not found');

            const transacaoOrError = Transacao.createPoupanca({
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                categoria,
                conta,
                contaDestino,
                contaPoupanca
            });

            if (transacaoOrError.isFailure) return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
            const transacao = transacaoOrError.getValue();

            (transacao as unknown as Record<string, unknown>)['userDomainId'] = inputDTO.userId ?? conta.userId.toString();

            // Pendente: subtrair da conta origem, adicionar à contaDestino (Despesas Mensais)
            const subtractResult = conta.subtrairSaldo(transacao.valor);
            if (subtractResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractResult.error));
            const addDestinoResult = contaDestino.adicionarSaldo(transacao.valor);
            if (addDestinoResult.isFailure) return Result.fail<ITransacaoDTO>(String(addDestinoResult.error));

            const savedTransacao = await this.transacaoRepo.save(transacao);
            await this.contaRepo.update(conta);
            await this.contaRepo.update(contaDestino);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
        } catch (e) {
            this.logger.error('TransacaoService.createPoupanca error: %o', e);
            return Result.fail<ITransacaoDTO>('Error creating poupança');
        }
    }

    /**
     * Concludes a Poupança that is in "Pendente" status.
     * Changes status to "Concluído" and adds the amount to the savings account (contaPoupanca).
     */
    public async concluirPoupanca(transacaoId: string): Promise<Result<ITransacaoDTO>> {
        try {
            const transacao = await this.transacaoRepo.findById(transacaoId);
            if (!transacao) return Result.fail<ITransacaoDTO>('Transaction not found');

            if (transacao.tipo.value !== 'Poupança') {
                return Result.fail<ITransacaoDTO>('Transaction is not a Poupança');
            }

            if (transacao.status.value !== 'Pendente') {
                return Result.fail<ITransacaoDTO>('Transaction is not in Pendente status');
            }

            if (!transacao.contaPoupanca) {
                return Result.fail<ITransacaoDTO>('Savings account not found for this transaction');
            }

            const statusResult = Status.create('Concluído');
            if (statusResult.isFailure) return Result.fail<ITransacaoDTO>(String(statusResult.error));

            const updatedOrError = Transacao.create({
                descricao: transacao.descricao,
                data: transacao.data,
                valor: transacao.valor,
                tipo: transacao.tipo,
                categoria: transacao.categoria,
                status: statusResult.getValue(),
                conta: transacao.conta,
                contaDestino: transacao.contaDestino,
                contaPoupanca: transacao.contaPoupanca,
                cartaoCredito: transacao.cartaoCredito
            }, transacao.id);

            if (updatedOrError.isFailure) return Result.fail<ITransacaoDTO>(String(updatedOrError.error));
            const updated = updatedOrError.getValue();

            (updated as unknown as Record<string, unknown>)['userDomainId'] =
                (transacao as unknown as Record<string, unknown>)['userDomainId'];

            // Subtrair da contaDestino (Despesas Mensais) ao concluir
            if (transacao.contaDestino) {
                const subtractDestinoResult = transacao.contaDestino.subtrairSaldo(transacao.valor);
                if (subtractDestinoResult.isFailure) return Result.fail<ITransacaoDTO>(String(subtractDestinoResult.error));
                await this.contaRepo.update(transacao.contaDestino);
            }

            // Adicionar à conta poupança real
            const addResult = transacao.contaPoupanca.adicionarSaldo(transacao.valor);
            if (addResult.isFailure) return Result.fail<ITransacaoDTO>(String(addResult.error));
            await this.contaRepo.update(transacao.contaPoupanca);

            const saved = await this.transacaoRepo.update(updated);
            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(saved));
        } catch (e) {
            this.logger.error('TransacaoService.concluirPoupanca error: %o', e);
            return Result.fail<ITransacaoDTO>('Error concluding poupança');
        }
    }    // --- Update & Delete ---

    /**
     * Reverts the impact of an Entrada or Saída transaction
     */
    private async revertEntradaSaidaImpact(transacao: Transacao): Promise<Result<void>> {
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
     * Reverts the impact of a Crédito transaction (affects both card and payment account)
     */
    private async revertCreditoImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found for Crédito');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        // Revert: reduce card utilization
        const revertCardResult = cartao.reduzirUtilizacao(transacao.valor);
        if (revertCardResult.isFailure) return Result.fail<void>(String(revertCardResult.error));

        // Revert: add back to payment account
        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found for credit card');
        const revertAccountResult = contaPagamento.adicionarSaldo(transacao.valor);
        if (revertAccountResult.isFailure) return Result.fail<void>(String(revertAccountResult.error));

        await this.cartaoCreditoRepo.update(cartao);
        await this.contaRepo.update(contaPagamento);
        return Result.ok<void>();
    }

    /**
     * Reverts the impact of a Reembolso transaction (affects both card and payment account)
     */
    private async revertReembolsoImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found for Reembolso');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        // Revert: add back card utilization
        const revertCardResult = cartao.adicionarUtilizacao(transacao.valor);
        if (revertCardResult.isFailure) return Result.fail<void>(String(revertCardResult.error));

        // Revert: subtract from payment account
        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found for credit card');
        const revertAccountResult = contaPagamento.subtrairSaldo(transacao.valor);
        if (revertAccountResult.isFailure) return Result.fail<void>(String(revertAccountResult.error));

        await this.cartaoCreditoRepo.update(cartao);
        await this.contaRepo.update(contaPagamento);
        return Result.ok<void>();
    }

    /**
     * Reverts the impact of a Despesa Mensal transaction (affects two accounts)
     */
    private async revertDespesaMensalImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.conta) return Result.fail<void>('Conta origem not found for Despesa Mensal');
        if (!transacao.contaDestino) return Result.fail<void>('Conta destino not found for Despesa Mensal');

        const contaOrigem = await this.contaRepo.findById(transacao.conta.id.toString());
        const contaDestino = await this.contaRepo.findById(transacao.contaDestino.id.toString());
        if (!contaOrigem) return Result.fail<void>('Origin account not found');
        if (!contaDestino) return Result.fail<void>('Destination account not found');

        // Impact is always: subtract origem + add destino (applied at creation, regardless of status)
        // Revert is always the opposite: add back to origem + subtract from destino
        const revertOrigemResult = contaOrigem.adicionarSaldo(transacao.valor);
        if (revertOrigemResult.isFailure) return Result.fail<void>(String(revertOrigemResult.error));

        const revertDestinoResult = contaDestino.subtrairSaldo(transacao.valor);
        if (revertDestinoResult.isFailure) return Result.fail<void>(String(revertDestinoResult.error));

        await this.contaRepo.update(contaOrigem);
        await this.contaRepo.update(contaDestino);
        return Result.ok<void>();
    }

    /**
     * Applies the impact of an Entrada or Saída transaction
     */
    private async applyEntradaSaidaImpact(transacao: Transacao): Promise<Result<void>> {
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
     * Applies the impact of a Crédito transaction (affects both card and payment account)
     */
    private async applyCreditoImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        // Apply: add to card utilization
        const applyCardResult = cartao.adicionarUtilizacao(transacao.valor);
        if (applyCardResult.isFailure) return Result.fail<void>(String(applyCardResult.error));

        // Apply: subtract from payment account
        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found');
        const applyAccountResult = contaPagamento.subtrairSaldo(transacao.valor);
        if (applyAccountResult.isFailure) return Result.fail<void>(String(applyAccountResult.error));

        await this.cartaoCreditoRepo.update(cartao);
        await this.contaRepo.update(contaPagamento);
        return Result.ok<void>();
    }

    /**
     * Applies the impact of a Reembolso transaction (affects both card and payment account)
     */
    private async applyReembolsoImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.cartaoCredito) return Result.fail<void>('CartaoCredito not found');
        const cartao = await this.cartaoCreditoRepo.findById(transacao.cartaoCredito.id.toString());
        if (!cartao) return Result.fail<void>('Associated credit card not found');

        // Apply: reduce card utilization
        const applyCardResult = cartao.reduzirUtilizacao(transacao.valor);
        if (applyCardResult.isFailure) return Result.fail<void>(String(applyCardResult.error));

        // Apply: add to payment account
        if (!cartao.contaPagamentoId) return Result.fail<void>('Payment account ID not found for credit card');
        const contaPagamento = await this.contaRepo.findById(cartao.contaPagamentoId.toString());
        if (!contaPagamento) return Result.fail<void>('Payment account not found');
        const applyAccountResult = contaPagamento.adicionarSaldo(transacao.valor);
        if (applyAccountResult.isFailure) return Result.fail<void>(String(applyAccountResult.error));

        await this.cartaoCreditoRepo.update(cartao);
        await this.contaRepo.update(contaPagamento);
        return Result.ok<void>();
    }

    /**
     * Applies the impact of a Despesa Mensal transaction (affects two accounts).
     * Always: subtract from origem, add to destino.
     */
    private async applyDespesaMensalImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.conta) return Result.fail<void>('Conta origem not found');
        if (!transacao.contaDestino) return Result.fail<void>('Conta destino not found');

        const contaOrigem = await this.contaRepo.findById(transacao.conta.id.toString());
        const contaDestino = await this.contaRepo.findById(transacao.contaDestino.id.toString());
        if (!contaOrigem) return Result.fail<void>('Origin account not found');
        if (!contaDestino) return Result.fail<void>('Destination account not found');

        const applyOrigemResult = contaOrigem.subtrairSaldo(transacao.valor);
        if (applyOrigemResult.isFailure) return Result.fail<void>(String(applyOrigemResult.error));

        const applyDestinoResult = contaDestino.adicionarSaldo(transacao.valor);
        if (applyDestinoResult.isFailure) return Result.fail<void>(String(applyDestinoResult.error));

        await this.contaRepo.update(contaOrigem);
        await this.contaRepo.update(contaDestino);
        return Result.ok<void>();
    }

    /**
     * Reverts the impact of a Poupança transaction
     * Pendente: origem foi subtraída + contaDestino foi adicionada
     * Concluído: acima + contaPoupanca foi adicionada
     */
    private async revertPoupancaImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.conta) return Result.fail<void>('Conta origem not found for Poupança');

        const contaOrigem = await this.contaRepo.findById(transacao.conta.id.toString());
        if (!contaOrigem) return Result.fail<void>('Origin account not found');

        // Sempre: adicionar de volta à origem
        const revertOrigemResult = contaOrigem.adicionarSaldo(transacao.valor);
        if (revertOrigemResult.isFailure) return Result.fail<void>(String(revertOrigemResult.error));
        await this.contaRepo.update(contaOrigem);

        // Sempre: subtrair da contaDestino (Despesas Mensais) — foi adicionada ao criar
        if (transacao.contaDestino) {
            const contaDestino = await this.contaRepo.findById(transacao.contaDestino.id.toString());
            if (contaDestino) {
                const revertDestinoResult = contaDestino.subtrairSaldo(transacao.valor);
                if (revertDestinoResult.isFailure) return Result.fail<void>(String(revertDestinoResult.error));
                await this.contaRepo.update(contaDestino);
            }
        }

        // Se Concluído: subtrair da contaPoupanca (foi adicionada ao concluir)
        if (transacao.status.value === 'Concluído' && transacao.contaPoupanca) {
            const contaPoupanca = await this.contaRepo.findById(transacao.contaPoupanca.id.toString());
            if (!contaPoupanca) return Result.fail<void>('Savings account not found');
            const revertPoupancaResult = contaPoupanca.subtrairSaldo(transacao.valor);
            if (revertPoupancaResult.isFailure) return Result.fail<void>(String(revertPoupancaResult.error));
            await this.contaRepo.update(contaPoupanca);
        }

        return Result.ok<void>();
    }

    /**
     * Applies the impact of a Poupança transaction
     * Pendente: subtrair da origem + adicionar à contaDestino
     * Concluído: acima + adicionar à contaPoupanca
     */
    private async applyPoupancaImpact(transacao: Transacao): Promise<Result<void>> {
        if (!transacao.conta) return Result.fail<void>('Conta origem not found');

        const contaOrigem = await this.contaRepo.findById(transacao.conta.id.toString());
        if (!contaOrigem) return Result.fail<void>('Origin account not found');

        // Sempre: subtrair da origem
        const applyOrigemResult = contaOrigem.subtrairSaldo(transacao.valor);
        if (applyOrigemResult.isFailure) return Result.fail<void>(String(applyOrigemResult.error));
        await this.contaRepo.update(contaOrigem);

        // Sempre: adicionar à contaDestino (Despesas Mensais)
        if (transacao.contaDestino) {
            const contaDestino = await this.contaRepo.findById(transacao.contaDestino.id.toString());
            if (contaDestino) {
                const applyDestinoResult = contaDestino.adicionarSaldo(transacao.valor);
                if (applyDestinoResult.isFailure) return Result.fail<void>(String(applyDestinoResult.error));
                await this.contaRepo.update(contaDestino);
            }
        }

        // Se Concluído: adicionar à contaPoupanca
        if (transacao.status.value === 'Concluído' && transacao.contaPoupanca) {
            const contaPoupanca = await this.contaRepo.findById(transacao.contaPoupanca.id.toString());
            if (!contaPoupanca) return Result.fail<void>('Savings account not found');
            const applyPoupancaResult = contaPoupanca.adicionarSaldo(transacao.valor);
            if (applyPoupancaResult.isFailure) return Result.fail<void>(String(applyPoupancaResult.error));
            await this.contaRepo.update(contaPoupanca);
        }

        return Result.ok<void>();
    }

    /**
     * Updates an existing Transacao with new values provided in the update DTO.
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
                    revertResult = await this.revertDespesaMensalImpact(existing);
                    break;
                case 'Poupança':
                    revertResult = await this.revertPoupancaImpact(existing);
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
                contaDestino: existing.contaDestino
            }, existing.id);

            if (updatedOrError.isFailure) return Result.fail<ITransacaoDTO>(String(updatedOrError.error));
            const updatedTransacao = updatedOrError.getValue();

            // Attach userDomainId
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
                    applyResult = await this.applyDespesaMensalImpact(updatedTransacao);
                    break;
                case 'Poupança':
                    applyResult = await this.applyPoupancaImpact(updatedTransacao);
                    break;
                default:
                    return Result.fail<ITransacaoDTO>(`Unknown transaction type: ${newTipo}`);
            }

            if (applyResult.isFailure) return Result.fail<ITransacaoDTO>(String(applyResult.error));

            const savedUpdated = await this.transacaoRepo.update(updatedTransacao);

            return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedUpdated));
        } catch (e) {
            this.logger.error('TransacaoService.updateTransacao error: %o', e);
            return Result.fail<ITransacaoDTO>('Error updating transaction');
        }
    }

    /**
     * Deletes a Transacao by its unique identifier.
     * Properly handles transactions affecting multiple accounts/cards (Crédito, Reembolso, Despesa Mensal).
     * @param id - The unique identifier of the Transacao to delete
     * @returns A Result object containing either a boolean indicating successful deletion or an error message
     */
    public async deleteTransacao(id: string): Promise<Result<boolean>> {
        try {
            const transacao = await this.transacaoRepo.findById(id);
            if (!transacao) return Result.fail<boolean>('Not found');

            const tipo = transacao.tipo.value;

            // Revert the impact of the transaction based on its type
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
                    revertResult = await this.revertDespesaMensalImpact(transacao);
                    break;
                case 'Poupança':
                    revertResult = await this.revertPoupancaImpact(transacao);
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

    // --- Update & Delete ---

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
     * Finds Entrada/Saída transactions by categoria across all accounts.
     * @param categoriaId - The unique identifier of the Categoria to find transactions for
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findContaTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findContaTransactionsByCategoria(categoriaId, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findContaTransactionsByCategoria error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions by categoria');
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by categoria across all credit cards.
     * @param categoriaId - The unique identifier of the Categoria to find transactions for
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findCartaoTransactionsByCategoria(categoriaId: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findCartaoTransactionsByCategoria(categoriaId, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findCartaoTransactionsByCategoria error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions by categoria');
        }
    }

    /**
     * Finds recurring expense transactions (Despesa Mensal + Poupança) by category for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param categoriaId - The unique identifier of the Categoria to find transactions for
     * @param userId - Optional user identifier to filter transactions by user ownership
     */
    public async findDespesaRecorrenteByCategoria(bancoId: string, categoriaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findDespesaRecorrenteByCategoria(bancoId, categoriaId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findDespesaRecorrenteByCategoria error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching recurring expense transactions by category');
        }
    }

    /**
     * Finds Crédito and Reembolso transactions with a specific status across all credit cards.
     * @param status - The status of transactions to find (e.g., "Pendente", "Concluído")
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findCartaoTransactionsByStatus(status: string, userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findCartaoTransactionsByStatus(status, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findCartaoTransactionsByStatus error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions by status');
        }
    }

    /**
     * Finds recurring expense transactions (Despesa Mensal + Poupança) by status for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param status - The status of transactions to find (e.g., "Pendente", "Concluído")
     * @param userId - Optional user identifier to filter transactions by user ownership
     */
    public async findDespesaRecorrenteByStatus(bancoId: string, status: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findDespesaRecorrenteByStatus(bancoId, status, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findDespesaRecorrenteByStatus error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching recurring expense transactions by status');
        }
    }

    /**
     * Finds Entrada/Saída transactions by predefined period across all accounts.
     * @param period - The period to filter by: 'Este Mês', 'Últimos 3 Meses', or 'Último Ano'
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findContaTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findContaTransactionsByPeriod(period, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findContaTransactionsByPeriod error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions by period');
        }
    }

    /**
     * Finds Crédito/Reembolso transactions by predefined period across all credit cards.
     * @param period - The period to filter by: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano'
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findCartaoTransactionsByPeriod(period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findCartaoTransactionsByPeriod(period, userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findCartaoTransactionsByPeriod error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions by period');
        }
    }

    /**
     * Finds recurring expense transactions (Despesa Mensal + Poupança) by predefined period for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param period - The period to filter by: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano'
     * @param userId - Optional user identifier to filter transactions by user ownership
     */
    public async findDespesaRecorrenteByPeriod(bancoId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findDespesaRecorrenteByPeriod(bancoId, period, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findDespesaRecorrenteByPeriod error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching recurring expense transactions by period');
        }
    }

    /**
     * Finds all Entrada and Saída transactions (conta-based) for a specific account.
     * @param contaId - The domain id of the Conta to filter transactions by.
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of conta transaction DTOs or an error message
     */
    public async findContaTransactions(contaId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findContaTransactions(contaId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findContaTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching conta transactions');
        }
    }

    /**
     * Finds all Crédito and Reembolso transactions (cartão-based) for a specific credit card.
     * @param cartaoCreditoId - The domain id of the CartaoCredito to filter transactions by.
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of cartão transaction DTOs or an error message
     */
    public async findCartaoTransactions(cartaoCreditoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findCartaoTransactions(cartaoCreditoId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findCartaoTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching cartão transactions');
        }
    }

    /**
     * Finds all recurring expense transactions (Despesa Mensal + Poupança) for a specific bank.
     * @param bancoId - The domain id of the Banco to filter transactions by.
     * @param userId - Optional user identifier to filter transactions by user ownership
     * @returns A Result object containing either an array of despesa mensal DTOs or an error message
     */
    public async findDespesaRecorrente(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findDespesaRecorrente(bancoId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findDespesaRecorrente error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching recurring expense transactions');
        }
    }

    /**
     * Finds ALL Entrada and Saída transactions across every account (no contaId filter).
     * @param userId - Optional user identifier to filter by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findAllContaTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findAllContaTransactions(userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findAllContaTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching all conta transactions');
        }
    }

    /**
     * Finds ALL Crédito and Reembolso transactions across every credit card (no cartaoCreditoId filter).
     * @param userId - Optional user identifier to filter by user ownership
     * @param bancoId - Optional banco domain id to filter by bank
     */
    public async findAllCartaoTransactions(userId?: string, bancoId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findAllCartaoTransactions(userId, bancoId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findAllCartaoTransactions error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching all cartão transactions');
        }
    }

    /**
     * Finds ALL transactions for a specific banco (admin/tools). This returns all transactions where either the conta or cartaoCredito belongs to the banco.
     * This method intentionally does not enforce user ownership and is intended for administrative use.
     * @param bancoId - Domain id of the banco (required).
     * @param userId - Optional user identifier to filter by user ownership (if provided, will only return transactions for that user's accounts/cards within the banco)
     */
    public async findAllByBanco(bancoId: string, userId?: string): Promise<Result<ITransacaoDTO[]>> {
        try {
            const rows: Transacao[] = await this.transacaoRepo.findAllByBanco(bancoId, userId);
            return Result.ok<ITransacaoDTO[]>(rows.map((r: Transacao) => TransacaoMap.toDTO(r)));
        } catch (e) {
            this.logger.error('TransacaoService.findAllByBanco error: %o', e);
            return Result.fail<ITransacaoDTO[]>('Error fetching transactions for banco');
        }
    }
}
