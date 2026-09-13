import { jest, describe, it, expect } from '@jest/globals';
import EstatisticasService from '../EstatisticasService.js';
import { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../../../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../../../domain/Shared/ValueObjects/Data.js';
import { Dinheiro } from '../../../domain/Shared/ValueObjects/Dinheiro.js';
import { Categoria } from '../../../domain/Categoria/Entities/Categoria.js';
import { Nome } from '../../../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../../../domain/Shared/ValueObjects/Icon.js';
import { CartaoCredito } from '../../../domain/CartaoCredito/Entities/CartaoCredito.js';
import { Periodo } from '../../../domain/CartaoCredito/ValueObjects/Periodo.js';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID.js';
import type ITransacaoContaQueryRepo from '../../../repos/Transacao/IRepos/ITransacaoContaQueryRepo.js';
import type ITransacaoCartaoQueryRepo from '../../../repos/Transacao/IRepos/ITransacaoCartaoQueryRepo.js';

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

function buildCategoria(): Categoria {
  return Categoria.create({
    nome: Nome.create('Compras').getValue(),
    icon: Icon.create('🛒').getValue()
  }).getValue();
}

describe('EstatisticasService — isPagamentoCartao excluded from aggregation (issue #33)', () => {
  const contaQueryRepo: jest.Mocked<ITransacaoContaQueryRepo> = {
    findAllContaTransactions: jest.fn(),
    findAllByBanco: jest.fn()
  };
  const cartaoQueryRepo: jest.Mocked<ITransacaoCartaoQueryRepo> = {
    findAllCartaoTransactions: jest.fn()
  };

  const service = new EstatisticasService(
    contaQueryRepo,
    cartaoQueryRepo,
    { error: jest.fn() }
  );

  function setup() {
    const cartao = buildCartao();
    const categoria = buildCategoria();

    const compra = Transacao.createCredito({
      descricao: Descricao.create('Compra no cartão').getValue(),
      data: Data.createFromParts(10, 1, 2026).getValue(),
      valor: Dinheiro.create(50, 'EUR').getValue(),
      categoria,
      cartaoCredito: cartao,
      isPagamentoCartao: false
    }).getValue();

    const pagamento = Transacao.createCredito({
      descricao: Descricao.create('Pagamento Cartão Teste').getValue(),
      data: Data.createFromParts(20, 1, 2026).getValue(),
      valor: Dinheiro.create(50, 'EUR').getValue(),
      categoria,
      cartaoCredito: cartao,
      isPagamentoCartao: true
    }).getValue();

    contaQueryRepo.findAllContaTransactions.mockResolvedValue([]);
    cartaoQueryRepo.findAllCartaoTransactions.mockResolvedValue([compra, pagamento]);

    return { cartao, categoria, compra, pagamento };
  }

  it('totalOut should reflect only the purchase, not (purchase + pagamento)', async () => {
    setup();

    const result = await service.getEstatisticas('BNC00000000001', 1, 2026, 'USR00000000001', 'User');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().cashflowMensal.totalOut).toBe(50);
  });

  it('categorias should not double the total with the pagamento record', async () => {
    setup();

    const result = await service.getEstatisticas('BNC00000000001', 1, 2026, 'USR00000000001', 'User');

    const categorias = result.getValue().categorias;
    expect(categorias).toHaveLength(1);
    expect(categorias[0].total.valor).toBe(50);
  });

  it('historicoDiario should not add an entry for the pagamento day', async () => {
    setup();

    const result = await service.getEstatisticas('BNC00000000001', 1, 2026, 'USR00000000001', 'User');

    const historico = result.getValue().historicoDiario;
    expect(historico).toHaveLength(1);
    expect(historico[0].data).toEqual({ dia: 10, mes: 1, ano: 2026 });
    expect(historico[0].total.valor).toBe(50);
  });
});
