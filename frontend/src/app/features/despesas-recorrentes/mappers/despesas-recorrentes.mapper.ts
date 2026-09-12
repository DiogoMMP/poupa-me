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
      userId: dto.user?.id,
      nome: dto.nome,
      icon: dto.icon,
      valor: dto.valor?.valor,
      moeda: dto.valor?.moeda,
      diaDoMes: dto.diaDoMes,
      categoriaId: dto.categoria.id,
      contaOrigemId: dto.contaOrigem.id,
      contaDestinoId: dto.contaDestino?.id,
      contaPoupancaId: dto.contaPoupanca?.id,
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

