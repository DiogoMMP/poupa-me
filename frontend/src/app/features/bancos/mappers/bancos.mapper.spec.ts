import { BancosMapper } from './bancos.mapper';
import { BancosDTO } from '../dto/bancos.dto';

describe('BancosMapper', () => {
  it('should map the owning user entity reference from the DTO to the model', () => {
    const dto: BancosDTO = {
      id: 'BNC00000000001',
      user: { id: 'USR00000000001', nome: 'Diogo Silva' },
      nome: 'Santander',
      icon: '😊'
    };

    const model = BancosMapper.toModel(dto);

    expect(model.user).toEqual({ id: 'USR00000000001', nome: 'Diogo Silva' });
  });
});
