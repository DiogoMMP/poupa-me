import type { Conta } from '../../domain/Conta/Entities/Conta.js';
import type { IContagemFilhos } from '../Shared/CascataSoftDelete.js';

export default interface IContaRepo {
    save(conta: Conta): Promise<Conta>;
    update(conta: Conta): Promise<Conta>;
    delete(contaId: string): Promise<void>;
    findById(contaId: string): Promise<Conta | null>;
    findActiveById(contaId: string): Promise<Conta | null>;
    findAll(userId?: string, bancoId?: string, includeInactive?: boolean): Promise<Conta[]>;
    contarFilhosAtivos(contaId: string): Promise<IContagemFilhos>;
    deleteComFilhos(contaId: string): Promise<void>;
}

