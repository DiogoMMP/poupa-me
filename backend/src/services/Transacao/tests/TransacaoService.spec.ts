import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import TransacaoService from '../TransacaoService.js';
import { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../../../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../../../domain/Shared/ValueObjects/Data.js';
import { Dinheiro } from '../../../domain/Shared/ValueObjects/Dinheiro.js';
import { Tipo } from '../../../domain/Shared/ValueObjects/Tipo.js';
import { Status } from '../../../domain/Transacao/ValueObjects/Status.js';
import { Categoria } from '../../../domain/Categoria/Entities/Categoria.js';
import { Nome } from '../../../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../../../domain/Shared/ValueObjects/Icon.js';
import { CartaoCredito } from '../../../domain/CartaoCredito/Entities/CartaoCredito.js';
import { Periodo } from '../../../domain/CartaoCredito/ValueObjects/Periodo.js';
import { Conta } from '../../../domain/Conta/Entities/Conta.js';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID.js';
import type ITransacaoRepo from '../../../repos/Transacao/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../../../repos/Categoria/ICategoriaRepo.js';
import type IContaRepo from '../../../repos/Conta/IContaRepo.js';
import type ICartaoCreditoRepo from '../../../repos/CartaoCredito/ICartaoCreditoRepo.js';
import type IUserRepo from '../../../repos/User/IUserRepo.js';
import type ITransacaoDespesasRecorrentesService from '../IServices/ITransacaoDespesasRecorrentesService.js';

function buildCartao(): CartaoCredito {
  const nome = Nome.create('Cartão Teste').getValue();
  const icon = Icon.create('💳').getValue();
  const limiteCredito = Dinheiro.create(1000, 'EUR').getValue();
  const saldoUtilizado = Dinheiro.create(100, 'EUR').getValue();
  const periodo = Periodo.create(
    Data.createFromParts(1, 1, 2026, true).getValue(),
    Data.createFromParts(28, 1, 2026, true).getValue()
  ).getValue();

  return CartaoCredito.create({
    userId: new UniqueEntityID('USR00000000001'),
    nome,
    icon,
    limiteCredito,
    saldoUtilizado,
    periodo,
    contaPagamentoId: new UniqueEntityID('CNT00000000001')
  }).getValue();
}

function buildReembolsoTransacao(isPagamentoCartao: boolean, cartao: CartaoCredito): Transacao {
  const categoria = Categoria.create({
    nome: Nome.create('Categoria Teste').getValue(),
    icon: Icon.create('🏷️').getValue()
  }).getValue();

  return Transacao.create({
    descricao: Descricao.create('Reembolso Teste').getValue(),
    data: Data.createFromParts(1, 1, 2026).getValue(),
    valor: Dinheiro.create(50, 'EUR').getValue(),
    tipo: Tipo.create('Reembolso').getValue(),
    categoria,
    status: Status.create('Pendente').getValue(),
    cartaoCredito: cartao,
    isPagamentoCartao
  }).getValue();
}

function buildConta(id: string, nome: string, saldo: number): Conta {
  return Conta.create({
    userId: new UniqueEntityID('USR00000000001'),
    nome: Nome.create(nome).getValue(),
    icon: Icon.create('💰').getValue(),
    saldo: Dinheiro.create(saldo, 'EUR').getValue()
  }, new UniqueEntityID(id)).getValue();
}

function buildCartaoComId(id: string, contaPagamentoId: string): CartaoCredito {
  const nome = Nome.create('Cartão Teste').getValue();
  const icon = Icon.create('💳').getValue();
  const limiteCredito = Dinheiro.create(1000, 'EUR').getValue();
  const saldoUtilizado = Dinheiro.create(100, 'EUR').getValue();
  const periodo = Periodo.create(
    Data.createFromParts(1, 1, 2026, true).getValue(),
    Data.createFromParts(28, 1, 2026, true).getValue()
  ).getValue();

  return CartaoCredito.create({
    userId: new UniqueEntityID('USR00000000001'),
    nome,
    icon,
    limiteCredito,
    saldoUtilizado,
    periodo,
    contaPagamentoId: new UniqueEntityID(contaPagamentoId)
  }, new UniqueEntityID(id)).getValue();
}

function buildSaidaTransacao(id: string, conta: Conta): Transacao {
  const categoria = Categoria.create({
    nome: Nome.create('Categoria Teste').getValue(),
    icon: Icon.create('🏷️').getValue()
  }).getValue();

  return Transacao.create({
    descricao: Descricao.create('Compras Teste').getValue(),
    data: Data.createFromParts(1, 1, 2026).getValue(),
    valor: Dinheiro.create(20, 'EUR').getValue(),
    tipo: Tipo.create('Saída').getValue(),
    categoria,
    status: Status.create('Concluído').getValue(),
    conta
  }, new UniqueEntityID(id)).getValue();
}

function buildCreditoTransacao(id: string, cartao: CartaoCredito): Transacao {
  const categoria = Categoria.create({
    nome: Nome.create('Categoria Teste').getValue(),
    icon: Icon.create('🏷️').getValue()
  }).getValue();

  return Transacao.create({
    descricao: Descricao.create('Compra Crédito Teste').getValue(),
    data: Data.createFromParts(1, 1, 2026).getValue(),
    valor: Dinheiro.create(30, 'EUR').getValue(),
    tipo: Tipo.create('Crédito').getValue(),
    categoria,
    status: Status.create('Pendente').getValue(),
    cartaoCredito: cartao,
    isPagamentoCartao: false
  }, new UniqueEntityID(id)).getValue();
}

describe('TransacaoService — isPagamentoCartao guard on Reembolso impact', () => {
  const cartaoCreditoRepo: jest.Mocked<ICartaoCreditoRepo> = {
    findById: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    getExtrato: jest.fn()
  };
  const contaRepo: jest.Mocked<IContaRepo> = {
    findById: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn()
  } as unknown as jest.Mocked<IContaRepo>;

  const service = new TransacaoService(
    {} as unknown as ITransacaoRepo,
    {} as unknown as ICategoriaRepo,
    contaRepo,
    cartaoCreditoRepo,
    {} as unknown as ITransacaoDespesasRecorrentesService,
    {} as unknown as IUserRepo,
    { error: jest.fn() }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applyReembolsoImpact should no-op and never touch a repo when isPagamentoCartao is true', async () => {
    const cartao = buildCartao();
    const transacao = buildReembolsoTransacao(true, cartao);

    const result = await service.applyReembolsoImpact(transacao);

    expect(result.isSuccess).toBe(true);
    expect(cartaoCreditoRepo.findById).not.toHaveBeenCalled();
    expect(contaRepo.findById).not.toHaveBeenCalled();
  });

  it('revertReembolsoImpact should no-op and never touch a repo when isPagamentoCartao is true', async () => {
    const cartao = buildCartao();
    const transacao = buildReembolsoTransacao(true, cartao);

    const result = await service.revertReembolsoImpact(transacao);

    expect(result.isSuccess).toBe(true);
    expect(cartaoCreditoRepo.findById).not.toHaveBeenCalled();
    expect(contaRepo.findById).not.toHaveBeenCalled();
  });

  it('applyReembolsoImpact should still move money for a normal (non-payment) Reembolso record', async () => {
    const cartao = buildCartao();
    const transacao = buildReembolsoTransacao(false, cartao);

    cartaoCreditoRepo.findById.mockResolvedValue(cartao);
    contaRepo.findById.mockResolvedValue({
      adicionarSaldo: jest.fn().mockReturnValue({ isFailure: false }),
      subtrairSaldo: jest.fn().mockReturnValue({ isFailure: false })
    } as unknown as Awaited<ReturnType<IContaRepo['findById']>>);
    contaRepo.update.mockResolvedValue(undefined as unknown as Awaited<ReturnType<IContaRepo['update']>>);

    const result = await service.applyReembolsoImpact(transacao);

    expect(result.isSuccess).toBe(true);
    expect(cartaoCreditoRepo.findById).toHaveBeenCalledTimes(1);
    expect(contaRepo.findById).toHaveBeenCalledTimes(1);
  });
});

describe('TransacaoService — updateTransacao aplica novas associações (issue #52)', () => {
  const transacaoRepo: jest.Mocked<ITransacaoRepo> = {
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn()
  };
  const contaRepo: jest.Mocked<IContaRepo> = {
    findById: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn()
  } as unknown as jest.Mocked<IContaRepo>;
  const cartaoCreditoRepo: jest.Mocked<ICartaoCreditoRepo> = {
    findById: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    getExtrato: jest.fn()
  };

  const service = new TransacaoService(
    transacaoRepo,
    {} as unknown as ICategoriaRepo,
    contaRepo,
    cartaoCreditoRepo,
    {} as unknown as ITransacaoDespesasRecorrentesService,
    {} as unknown as IUserRepo,
    { error: jest.fn() }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should move the transaction to the new conta selected in the update, not the old one', async () => {
    const contaA = buildConta('CNT00000000001', 'Conta A', 100);
    const contaB = buildConta('CNT00000000002', 'Conta B', 50);
    const existing = buildSaidaTransacao('TRX00000000001', contaA);

    transacaoRepo.findById.mockResolvedValue(existing);
    transacaoRepo.update.mockImplementation(async (t) => t);
    contaRepo.findById.mockImplementation(async (id: string) => {
      if (id === contaA.id.toString()) return contaA;
      if (id === contaB.id.toString()) return contaB;
      return null;
    });
    contaRepo.update.mockResolvedValue(undefined as unknown as Awaited<ReturnType<IContaRepo['update']>>);

    const result = await service.updateTransacao(existing.id.toString(), { contaId: contaB.id.toString() });

    expect(result.isSuccess).toBe(true);
    expect(contaRepo.findById).toHaveBeenCalledWith(contaB.id.toString());
    const savedTransacao = transacaoRepo.update.mock.calls[0][0] as Transacao;
    expect(savedTransacao.conta?.id.toString()).toBe(contaB.id.toString());
  });

  it('should not touch any balance when the new contaId is invalid, since validation must happen before reverting the old impact', async () => {
    const contaA = buildConta('CNT00000000001', 'Conta A', 100);
    const existing = buildSaidaTransacao('TRX00000000003', contaA);

    transacaoRepo.findById.mockResolvedValue(existing);
    // contaA (the transaction's own account) resolves fine — only the new, invalid id fails —
    // so a false pass can't be caused by the OLD account lookup failing instead.
    contaRepo.findById.mockImplementation(async (queriedId: string) => {
      if (queriedId === contaA.id.toString()) return contaA;
      return null;
    });

    const result = await service.updateTransacao(existing.id.toString(), { contaId: 'CNT00000000099' });

    expect(result.isFailure).toBe(true);
    expect(contaRepo.update).not.toHaveBeenCalled();
    expect(transacaoRepo.update).not.toHaveBeenCalled();
  });

  it('should move the transaction to the new cartão de crédito selected in the update, not the old one', async () => {
    const contaPagamento = buildConta('CNT00000000009', 'Conta Pagamento', 200);
    const cartaoA = buildCartaoComId('CRT00000000001', 'CNT00000000009');
    const cartaoB = buildCartaoComId('CRT00000000002', 'CNT00000000009');
    const existing = buildCreditoTransacao('TRX00000000002', cartaoA);

    transacaoRepo.findById.mockResolvedValue(existing);
    transacaoRepo.update.mockImplementation(async (t) => t);
    cartaoCreditoRepo.findById.mockImplementation(async (id: string) => {
      if (id === cartaoA.id.toString()) return cartaoA;
      if (id === cartaoB.id.toString()) return cartaoB;
      return null;
    });
    cartaoCreditoRepo.update.mockResolvedValue(undefined as unknown as Awaited<ReturnType<ICartaoCreditoRepo['update']>>);
    contaRepo.findById.mockResolvedValue(contaPagamento);
    contaRepo.update.mockResolvedValue(undefined as unknown as Awaited<ReturnType<IContaRepo['update']>>);

    const result = await service.updateTransacao(existing.id.toString(), { cartaoCreditoId: cartaoB.id.toString() });

    expect(result.isSuccess).toBe(true);
    expect(cartaoCreditoRepo.findById).toHaveBeenCalledWith(cartaoB.id.toString());
    const savedTransacao = transacaoRepo.update.mock.calls[0][0] as Transacao;
    expect(savedTransacao.cartaoCredito?.id.toString()).toBe(cartaoB.id.toString());
  });
});
