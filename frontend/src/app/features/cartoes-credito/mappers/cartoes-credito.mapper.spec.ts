import { CartoesCreditoMapper } from './cartoes-credito.mapper';
import { CartoesCreditoDTO } from '../dto/cartoes-credito.dto';

describe('CartoesCreditoMapper', () => {
  it('should map user and banco entity references from the DTO to the model', () => {
    const dto: CartoesCreditoDTO = {
      id: 'CRT00000000001',
      user: { id: 'USR00000000001', nome: 'Diogo Silva' },
      nome: 'Cartão Ouro',
      icon: '💳',
      limiteCredito: { valor: 1000, moeda: 'EUR' },
      saldoUtilizado: { valor: 100, moeda: 'EUR' },
      periodo: {
        inicio: { dia: 1, mes: 1, ano: 2026 },
        fecho: { dia: 28, mes: 1, ano: 2026 }
      },
      contaPagamentoId: 'CNT00000000001',
      banco: { id: 'BNC00000000001', nome: 'Santander' }
    };

    const model = CartoesCreditoMapper.toModel(dto);

    expect(model.user).toEqual({ id: 'USR00000000001', nome: 'Diogo Silva' });
    expect(model.banco).toEqual({ id: 'BNC00000000001', nome: 'Santander' });
  });
});
