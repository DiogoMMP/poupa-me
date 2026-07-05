import type {Transacao} from "../../../domain/Transacao/Entities/Transacao.js";

export default interface ITransacaoDespesasRecorrentesRepo {
    findDespesaRecorrente(bancoId: string, userId?: string): Promise<Transacao[]>;
    findDespesaRecorrenteByCategoria(bancoId: string, categoriaId: string, userId?: string): Promise<Transacao[]>;
    findDespesaRecorrenteByStatus(bancoId: string, status: string, userId?: string): Promise<Transacao[]>;
    findDespesaRecorrenteByPeriod(bancoId: string, period: 'Este Mês' | 'Últimos 3 Meses' | 'Último Ano', userId?: string): Promise<Transacao[]>;
}
