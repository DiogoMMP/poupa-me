import type {Transacao} from "../../domain/Transacao/Entities/Transacao.js";

export default interface ITransacaoRepo {
    save(transacao: Transacao): Promise<Transacao>;
    update(transacao: Transacao): Promise<Transacao>;
    delete(transacaoId: string): Promise<void>;
    findById(transacaoId: string): Promise<Transacao | null>;
    findAll(userId?: string): Promise<Transacao[]>;

    findByCategoria(categoriaId: string, userId?: string): Promise<Transacao[]>;
    findByTipo(tipo: string, userId?: string): Promise<Transacao[]>;
    findByStatus(status: string, userId?: string): Promise<Transacao[]>;
    findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Transacao[]>;
}