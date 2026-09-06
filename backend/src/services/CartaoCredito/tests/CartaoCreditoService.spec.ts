import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import CartaoCreditoService from '../CartaoCreditoService.js';
import { CartaoCredito } from '../../../domain/CartaoCredito/Entities/CartaoCredito.js';
import { Nome } from '../../../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../../../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../../../domain/Shared/ValueObjects/Dinheiro.js';
import { Data } from '../../../domain/Shared/ValueObjects/Data.js';
import { Periodo } from '../../../domain/CartaoCredito/ValueObjects/Periodo.js';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID.js';
import { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../../../domain/Transacao/ValueObjects/Descricao.js';
import { Tipo } from '../../../domain/Shared/ValueObjects/Tipo.js';
import { Status } from '../../../domain/Transacao/ValueObjects/Status.js';
import { Categoria } from '../../../domain/Categoria/Entities/Categoria.js';
import type ICartaoCreditoRepo from '../../../repos/CartaoCredito/ICartaoCreditoRepo.js';
import type ITransacaoPagarCartaoRepo from '../../../repos/Transacao/IRepos/ITransacaoPagarCartaoRepo.js';
import type ICategoriaRepo from '../../../repos/Categoria/ICategoriaRepo.js';
import type IBancoRepo from '../../../repos/Banco/IBancoRepo.js';
import type IUserRepo from '../../../repos/User/IUserRepo.js';

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
  }, new UniqueEntityID('CRT00000000001')).getValue();
}

function buildPaymentTransacao(cartao: CartaoCredito): Transacao {
  const categoria = Categoria.create({
    nome: Nome.create('Categoria Teste').getValue(),
    icon: Icon.create('🏷️').getValue()
  }).getValue();

  return Transacao.create({
    descricao: Descricao.create('Pagamento Cartão Teste').getValue(),
    data: Data.createFromParts(1, 2, 2026).getValue(),
    valor: Dinheiro.create(100, 'EUR').getValue(),
    tipo: Tipo.create('Crédito').getValue(),
    categoria,
    status: Status.create('Concluído').getValue(),
    cartaoCredito: cartao,
    isPagamentoCartao: true
  }).getValue();
}

describe('CartaoCreditoService.pagarCartao — atomic payment orchestration', () => {
  const cartaoRepo: jest.Mocked<ICartaoCreditoRepo> = {
    findById: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    getExtrato: jest.fn()
  };
  const transacaoRepo: jest.Mocked<ITransacaoPagarCartaoRepo> = {
    pagarCartao: jest.fn()
  };
  const userRepo: jest.Mocked<Pick<IUserRepo, 'findByDomainId'>> = {
    findByDomainId: jest.fn()
  };

  const service = new CartaoCreditoService(
    cartaoRepo,
    transacaoRepo,
    {} as unknown as ICategoriaRepo,
    {},
    {} as unknown as IBancoRepo,
    userRepo as unknown as IUserRepo,
    { error: jest.fn() }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computes the new saldo/período and delegates all persistence to TransacaoRepo.pagarCartao, without updating the card itself', async () => {
    const cartao = buildCartao();
    const paymentTransacao = buildPaymentTransacao(cartao);

    cartaoRepo.getExtrato.mockResolvedValue({ transacoes: [], saldoAtual: Dinheiro.create(100, 'EUR').getValue() });
    cartaoRepo.findById.mockResolvedValue(cartao);
    userRepo.findByDomainId.mockResolvedValue(undefined as unknown as Awaited<ReturnType<IUserRepo['findByDomainId']>>);
    transacaoRepo.pagarCartao.mockResolvedValue(paymentTransacao);

    const result = await service.pagarCartao('CRT00000000001', 'USR00000000001', {
      inicio: { dia: 1, mes: 2, ano: 2026 },
      fecho: { dia: 28, mes: 2, ano: 2026 }
    });

    expect(result.isSuccess).toBe(true);

    // The service must never persist the card directly anymore — that responsibility moved
    // entirely into TransacaoPagarCartaoRepo.pagarCartao's single DB transaction.
    expect(cartaoRepo.update).not.toHaveBeenCalled();

    expect(transacaoRepo.pagarCartao).toHaveBeenCalledTimes(1);
    const [, , , , novoSaldoUtilizado, novoPeriodo] = transacaoRepo.pagarCartao.mock.calls[0];
    expect(novoSaldoUtilizado).toBe(0); // 100 (saldoUtilizado) - 100 (valorPagar) = 0
    expect(novoPeriodo.inicio.getUTCFullYear()).toBe(2026);
    expect(novoPeriodo.inicio.getUTCMonth()).toBe(1); // February, 0-indexed
    expect(novoPeriodo.inicio.getUTCDate()).toBe(1);
  });
});
