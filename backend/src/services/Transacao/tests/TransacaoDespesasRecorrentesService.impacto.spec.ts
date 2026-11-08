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
import type { Result } from '../../../core/logic/Result.js';

/**
 * Editing or deleting a despesa recorrente / poupança (B0017 / issue #88): the conta destino only holds the money
 * while the transação is Pendente — concluding takes it back out — so a Concluída must only move the conta origem
 * (and, for a Poupança, the conta poupança), never the conta destino. The edit runs in one unit of work, so a failure
 * halfway through leaves no balance changed.
 */

const conta = (id: string, saldo: number): Conta => Conta.create({
  userId: new UniqueEntityID('USR00000000001'),
  nome: Nome.create(`Conta ${id}`).getValue(),
  icon: Icon.create('🏦').getValue(),
  saldo: Dinheiro.create(saldo, 'EUR').getValue()
}, new UniqueEntityID(id)).getValue();

const categoria = Categoria.create({
  nome: Nome.create('Casa').getValue(),
  icon: Icon.create('🏠').getValue()
}).getValue();

describe('TransacaoService — impacto de despesas recorrentes por estado', () => {
  let contas: Map<string, Conta>;
  let persistidos: Map<string, number>;
  let transacaoRepo: Record<string, jest.Mock>;
  let contaRepo: Record<string, jest.Mock>;
  let service: TransacaoService;

  /** The balance as last written through contaRepo.update — what the real repository would have stored. */
  const saldo = (id: string): number => persistidos.get(id)!;

  const definirConta = (id: string, valor: number): void => {
    contas.set(id, conta(id, valor));
    persistidos.set(id, valor);
  };

  const transacao = (tipo: string, status: string, extra: { contaDestino?: boolean; contaPoupanca?: boolean }): Transacao =>
    Transacao.create({
      descricao: Descricao.create('Renda').getValue(),
      data: Data.createFromParts(1, 2, 2026).getValue(),
      valor: Dinheiro.create(100, 'EUR').getValue(),
      tipo: Tipo.create(tipo).getValue(),
      categoria,
      status: Status.create(status).getValue(),
      conta: contas.get('CNT-ORIGEM')!,
      ...(extra.contaDestino ? { contaDestino: contas.get('CNT-DESTINO')! } : {}),
      ...(extra.contaPoupanca ? { contaPoupanca: contas.get('CNT-POUPANCA')! } : {})
    }, new UniqueEntityID('TRN00000000001')).getValue();

  const editar = (existing: Transacao, update: Record<string, unknown>) => {
    transacaoRepo.findById.mockResolvedValue(existing);
    return service.updateTransacao('TRN00000000001', update as never);
  };

  const editarValor = (existing: Transacao, valor: number) => editar(existing, { valor: { valor, moeda: 'EUR' } });

  beforeEach(() => {
    // Saldos de uma Concluída: criar (origem −100, destino +100) e concluir (destino −100; poupança +100)
    contas = new Map();
    persistidos = new Map();
    definirConta('CNT-ORIGEM', 400);
    definirConta('CNT-DESTINO', 0);
    definirConta('CNT-POUPANCA', 100);
    transacaoRepo = {
      findById: jest.fn(),
      update: jest.fn(async (t: unknown) => t),
      delete: jest.fn(async () => true)
    };
    contaRepo = {
      findById: jest.fn(async (id: unknown) => contas.get(String(id)) ?? null),
      findActiveById: jest.fn(async (id: unknown) => contas.get(String(id)) ?? null),
      update: jest.fn(async (c: unknown) => {
        const atualizada = c as Conta;
        persistidos.set(atualizada.id.toString(), atualizada.saldo.value);
        return c;
      })
    };
    const recorrentes = new TransacaoDespesasRecorrentesService(
      transacaoRepo as never, {} as never, {} as never, contaRepo as never, {} as never, {} as never, { error: jest.fn() }
    );
    // Stands in for the database transaction: a failed Result rolls the persisted balances back
    const unidadeDeTrabalho = {
      executar: async (trabalho: () => Promise<Result<unknown>>) => {
        const antes = new Map(persistidos);
        const resultado = await trabalho();
        if (resultado.isFailure) persistidos = antes;
        return resultado;
      }
    };
    service = new TransacaoService(
      transacaoRepo as never, {} as never, contaRepo as never, {} as never, recorrentes, {} as never, { error: jest.fn() },
      unidadeDeTrabalho as never
    );
  });

  it('editing a Concluída despesa mensal only moves the conta origem (issue #88)', async () => {
    const result = await editarValor(transacao('Despesa Mensal', 'Concluído', { contaDestino: true }), 120);

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(380);
    expect(saldo('CNT-DESTINO')).toBe(0);
    expect(contaRepo.update).not.toHaveBeenCalledWith(contas.get('CNT-DESTINO'));
  });

  it('editing a Concluída poupança moves the conta origem and the conta poupança, not the conta destino', async () => {
    const result = await editarValor(transacao('Poupança', 'Concluído', { contaDestino: true, contaPoupanca: true }), 120);

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(380);
    expect(saldo('CNT-DESTINO')).toBe(0);
    expect(saldo('CNT-POUPANCA')).toBe(120);
    expect(contaRepo.update).not.toHaveBeenCalledWith(contas.get('CNT-DESTINO'));
  });

  it('editing a Pendente despesa mensal still moves both the conta origem and the conta destino', async () => {
    definirConta('CNT-DESTINO', 100); // ainda não concluída

    const result = await editarValor(transacao('Despesa Mensal', 'Pendente', { contaDestino: true }), 120);

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(380);
    expect(saldo('CNT-DESTINO')).toBe(120);
  });

  it('editing a Pendente poupança moves the conta origem and the conta destino, not the conta poupança', async () => {
    definirConta('CNT-DESTINO', 100); // ainda não concluída
    definirConta('CNT-POUPANCA', 0);

    const result = await editarValor(transacao('Poupança', 'Pendente', { contaDestino: true, contaPoupanca: true }), 120);

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(380);
    expect(saldo('CNT-DESTINO')).toBe(120);
    expect(saldo('CNT-POUPANCA')).toBe(0);
  });

  it('editing a Pendente despesa mensal into Concluído takes the money out of the conta destino, like concluding it', async () => {
    definirConta('CNT-DESTINO', 100); // ainda não concluída

    const result = await editar(transacao('Despesa Mensal', 'Pendente', { contaDestino: true }), { status: 'Concluído' });

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(400);
    expect(saldo('CNT-DESTINO')).toBe(0);
  });

  it('editing a Concluída despesa mensal back into Pendente puts the money back in the conta destino', async () => {
    const result = await editar(transacao('Despesa Mensal', 'Concluído', { contaDestino: true }), { status: 'Pendente' });

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(400);
    expect(saldo('CNT-DESTINO')).toBe(100);
  });

  it('an edit that fails halfway through leaves the balances it already changed as they were', async () => {
    contaRepo.findById.mockImplementation(async (id: unknown) => (id === 'CNT-DESTINO' ? null : contas.get(String(id)) ?? null));

    // Revert (Concluída) writes the conta origem; apply (Pendente) then fails on the missing conta destino
    const result = await editar(transacao('Despesa Mensal', 'Concluído', { contaDestino: true }), { status: 'Pendente' });

    expect(result.isFailure).toBe(true);
    expect(contaRepo.update).toHaveBeenCalledWith(contas.get('CNT-ORIGEM'));
    expect(saldo('CNT-ORIGEM')).toBe(400);
    expect(transacaoRepo.update).not.toHaveBeenCalled();
  });

  it('deleting a Concluída despesa mensal only gives the money back to the conta origem', async () => {
    transacaoRepo.findById.mockResolvedValue(transacao('Despesa Mensal', 'Concluído', { contaDestino: true }));

    const result = await service.deleteTransacao('TRN00000000001');

    expect(result.isSuccess).toBe(true);
    expect(saldo('CNT-ORIGEM')).toBe(500);
    expect(saldo('CNT-DESTINO')).toBe(0);
  });
});
