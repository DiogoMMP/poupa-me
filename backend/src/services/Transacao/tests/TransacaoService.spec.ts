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
