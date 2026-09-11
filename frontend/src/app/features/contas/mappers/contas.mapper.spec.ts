import { ContasMapper } from './contas.mapper';
import { ContasDto } from '../dto/contas.dto';

describe('ContasMapper', () => {
  it('should map user and banco entity references from the DTO to the model', () => {
    const dto: ContasDto = {
      id: 'CNT00000000001',
      user: { id: 'USR00000000001', nome: 'Diogo Silva' },
      nome: 'Conta Corrente',
      icon: '💳',
      saldo: { valor: 100, moeda: 'EUR' },
      banco: { id: 'BNC00000000001', nome: 'Santander' }
    };

    const model = ContasMapper.toModel(dto);

    expect(model.user).toEqual({ id: 'USR00000000001', nome: 'Diogo Silva' });
    expect(model.banco).toEqual({ id: 'BNC00000000001', nome: 'Santander' });
  });
});
