import type { Conta } from '../../domain/Conta/Entities/Conta.js';

export default interface IContaRepo {
    save(conta: Conta): Promise<Conta>;
    update(conta: Conta): Promise<Conta>;
    delete(contaId: string): Promise<void>;
    findById(contaId: string): Promise<Conta | null>;
    findAll(userId?: string): Promise<Conta[]>;
}

