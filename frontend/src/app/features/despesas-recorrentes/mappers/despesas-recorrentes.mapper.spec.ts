import { DespesasRecorrentesMapper } from './despesas-recorrentes.mapper';
import { DespesaRecorrenteDTO } from '../dto/despesas-recorrentes.dto';

describe('DespesasRecorrentesMapper', () => {
  it('should map user/categoria/contaOrigem/contaDestino/contaPoupanca entity references from the DTO to flat ids on the model', () => {
    const dto: DespesaRecorrenteDTO = {
      id: 'DR00000000001',
      user: { id: 'USR00000000001', nome: 'Diogo Silva' },
      nome: 'Renda',
      icon: '🏠',
      valor: { valor: 500, moeda: 'EUR' },
      diaDoMes: 1,
      categoria: { id: 'CAT00000000001', nome: 'Habitação', icon: '🏠' },
      contaOrigem: { id: 'CNT00000000001', nome: 'Conta Ordenado' },
      contaDestino: { id: 'CNT00000000002', nome: 'Poupança' },
      contaPoupanca: { id: 'CNT00000000003', nome: 'Mealheiro' },
      tipo: 'Despesa Mensal',
      ultimoProcessamento: null,
      ativo: true,
      imediata: false
    };

    const model = DespesasRecorrentesMapper.toModel(dto);

    expect(model.userId).toBe('USR00000000001');
    expect(model.categoriaId).toBe('CAT00000000001');
    expect(model.contaOrigemId).toBe('CNT00000000001');
    expect(model.contaDestinoId).toBe('CNT00000000002');
    expect(model.contaPoupancaId).toBe('CNT00000000003');
  });
});
