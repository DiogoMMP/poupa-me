import { jest, describe, it, expect } from '@jest/globals';
import DespesaRecorrenteProcessadorService from '../DespesaRecorrenteProcessadorService.js';
import { DespesaRecorrente } from '../../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';
import { Nome } from '../../../domain/Shared/ValueObjects/Nome.js';
import { Tipo } from '../../../domain/Shared/ValueObjects/Tipo.js';
import { Dinheiro } from '../../../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../../../core/domain/UniqueEntityID.js';
import type IDespesaRecorrenteRepo from '../../../repos/DespesaRecorrente/IRepos/IDespesaRecorrenteRepo.js';
import type IDespesaRecorrenteQueryRepo from '../../../repos/DespesaRecorrente/IRepos/IDespesaRecorrenteQueryRepo.js';
import type ITransacaoDespesasRecorrentesService from '../../Transacao/IServices/ITransacaoDespesasRecorrentesService.js';

function buildRegra(tipo: string, overrides: Partial<{ diaDoMes: number; mes: number }> = {}): DespesaRecorrente {
  return DespesaRecorrente.create({
    userId: new UniqueEntityID('USR00000000001'),
    nome: Nome.create('Seguro Carro').getValue(),
    icon: '🚗',
    categoriaId: new UniqueEntityID('CAT00000000001'),
    contaOrigemId: new UniqueEntityID('CNT00000000001'),
    valor: Dinheiro.create(50, 'EUR').getValue(),
    tipo: Tipo.create(tipo).getValue(),
    ultimoProcessamento: null,
    ativo: true,
    imediata: true,
    diaDoMes: overrides.diaDoMes,
    mes: overrides.mes
  }).getValue();
}

describe('DespesaRecorrenteProcessadorService — getDataAgendada', () => {
  // getDataAgendada is private; accessed via cast to test the calendar-validity guard directly,
  // without mocking the full gerarTransacao dependency chain.
  const service = new DespesaRecorrenteProcessadorService(
    {} as unknown as IDespesaRecorrenteRepo,
    {} as unknown as IDespesaRecorrenteQueryRepo,
    {} as unknown as ITransacaoDespesasRecorrentesService,
    { error: jest.fn() }
  ) as unknown as { getDataAgendada(regra: DespesaRecorrente, hoje: Date): Date | null };

  it('should return null for a Despesa Anual scheduled on a day that does not exist in the given month (29/Fev on a non-leap year)', () => {
    const regra = buildRegra('Despesa Anual', { mes: 2, diaDoMes: 29 });
    const hoje = new Date(2026, 0, 15); // 2026 is not a leap year

    const data = service.getDataAgendada(regra, hoje);

    expect(data).toBeNull();
  });

  it('should return null for a Despesa Mensal scheduled on day 31 in a month with fewer days', () => {
    const regra = buildRegra('Despesa Mensal', { diaDoMes: 31 });
    const hoje = new Date(2026, 3, 15); // April has 30 days

    const data = service.getDataAgendada(regra, hoje);

    expect(data).toBeNull();
  });

  it('should still return the scheduled date for a valid Despesa Anual mes/diaDoMes combination', () => {
    const regra = buildRegra('Despesa Anual', { mes: 3, diaDoMes: 15 });
    const hoje = new Date(2026, 0, 15);

    const data = service.getDataAgendada(regra, hoje);

    expect(data).not.toBeNull();
    expect(data?.getMonth()).toBe(2); // March, 0-indexed
    expect(data?.getDate()).toBe(15);
  });
});
