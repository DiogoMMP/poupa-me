import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import TransacaoService from '../TransacaoService.js';
import TransacaoDespesasRecorrentesService from '../TransacaoDespesasRecorrentesService.js';
import { Transacao } from '../../../domain/Transacao/Entities/Transacao.js';
import { Conta } from '../../../domain/Conta/Entities/Conta.js';
import { Categoria } from '../../../domain/Categoria/Entities/Categoria.js';
import { Descricao } from '../../../domain/Transacao/ValueObjects/Descricao.js';
import { Status } from '../../../domain/Transacao/ValueObjects/Status.js';
import { Tipo } from '../../../domain/Shared/ValueObjects/Tipo.js';
import { Nome } from '../../../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../../../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../../../domain/Shared/ValueObjects/Dinheiro.js';
import { Data } from '../../../domain/Shared/ValueObjects/Data.js';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID.js';

/**
 * Money must not move on a soft-deleted conta (B0015 / issue #89): concluding a pendente whose conta was deleted
 * after it was created, or retargeting a movimento to a cartão whose conta de pagamento was deleted, is refused
 * before any balance changes.
 */

const conta = (id: string): Conta => Conta.create({
  userId: new UniqueEntityID('USR00000000001'),
  nome: Nome.create(`Conta ${id}`).getValue(),
  icon: Icon.create('🏦').getValue(),
  saldo: Dinheiro.create(500, 'EUR').getValue()
}, new UniqueEntityID(id)).getValue();

const categoria = Categoria.create({
  nome: Nome.create('Casa').getValue(),
  icon: Icon.create('🏠').getValue()
}).getValue();

const pendente = (tipo: string, extra: { contaDestino?: Conta; contaPoupanca?: Conta }): Transacao => Transacao.create({
  descricao: Descricao.create('Renda').getValue(),
  data: Data.createFromParts(1, 2, 2026).getValue(),
  valor: Dinheiro.create(100, 'EUR').getValue(),
  tipo: Tipo.create(tipo).getValue(),
  categoria,
  status: Status.create('Pendente').getValue(),
  conta: conta('CNT-ORIGEM'),
  ...extra
}, new UniqueEntityID('TRN00000000001')).getValue();

describe('TransacaoDespesasRecorrentesService — conclusão com conta apagada', () => {
  let transacaoRepo: Record<string, jest.Mock>;
  let contaRepo: Record<string, jest.Mock>;
  let service: TransacaoDespesasRecorrentesService;

  beforeEach(() => {
    transacaoRepo = { findById: jest.fn(), update: jest.fn() };
    contaRepo = { findById: jest.fn(), findActiveById: jest.fn(), update: jest.fn() };
    service = new TransacaoDespesasRecorrentesService(
      transacaoRepo as never, {} as never, {} as never, contaRepo as never, {} as never, {} as never, { error: jest.fn() }
    );
  });

  it('refuses to conclude a despesa recorrente whose conta destino was soft-deleted', async () => {
    transacaoRepo.findById.mockResolvedValue(pendente('Despesa Mensal', { contaDestino: conta('CNT-DESTINO') }));
    contaRepo.findActiveById.mockResolvedValue(null);

    const result = await service.concluirDespesaRecorrente('TRN00000000001');

    expect(result.isFailure).toBe(true);
    expect(contaRepo.findActiveById).toHaveBeenCalledWith('CNT-DESTINO');
    expect(contaRepo.update).not.toHaveBeenCalled();
    expect(transacaoRepo.update).not.toHaveBeenCalled();
  });

  it('refuses to conclude a poupança whose conta poupança was deleted, without touching the conta destino', async () => {
    transacaoRepo.findById.mockResolvedValue(
      pendente('Poupança', { contaDestino: conta('CNT-DESTINO'), contaPoupanca: conta('CNT-POUPANCA') })
    );
    contaRepo.findActiveById.mockImplementation(async (id: unknown) => (id === 'CNT-DESTINO' ? conta('CNT-DESTINO') : null));

    const result = await service.concluirPoupanca('TRN00000000001');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Savings Account not found');
    expect(contaRepo.update).not.toHaveBeenCalled();
    expect(transacaoRepo.update).not.toHaveBeenCalled();
  });
});

describe('TransacaoService.updateTransacao — cartão novo com conta de pagamento apagada', () => {
  it('refuses the new cartão before reverting the old movimento', async () => {
    const existing = pendente('Crédito', {});
    const transacaoRepo = { findById: jest.fn().mockResolvedValue(existing), update: jest.fn() };
    const contaRepo = { findById: jest.fn(), findActiveById: jest.fn().mockResolvedValue(null), update: jest.fn() };
    const cartaoRepo = {
      findById: jest.fn(),
      findActiveById: jest.fn().mockResolvedValue({ contaPagamentoId: new UniqueEntityID('CNT-APAGADA') }),
      update: jest.fn()
    };
    const service = new TransacaoService(
      transacaoRepo as never, {} as never, contaRepo as never, cartaoRepo as never, {} as never, {} as never, { error: jest.fn() }
    );

    const result = await service.updateTransacao('TRN00000000001', { cartaoCreditoId: 'CRT-NOVO' } as never);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Payment account not found for credit card');
    expect(contaRepo.findActiveById).toHaveBeenCalledWith('CNT-APAGADA');
    expect(cartaoRepo.findById).not.toHaveBeenCalled(); // revert of the old movimento never started
    expect(contaRepo.update).not.toHaveBeenCalled();
    expect(transacaoRepo.update).not.toHaveBeenCalled();
  });
});
