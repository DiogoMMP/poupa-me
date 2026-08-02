import { TransacoesDTO } from '../dto/transacoes.dto';
import { TransacaoModel } from '../models/transacoes.model';

export class TransacoesMapper {
  /**
   * Map DTO to UI model
   * @param dto - transaction DTO from API
   */
  static toModel(dto: TransacoesDTO): TransacaoModel {
    return {
      id: dto.id,
      dia: dto.data.dia,
      mes: dto.data.mes,
      ano: dto.data.ano,
      descricao: dto.descricao,
      valor: dto.valor.valor,
      moeda: dto.valor.moeda,
      tipo: dto.tipo,
      categoria: {
        id: dto.categoria.id,
        nome: dto.categoria.nome ?? '',
        icon: dto.categoria.icon ?? ''
      },
      status: dto.status,
      conta: dto.conta ? { id: dto.conta.id, nome: dto.conta.nome, icon: dto.conta.icon, descricao: dto.conta.descricao } : undefined,
      cartaoCredito: dto.cartaoCredito ? { id: dto.cartaoCredito.id, nome: dto.cartaoCredito.nome, icon: dto.cartaoCredito.icon, descricao: dto.cartaoCredito.descricao } : undefined,
      contaDestino: dto.contaDestino ? { id: dto.contaDestino.id, nome: dto.contaDestino.nome, icon: dto.contaDestino.icon, descricao: dto.contaDestino.descricao } : undefined,
      contaPoupanca: dto.contaPoupanca ? { id: dto.contaPoupanca.id, nome: dto.contaPoupanca.nome, icon: dto.contaPoupanca.icon, descricao: dto.contaPoupanca.descricao } : undefined,
      user: dto.user ? { id: dto.user.id, nome: dto.user.nome, icon: dto.user.icon, descricao: dto.user.descricao } : undefined,
      userId: dto.userId ?? dto.user?.id
    };
  }

  /**
   * Map an array of DTOs to UI models
   */
  static toModelArray(dtos: TransacoesDTO[]): TransacaoModel[] {
    return dtos.map(d => this.toModel(d));
  }
}
