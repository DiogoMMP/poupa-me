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
      conta: dto.conta as any,
      cartaoCredito: dto.cartaoCredito as any,
      userId: dto.userId
    };
  }

  /**
   * Map an array of DTOs to UI models
   */
  static toModelArray(dtos: TransacoesDTO[]): TransacaoModel[] {
    return dtos.map(d => this.toModel(d));
  }
}
