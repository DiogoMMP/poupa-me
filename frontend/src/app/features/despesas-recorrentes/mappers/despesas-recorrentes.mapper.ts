import { DespesaRecorrenteDTO } from '../dto/despesas-recorrentes.dto';
import { DespesaRecorrenteModel } from '../models/despesas-recorrentes.model';

export class DespesasRecorrentesMapper {
  /**
   * Map API DTO to UI model
   */
  static toModel(dto: DespesaRecorrenteDTO): DespesaRecorrenteModel {
    const temValor = dto.valor != null;
    return {
      id: dto.id,
      userId: dto.userId,
      nome: dto.nome,
      icon: dto.icon,
      valor: dto.valor?.valor,
      moeda: dto.valor?.moeda,
      diaDoMes: dto.diaDoMes,
      categoriaId: dto.categoriaId,
      contaOrigemId: dto.contaOrigemId,
      contaDestinoId: dto.contaDestinoId,
      contaPoupancaId: dto.contaPoupancaId,
      tipo: dto.tipo,
      ultimoProcessamento: dto.ultimoProcessamento,
      ativo: dto.ativo,
      imediata: dto.imediata,
      diaDaSemana: dto.diaDaSemana,
      mes: dto.mes,
      temValor
    };
  }

  /**
   * Map an array of DTOs to UI models
   */
  static toModelArray(dtos: DespesaRecorrenteDTO[]): DespesaRecorrenteModel[] {
    return dtos.map(d => this.toModel(d));
  }
}

