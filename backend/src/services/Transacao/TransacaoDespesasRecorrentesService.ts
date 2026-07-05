import { Service, Inject } from "typedi";
import { Result } from "../../core/logic/Result.js";
import type {
  ITransacaoDTO,
  ITransacaoInputDTO,
} from "../../dto/ITransacaoDTO.js";
import type ITransacaoDespesasRecorrentesService from "./IServices/ITransacaoDespesasRecorrentesService.js";
import type ITransacaoRepo from "../../repos/Transacao/IRepos/ITransacaoRepo.js";
import type ITransacaoDespesasRecorrentesRepo from "../../repos/Transacao/IRepos/ITransacaoDespesasRecorrentesRepo.js";
import type ICategoriaRepo from "../../repos/Categoria/ICategoriaRepo.js";
import type IContaRepo from "../../repos/Conta/IContaRepo.js";
import type ICartaoCreditoRepo from "../../repos/CartaoCredito/ICartaoCreditoRepo.js";
import { Transacao } from "../../domain/Transacao/Entities/Transacao.js";
import { Descricao } from "../../domain/Transacao/ValueObjects/Descricao.js";
import { Data } from "../../domain/Shared/ValueObjects/Data.js";
import { Dinheiro } from "../../domain/Shared/ValueObjects/Dinheiro.js";
import { TransacaoMap } from "../../mappers/TransacaoMap.js";
import { Status } from "../../domain/Transacao/ValueObjects/Status.js";

/**
 * Service class responsible for handling all business logic related to Transacao entities, including creation, updates, deletions, and queries.
 * This class interacts with the Transacao repository for data persistence, as well as the Categoria and Conta repositories for related entity lookups.
 * Each method returns a Result type, encapsulating success or failure and providing consistent error handling across the service.
 */
@Service()
export default class TransacaoDespesasRecorrentesService implements ITransacaoDespesasRecorrentesService {
  constructor(
    @Inject("TransacaoRepo") private transacaoRepo: ITransacaoRepo,
    @Inject("TransacaoDespesasRecorrentesRepo")
    private despesasRecorrentesRepo: ITransacaoDespesasRecorrentesRepo,
    @Inject("CategoriaRepo") private categoriaRepo: ICategoriaRepo,
    @Inject("ContaRepo") private contaRepo: IContaRepo,
    @Inject("CartaoCreditoRepo") private cartaoCreditoRepo: ICartaoCreditoRepo,
    @Inject("logger") private logger: { error: (...args: unknown[]) => void },
  ) {}

  /**
   * Creates a new "Despesa Mensal" type Transacao based on the provided input DTO. This method validates the input,
   * checks for the existence of related Categoria and Conta entities, and ensures that the transaction can be registered with the account's balance.
   * Despesa Mensal only applies to Conta (bank accounts), not credit cards.
   * @param inputDTO - The data transfer object containing the necessary information to create a Despesa Mensal transaction
   * @param imediata - If true the status is "Concluído" otherwise "Pendente"
   * @returns A Result object containing either the created Transacao DTO or an error message if the creation process
   * fails at any step, such as validation errors, missing related entities, or balance issues
   */
  public async createDespesaMensal(
    inputDTO: ITransacaoInputDTO,
    imediata?: boolean,
  ): Promise<Result<ITransacaoDTO>> {
    try {
      const descricaoResult = Descricao.create(inputDTO.descricao ?? "");
      const dataResult = Data.createFromParts(
        inputDTO.data.dia,
        inputDTO.data.mes,
        inputDTO.data.ano,
      );
      const dinheiroResult = Dinheiro.create(
        Number(inputDTO.valor.valor),
        String(inputDTO.valor.moeda ?? "EUR"),
      );

      const combine = Result.combine([
        descricaoResult,
        dataResult,
        dinheiroResult,
      ]);
      if (combine.isFailure)
        return Result.fail<ITransacaoDTO>(String(combine.error));

      const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
      if (!categoria)
        return Result.fail<ITransacaoDTO>("Target Category not found");

      if (!inputDTO.contaId)
        return Result.fail<ITransacaoDTO>(
          "Origin Account (contaId) is required for Despesa Mensal",
        );
      if (!imediata && !inputDTO.contaDestinoId)
        return Result.fail<ITransacaoDTO>(
          "Destination Account (contaDestinoId) is required for Despesa Mensal",
        );
      if (inputDTO.cartaoCreditoId)
        return Result.fail<ITransacaoDTO>(
          "Despesa Mensal cannot be applied to credit cards",
        );

      const conta = await this.contaRepo.findById(inputDTO.contaId);
      if (!conta) return Result.fail<ITransacaoDTO>("Origin Account not found");

      let contaDestino = null;
      if (!imediata) {
        contaDestino = await this.contaRepo.findById(inputDTO.contaDestinoId!);
        if (!contaDestino)
          return Result.fail<ITransacaoDTO>("Destination Account not found");
      }

      const transacaoOrError = Transacao.createDespesaMensal(
        {
          descricao: descricaoResult.getValue(),
          data: dataResult.getValue(),
          valor: dinheiroResult.getValue(),
          categoria: categoria,
          conta: conta,
          ...(contaDestino ? { contaDestino } : {}),
        },
        imediata ?? false,
      );

      if (transacaoOrError.isFailure)
        return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
      const transacao = transacaoOrError.getValue();

      (transacao as unknown as Record<string, unknown>)["userDomainId"] =
        inputDTO.userId ?? conta.userId.toString();

      const savedTransacao = await this.transacaoRepo.save(transacao);

      const contaOrigemFresh = await this.contaRepo.findById(inputDTO.contaId);
      if (!contaOrigemFresh)
        return Result.fail<ITransacaoDTO>(
          "Origin Account not found after save",
        );

      const subtractResult = contaOrigemFresh.subtrairSaldo(transacao.valor);
      if (subtractResult.isFailure)
        return Result.fail<ITransacaoDTO>(String(subtractResult.error));

      if (!imediata && contaDestino) {
        const contaDestinoFresh = await this.contaRepo.findById(
          inputDTO.contaDestinoId!,
        );
        if (!contaDestinoFresh)
          return Result.fail<ITransacaoDTO>(
            "Destination Account not found after save",
          );

        const addResult = contaDestinoFresh.adicionarSaldo(transacao.valor);
        if (addResult.isFailure)
          return Result.fail<ITransacaoDTO>(String(addResult.error));

        await this.contaRepo.update(contaDestinoFresh);
      }

      await this.contaRepo.update(contaOrigemFresh);

      return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
    } catch (e) {
      this.logger.error("TransacaoService.createDespesaMensal error: %o", e);
      return Result.fail<ITransacaoDTO>("Error creating despesa mensal");
    }
  }

  /**
   * Creates a new "Despesa Semanal" type Transacao based on the provided input DTO.
   * Despesa Semanal only applies to Conta (bank accounts), not credit cards.
   * @param inputDTO - The data transfer object containing the necessary information to create a Despesa Semanal transaction
   * @param imediata - If true the status is "Concluído" otherwise "Pendente"
   */
  public async createDespesaSemanal(
    inputDTO: ITransacaoInputDTO,
    imediata?: boolean,
  ): Promise<Result<ITransacaoDTO>> {
    try {
      const descricaoResult = Descricao.create(inputDTO.descricao ?? "");
      const dataResult = Data.createFromParts(
        inputDTO.data.dia,
        inputDTO.data.mes,
        inputDTO.data.ano,
      );
      const dinheiroResult = Dinheiro.create(
        Number(inputDTO.valor.valor),
        String(inputDTO.valor.moeda ?? "EUR"),
      );

      const combine = Result.combine([
        descricaoResult,
        dataResult,
        dinheiroResult,
      ]);
      if (combine.isFailure)
        return Result.fail<ITransacaoDTO>(String(combine.error));

      const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
      if (!categoria)
        return Result.fail<ITransacaoDTO>("Target Category not found");

      if (!inputDTO.contaId)
        return Result.fail<ITransacaoDTO>(
          "Origin Account (contaId) is required for Despesa Semanal",
        );
      if (!imediata && !inputDTO.contaDestinoId)
        return Result.fail<ITransacaoDTO>(
          "Destination Account (contaDestinoId) is required for Despesa Semanal",
        );
      if (inputDTO.cartaoCreditoId)
        return Result.fail<ITransacaoDTO>(
          "Despesa Semanal cannot be applied to credit cards",
        );

      const conta = await this.contaRepo.findById(inputDTO.contaId);
      if (!conta) return Result.fail<ITransacaoDTO>("Origin Account not found");

      let contaDestino = null;
      if (!imediata) {
        contaDestino = await this.contaRepo.findById(inputDTO.contaDestinoId!);
        if (!contaDestino)
          return Result.fail<ITransacaoDTO>("Destination Account not found");
      }

      const transacaoOrError = Transacao.createDespesaSemanal(
        {
          descricao: descricaoResult.getValue(),
          data: dataResult.getValue(),
          valor: dinheiroResult.getValue(),
          categoria: categoria,
          conta: conta,
          ...(contaDestino ? { contaDestino } : {}),
        },
        imediata ?? false,
      );

      if (transacaoOrError.isFailure)
        return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
      const transacao = transacaoOrError.getValue();

      (transacao as unknown as Record<string, unknown>)["userDomainId"] =
        inputDTO.userId ?? conta.userId.toString();

      const savedTransacao = await this.transacaoRepo.save(transacao);

      const contaOrigemFresh = await this.contaRepo.findById(inputDTO.contaId);
      if (!contaOrigemFresh)
        return Result.fail<ITransacaoDTO>(
          "Origin Account not found after save",
        );

      const subtractResult = contaOrigemFresh.subtrairSaldo(transacao.valor);
      if (subtractResult.isFailure)
        return Result.fail<ITransacaoDTO>(String(subtractResult.error));

      if (!imediata && contaDestino) {
        const contaDestinoFresh = await this.contaRepo.findById(
          inputDTO.contaDestinoId!,
        );
        if (!contaDestinoFresh)
          return Result.fail<ITransacaoDTO>(
            "Destination Account not found after save",
          );

        const addResult = contaDestinoFresh.adicionarSaldo(transacao.valor);
        if (addResult.isFailure)
          return Result.fail<ITransacaoDTO>(String(addResult.error));

        await this.contaRepo.update(contaDestinoFresh);
      }

      await this.contaRepo.update(contaOrigemFresh);

      return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
    } catch (e) {
      this.logger.error("TransacaoService.createDespesaSemanal error: %o", e);
      return Result.fail<ITransacaoDTO>("Error creating despesa semanal");
    }
  }

  /**
   * Creates a new "Despesa Anual" type Transacao based on the provided input DTO.
   * Despesa Anual only applies to Conta (bank accounts), not credit cards.
   * @param inputDTO - The data transfer object containing the necessary information to create a Despesa Anual transaction
   * @param imediata - If true the status is "Concluído" otherwise "Pendente"
   */
  public async createDespesaAnual(
    inputDTO: ITransacaoInputDTO,
    imediata?: boolean,
  ): Promise<Result<ITransacaoDTO>> {
    try {
      const descricaoResult = Descricao.create(inputDTO.descricao ?? "");
      const dataResult = Data.createFromParts(
        inputDTO.data.dia,
        inputDTO.data.mes,
        inputDTO.data.ano,
      );
      const dinheiroResult = Dinheiro.create(
        Number(inputDTO.valor.valor),
        String(inputDTO.valor.moeda ?? "EUR"),
      );

      const combine = Result.combine([
        descricaoResult,
        dataResult,
        dinheiroResult,
      ]);
      if (combine.isFailure)
        return Result.fail<ITransacaoDTO>(String(combine.error));

      const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
      if (!categoria)
        return Result.fail<ITransacaoDTO>("Target Category not found");

      if (!inputDTO.contaId)
        return Result.fail<ITransacaoDTO>(
          "Origin Account (contaId) is required for Despesa Anual",
        );
      if (!imediata && !inputDTO.contaDestinoId)
        return Result.fail<ITransacaoDTO>(
          "Destination Account (contaDestinoId) is required for Despesa Anual",
        );
      if (inputDTO.cartaoCreditoId)
        return Result.fail<ITransacaoDTO>(
          "Despesa Anual cannot be applied to credit cards",
        );

      const conta = await this.contaRepo.findById(inputDTO.contaId);
      if (!conta) return Result.fail<ITransacaoDTO>("Origin Account not found");

      let contaDestino = null;
      if (!imediata) {
        contaDestino = await this.contaRepo.findById(inputDTO.contaDestinoId!);
        if (!contaDestino)
          return Result.fail<ITransacaoDTO>("Destination Account not found");
      }

      const transacaoOrError = Transacao.createDespesaAnual(
        {
          descricao: descricaoResult.getValue(),
          data: dataResult.getValue(),
          valor: dinheiroResult.getValue(),
          categoria: categoria,
          conta: conta,
          ...(contaDestino ? { contaDestino } : {}),
        },
        imediata ?? false,
      );

      if (transacaoOrError.isFailure)
        return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
      const transacao = transacaoOrError.getValue();

      (transacao as unknown as Record<string, unknown>)["userDomainId"] =
        inputDTO.userId ?? conta.userId.toString();

      const savedTransacao = await this.transacaoRepo.save(transacao);

      const contaOrigemFresh = await this.contaRepo.findById(inputDTO.contaId);
      if (!contaOrigemFresh)
        return Result.fail<ITransacaoDTO>(
          "Origin Account not found after save",
        );

      const subtractResult = contaOrigemFresh.subtrairSaldo(transacao.valor);
      if (subtractResult.isFailure)
        return Result.fail<ITransacaoDTO>(String(subtractResult.error));

      if (!imediata && contaDestino) {
        const contaDestinoFresh = await this.contaRepo.findById(
          inputDTO.contaDestinoId!,
        );
        if (!contaDestinoFresh)
          return Result.fail<ITransacaoDTO>(
            "Destination Account not found after save",
          );

        const addResult = contaDestinoFresh.adicionarSaldo(transacao.valor);
        if (addResult.isFailure)
          return Result.fail<ITransacaoDTO>(String(addResult.error));

        await this.contaRepo.update(contaDestinoFresh);
      }

      await this.contaRepo.update(contaOrigemFresh);

      return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
    } catch (e) {
      this.logger.error("TransacaoService.createDespesaAnual error: %o", e);
      return Result.fail<ITransacaoDTO>("Error creating despesa anual");
    }
  }

  /**
   * Concludes a recurring expense that is in "Pendente" status. Changes status to "Concluído" and subtracts
   * the amount from the destination account (contaDestino).
   * @param transacaoId - The domain ID of the recurring expense transaction to conclude
   * @returns A Result object containing either the updated Transacao DTO or an error message
   */
  public async concluirDespesaRecorrente(
    transacaoId: string,
  ): Promise<Result<ITransacaoDTO>> {
    try {
      const transacao = await this.transacaoRepo.findById(transacaoId);
      if (!transacao)
        return Result.fail<ITransacaoDTO>("Transaction not found");

      const tipo = transacao.tipo.value;
      if (
        tipo !== "Despesa Mensal" &&
        tipo !== "Despesa Semanal" &&
        tipo !== "Despesa Anual" &&
        tipo !== "Poupança"
      ) {
        return Result.fail<ITransacaoDTO>(
          "Transaction is not a recurring expense",
        );
      }

      if (transacao.status.value !== "Pendente") {
        return Result.fail<ITransacaoDTO>(
          "Transaction is not in Pendente status",
        );
      }

      if (tipo === "Poupança") {
        return this.concluirPoupanca(transacaoId);
      } else {
        if (!transacao.contaDestino) {
          return Result.fail<ITransacaoDTO>(
            "Destination account not found for this transaction",
          );
        }

        const statusResult = Status.create("Concluído");
        if (statusResult.isFailure)
          return Result.fail<ITransacaoDTO>(String(statusResult.error));

        const updatedTransacaoOrError = Transacao.create(
          {
            descricao: transacao.descricao,
            data: transacao.data,
            valor: transacao.valor,
            tipo: transacao.tipo,
            categoria: transacao.categoria,
            status: statusResult.getValue(),
            conta: transacao.conta,
            contaDestino: transacao.contaDestino,
            cartaoCredito: transacao.cartaoCredito,
          },
          transacao.id,
        );

        if (updatedTransacaoOrError.isFailure) {
          return Result.fail<ITransacaoDTO>(
            String(updatedTransacaoOrError.error),
          );
        }

        const updatedTransacao = updatedTransacaoOrError.getValue();

        (updatedTransacao as unknown as Record<string, unknown>)[
          "userDomainId"
        ] = (transacao as unknown as Record<string, unknown>)["userDomainId"];

        const contaDestinoFresh = await this.contaRepo.findById(
          transacao.contaDestino!.id.toString(),
        );
        if (!contaDestinoFresh)
          return Result.fail<ITransacaoDTO>("Destination Account not found");

        const subtractResult = contaDestinoFresh.subtrairSaldo(transacao.valor);
        if (subtractResult.isFailure)
          return Result.fail<ITransacaoDTO>(String(subtractResult.error));

        await this.contaRepo.update(contaDestinoFresh);

        const savedTransacao =
          await this.transacaoRepo.update(updatedTransacao);

        return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
      }
    } catch (e) {
      this.logger.error(
        "TransacaoService.concluirDespesaRecorrente error: %o",
        e,
      );
      return Result.fail<ITransacaoDTO>("Error concluding recurring expense");
    }
  }

  /**
   * Creates a Poupança transaction — transfers money from origin account to a savings account.
   */
  public async createPoupanca(
    inputDTO: ITransacaoInputDTO,
    imediata?: boolean,
  ): Promise<Result<ITransacaoDTO>> {
    try {
      const descricaoResult = Descricao.create(inputDTO.descricao ?? "");
      const dataResult = Data.createFromParts(
        inputDTO.data.dia,
        inputDTO.data.mes,
        inputDTO.data.ano,
      );
      const dinheiroResult = Dinheiro.create(
        Number(inputDTO.valor.valor),
        String(inputDTO.valor.moeda ?? "EUR"),
      );

      const combine = Result.combine([
        descricaoResult,
        dataResult,
        dinheiroResult,
      ]);
      if (combine.isFailure)
        return Result.fail<ITransacaoDTO>(String(combine.error));

      const categoria = await this.categoriaRepo.findById(inputDTO.categoriaId);
      if (!categoria)
        return Result.fail<ITransacaoDTO>("Target Category not found");

      if (!inputDTO.contaId)
        return Result.fail<ITransacaoDTO>(
          "Origin Account (contaId) is required for Poupança",
        );
      if (!imediata && !inputDTO.contaDestinoId)
        return Result.fail<ITransacaoDTO>(
          "Destination Account (contaDestinoId) is required for Poupança",
        );
      if (!inputDTO.contaPoupancaId)
        return Result.fail<ITransacaoDTO>(
          "Savings Account (contaPoupancaId) is required for Poupança",
        );
      if (inputDTO.cartaoCreditoId)
        return Result.fail<ITransacaoDTO>(
          "Poupança cannot be applied to credit cards",
        );

      const conta = await this.contaRepo.findById(inputDTO.contaId);
      if (!conta) return Result.fail<ITransacaoDTO>("Origin Account not found");

      let contaDestino = null;
      if (!imediata) {
        contaDestino = await this.contaRepo.findById(inputDTO.contaDestinoId!);
        if (!contaDestino)
          return Result.fail<ITransacaoDTO>(
            "Destination Account (Despesas Mensais) not found",
          );
      }

      const contaPoupanca = await this.contaRepo.findById(
        inputDTO.contaPoupancaId,
      );
      if (!contaPoupanca)
        return Result.fail<ITransacaoDTO>("Savings Account not found");

      const transacaoOrError = Transacao.createPoupanca(
        {
          descricao: descricaoResult.getValue(),
          data: dataResult.getValue(),
          valor: dinheiroResult.getValue(),
          categoria,
          conta,
          ...(contaDestino ? { contaDestino } : {}),
          contaPoupanca,
        },
        imediata ?? false,
      );

      if (transacaoOrError.isFailure)
        return Result.fail<ITransacaoDTO>(String(transacaoOrError.error));
      const transacao = transacaoOrError.getValue();

      (transacao as unknown as Record<string, unknown>)["userDomainId"] =
        inputDTO.userId ?? conta.userId.toString();

      const subtractResult = conta.subtrairSaldo(transacao.valor);
      if (subtractResult.isFailure)
        return Result.fail<ITransacaoDTO>(String(subtractResult.error));

      const savedTransacao = await this.transacaoRepo.save(transacao);
      await this.contaRepo.update(conta);

      if (!imediata && contaDestino) {
        const addDestinoResult = contaDestino.adicionarSaldo(transacao.valor);
        if (addDestinoResult.isFailure)
          return Result.fail<ITransacaoDTO>(String(addDestinoResult.error));
        await this.contaRepo.update(contaDestino);
      }

      return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(savedTransacao));
    } catch (e) {
      this.logger.error("TransacaoService.createPoupanca error: %o", e);
      return Result.fail<ITransacaoDTO>("Error creating poupança");
    }
  }

  /**
   * Concludes a Poupança that is in "Pendente" status.
   * Changes status to "Concluído" and adds the amount to the savings account (contaPoupanca).
   */
  public async concluirPoupanca(
    transacaoId: string,
  ): Promise<Result<ITransacaoDTO>> {
    try {
      const transacao = await this.transacaoRepo.findById(transacaoId);
      if (!transacao)
        return Result.fail<ITransacaoDTO>("Transaction not found");

      if (transacao.tipo.value !== "Poupança") {
        return Result.fail<ITransacaoDTO>("Transaction is not a Poupança");
      }

      if (transacao.status.value !== "Pendente") {
        return Result.fail<ITransacaoDTO>(
          "Transaction is not in Pendente status",
        );
      }

      if (!transacao.contaPoupanca) {
        return Result.fail<ITransacaoDTO>(
          "Savings account not found for this transaction",
        );
      }

      const statusResult = Status.create("Concluído");
      if (statusResult.isFailure)
        return Result.fail<ITransacaoDTO>(String(statusResult.error));

      const updatedOrError = Transacao.create(
        {
          descricao: transacao.descricao,
          data: transacao.data,
          valor: transacao.valor,
          tipo: transacao.tipo,
          categoria: transacao.categoria,
          status: statusResult.getValue(),
          conta: transacao.conta,
          contaDestino: transacao.contaDestino,
          contaPoupanca: transacao.contaPoupanca,
          cartaoCredito: transacao.cartaoCredito,
        },
        transacao.id,
      );

      if (updatedOrError.isFailure)
        return Result.fail<ITransacaoDTO>(String(updatedOrError.error));
      const updated = updatedOrError.getValue();

      (updated as unknown as Record<string, unknown>)["userDomainId"] = (
        transacao as unknown as Record<string, unknown>
      )["userDomainId"];

      if (transacao.contaDestino) {
        const contaDestinoFresh = await this.contaRepo.findById(
          transacao.contaDestino.id.toString(),
        );
        if (!contaDestinoFresh)
          return Result.fail<ITransacaoDTO>("Destination Account not found");

        const subtractDestinoResult = contaDestinoFresh.subtrairSaldo(
          transacao.valor,
        );
        if (subtractDestinoResult.isFailure)
          return Result.fail<ITransacaoDTO>(
            String(subtractDestinoResult.error),
          );
        await this.contaRepo.update(contaDestinoFresh);
      }

      const contaPoupancaFresh = await this.contaRepo.findById(
        transacao.contaPoupanca.id.toString(),
      );
      if (!contaPoupancaFresh)
        return Result.fail<ITransacaoDTO>("Savings Account not found");

      const addResult = contaPoupancaFresh.adicionarSaldo(transacao.valor);
      if (addResult.isFailure)
        return Result.fail<ITransacaoDTO>(String(addResult.error));
      await this.contaRepo.update(contaPoupancaFresh);

      const saved = await this.transacaoRepo.update(updated);
      return Result.ok<ITransacaoDTO>(TransacaoMap.toDTO(saved));
    } catch (e) {
      this.logger.error("TransacaoService.concluirPoupanca error: %o", e);
      return Result.fail<ITransacaoDTO>("Error concluding poupança");
    }
  }
  /**
   * Reverts the impact of a Despesa Recorrente transaction.
   * Immediate transactions only touch the origin account; non-immediate ones also touch the destination account.
   */
  public async revertDespesaRecorrenteImpact(
    transacao: Transacao,
  ): Promise<Result<void>> {
    if (!transacao.conta)
      return Result.fail<void>("Conta origem not found for Despesa Recorrente");

    const contaOrigem = await this.contaRepo.findById(
      transacao.conta.id.toString(),
    );
    if (!contaOrigem) return Result.fail<void>("Origin account not found");

    // Immediate recurring expense: only revert the origin account
    const revertOrigemResult = contaOrigem.adicionarSaldo(transacao.valor);
    if (revertOrigemResult.isFailure)
      return Result.fail<void>(String(revertOrigemResult.error));

    if (!transacao.contaDestino) {
      await this.contaRepo.update(contaOrigem);
      return Result.ok<void>();
    }

    const contaDestino = await this.contaRepo.findById(
      transacao.contaDestino.id.toString(),
    );
    if (!contaDestino)
      return Result.fail<void>("Destination account not found");

    // Non-immediate recurring expense: revert both origin and destination accounts
    const revertDestinoResult = contaDestino.subtrairSaldo(transacao.valor);
    if (revertDestinoResult.isFailure)
      return Result.fail<void>(String(revertDestinoResult.error));

    await this.contaRepo.update(contaOrigem);
    await this.contaRepo.update(contaDestino);
    return Result.ok<void>();
  }
  /**
   * Applies the impact of a Despesa Recorrente transaction.
   * Immediate transactions only touch the origin account; non-immediate ones also touch the destination account.
   */
  public async applyDespesaRecorrenteImpact(
    transacao: Transacao,
  ): Promise<Result<void>> {
    if (!transacao.conta) return Result.fail<void>("Conta origem not found");

    const contaOrigem = await this.contaRepo.findById(
      transacao.conta.id.toString(),
    );
    if (!contaOrigem) return Result.fail<void>("Origin account not found");

    const applyOrigemResult = contaOrigem.subtrairSaldo(transacao.valor);
    if (applyOrigemResult.isFailure)
      return Result.fail<void>(String(applyOrigemResult.error));

    if (!transacao.contaDestino) {
      await this.contaRepo.update(contaOrigem);
      return Result.ok<void>();
    }

    const contaDestino = await this.contaRepo.findById(
      transacao.contaDestino.id.toString(),
    );
    if (!contaDestino)
      return Result.fail<void>("Destination account not found");

    const applyDestinoResult = contaDestino.adicionarSaldo(transacao.valor);
    if (applyDestinoResult.isFailure)
      return Result.fail<void>(String(applyDestinoResult.error));

    await this.contaRepo.update(contaOrigem);
    await this.contaRepo.update(contaDestino);
    return Result.ok<void>();
  }
  /**
   * Reverts the impact of a Poupança transaction
   * Pendente: origem foi subtraída + contaDestino foi adicionada
   * Concluído: acima + contaPoupanca foi adicionada
   */
  public async revertPoupancaImpact(
    transacao: Transacao,
  ): Promise<Result<void>> {
    if (!transacao.conta)
      return Result.fail<void>("Conta origem not found for Poupança");

    const contaOrigem = await this.contaRepo.findById(
      transacao.conta.id.toString(),
    );
    if (!contaOrigem) return Result.fail<void>("Origin account not found");

    // Sempre: adicionar de volta à origem
    const revertOrigemResult = contaOrigem.adicionarSaldo(transacao.valor);
    if (revertOrigemResult.isFailure)
      return Result.fail<void>(String(revertOrigemResult.error));
    await this.contaRepo.update(contaOrigem);

    // Sempre: subtrair da contaDestino (Despesas Mensais) — foi adicionada ao criar
    if (transacao.contaDestino) {
      const contaDestino = await this.contaRepo.findById(
        transacao.contaDestino.id.toString(),
      );
      if (contaDestino) {
        const revertDestinoResult = contaDestino.subtrairSaldo(transacao.valor);
        if (revertDestinoResult.isFailure)
          return Result.fail<void>(String(revertDestinoResult.error));
        await this.contaRepo.update(contaDestino);
      }
    }

    // Se Concluído: subtrair da contaPoupanca (foi adicionada ao concluir)
    if (transacao.status.value === "Concluído" && transacao.contaPoupanca) {
      const contaPoupanca = await this.contaRepo.findById(
        transacao.contaPoupanca.id.toString(),
      );
      if (!contaPoupanca) return Result.fail<void>("Savings account not found");
      const revertPoupancaResult = contaPoupanca.subtrairSaldo(transacao.valor);
      if (revertPoupancaResult.isFailure)
        return Result.fail<void>(String(revertPoupancaResult.error));
      await this.contaRepo.update(contaPoupanca);
    }

    return Result.ok<void>();
  }

  /**
   * Applies the impact of a Poupança transaction
   * Pendente: subtrair da origem + adicionar à contaDestino
   * Concluído: acima + adicionar à contaPoupanca
   */
  public async applyPoupancaImpact(
    transacao: Transacao,
  ): Promise<Result<void>> {
    if (!transacao.conta) return Result.fail<void>("Conta origem not found");

    const contaOrigem = await this.contaRepo.findById(
      transacao.conta.id.toString(),
    );
    if (!contaOrigem) return Result.fail<void>("Origin account not found");

    // Sempre: subtrair da origem
    const applyOrigemResult = contaOrigem.subtrairSaldo(transacao.valor);
    if (applyOrigemResult.isFailure)
      return Result.fail<void>(String(applyOrigemResult.error));
    await this.contaRepo.update(contaOrigem);

    // Sempre: adicionar à contaDestino (Despesas Mensais)
    if (transacao.contaDestino) {
      const contaDestino = await this.contaRepo.findById(
        transacao.contaDestino.id.toString(),
      );
      if (contaDestino) {
        const applyDestinoResult = contaDestino.adicionarSaldo(transacao.valor);
        if (applyDestinoResult.isFailure)
          return Result.fail<void>(String(applyDestinoResult.error));
        await this.contaRepo.update(contaDestino);
      }
    }

    // Se Concluído: adicionar à contaPoupanca
    if (transacao.status.value === "Concluído" && transacao.contaPoupanca) {
      const contaPoupanca = await this.contaRepo.findById(
        transacao.contaPoupanca.id.toString(),
      );
      if (!contaPoupanca) return Result.fail<void>("Savings account not found");
      const applyPoupancaResult = contaPoupanca.adicionarSaldo(transacao.valor);
      if (applyPoupancaResult.isFailure)
        return Result.fail<void>(String(applyPoupancaResult.error));
      await this.contaRepo.update(contaPoupanca);
    }

    return Result.ok<void>();
  }
  /**
   * Finds recurring expense transactions (Despesa Mensal + Poupança) by category for a specific bank.
   * @param bancoId - The domain id of the Banco to filter transactions by.
   * @param categoriaId - The unique identifier of the Categoria to find transactions for
   * @param userId - Optional user identifier to filter transactions by user ownership
   */
  public async findDespesaRecorrenteByCategoria(
    bancoId: string,
    categoriaId: string,
    userId?: string,
  ): Promise<Result<ITransacaoDTO[]>> {
    try {
      const rows: Transacao[] =
        await this.despesasRecorrentesRepo.findDespesaRecorrenteByCategoria(
          bancoId,
          categoriaId,
          userId,
        );
      return Result.ok<ITransacaoDTO[]>(
        rows.map((r: Transacao) => TransacaoMap.toDTO(r)),
      );
    } catch (e) {
      this.logger.error(
        "TransacaoService.findDespesaRecorrenteByCategoria error: %o",
        e,
      );
      return Result.fail<ITransacaoDTO[]>(
        "Error fetching recurring expense transactions by category",
      );
    }
  }
  /**
   * Finds recurring expense transactions (Despesa Mensal + Poupança) by status for a specific bank.
   * @param bancoId - The domain id of the Banco to filter transactions by.
   * @param status - The status of transactions to find (e.g., "Pendente", "Concluído")
   * @param userId - Optional user identifier to filter transactions by user ownership
   */
  public async findDespesaRecorrenteByStatus(
    bancoId: string,
    status: string,
    userId?: string,
  ): Promise<Result<ITransacaoDTO[]>> {
    try {
      const rows: Transacao[] =
        await this.despesasRecorrentesRepo.findDespesaRecorrenteByStatus(
          bancoId,
          status,
          userId,
        );
      return Result.ok<ITransacaoDTO[]>(
        rows.map((r: Transacao) => TransacaoMap.toDTO(r)),
      );
    } catch (e) {
      this.logger.error(
        "TransacaoService.findDespesaRecorrenteByStatus error: %o",
        e,
      );
      return Result.fail<ITransacaoDTO[]>(
        "Error fetching recurring expense transactions by status",
      );
    }
  }
  /**
   * Finds recurring expense transactions (Despesa Mensal + Poupança) by predefined period for a specific bank.
   * @param bancoId - The domain id of the Banco to filter transactions by.
   * @param period - The period to filter by: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano'
   * @param userId - Optional user identifier to filter transactions by user ownership
   */
  public async findDespesaRecorrenteByPeriod(
    bancoId: string,
    period: "Este Mês" | "Últimos 3 Meses" | "Último Ano",
    userId?: string,
  ): Promise<Result<ITransacaoDTO[]>> {
    try {
      const rows: Transacao[] =
        await this.despesasRecorrentesRepo.findDespesaRecorrenteByPeriod(
          bancoId,
          period,
          userId,
        );
      return Result.ok<ITransacaoDTO[]>(
        rows.map((r: Transacao) => TransacaoMap.toDTO(r)),
      );
    } catch (e) {
      this.logger.error(
        "TransacaoService.findDespesaRecorrenteByPeriod error: %o",
        e,
      );
      return Result.fail<ITransacaoDTO[]>(
        "Error fetching recurring expense transactions by period",
      );
    }
  }
  /**
   * Finds all recurring expense transactions (Despesa Mensal + Poupança) for a specific bank.
   * @param bancoId - The domain id of the Banco to filter transactions by.
   * @param userId - Optional user identifier to filter transactions by user ownership
   * @returns A Result object containing either an array of despesa mensal DTOs or an error message
   */
  public async findDespesaRecorrente(
    bancoId: string,
    userId?: string,
  ): Promise<Result<ITransacaoDTO[]>> {
    try {
      const rows: Transacao[] =
        await this.despesasRecorrentesRepo.findDespesaRecorrente(
          bancoId,
          userId,
        );
      return Result.ok<ITransacaoDTO[]>(
        rows.map((r: Transacao) => TransacaoMap.toDTO(r)),
      );
    } catch (e) {
      this.logger.error("TransacaoService.findDespesaRecorrente error: %o", e);
      return Result.fail<ITransacaoDTO[]>(
        "Error fetching recurring expense transactions",
      );
    }
  }
}
