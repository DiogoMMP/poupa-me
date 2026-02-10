import { Mapper } from '../core/infra/Mapper.js';
import { Result } from '../core/logic/Result.js';
import { Conta } from '../domain/Conta/Entities/Conta.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import type { IContaDTO } from '../dto/IContaDTO.js';
import type { ITransacaoDTO } from '../dto/ITransacaoDTO.js';

/**
 * Mapper for Conta aggregate: persistence <-> domain <-> DTO
 */
export class ContaMap extends Mapper<Conta> {
    public static async toDomain(raw: unknown): Promise<Conta | null> {
        if (!raw) return null;
        const r = raw as Record<string, unknown>;

        const userId = new UniqueEntityID(String(r['user_domain_id'] ?? r['userId'] ?? r['userId'] ?? ''));
        const nomeResult = Nome.create(String(r['nome'] ?? r['name'] ?? ''));
        const iconResult = Icon.create(String(r['icon'] ?? ''));
        const saldoRaw = r['saldo'] as Record<string, unknown> | undefined;
        const saldoVal = typeof r['saldo'] === 'number' || typeof r['saldo'] === 'string' ? Number(r['saldo']) : (saldoRaw && (Number(saldoRaw['valor'] ?? saldoRaw['value'] ?? 0))) || 0;
        const moeda = String((saldoRaw && (saldoRaw['moeda'] ?? saldoRaw['currency'])) ?? r['moeda'] ?? 'EUR');
        const dinheiroResult = Dinheiro.create(Number(saldoVal), moeda);

        const combined = Result.combine([nomeResult, iconResult, dinheiroResult]);
        if (combined.isFailure) return null;

        // Avoid mapping nested transactions here to prevent circular imports; pass empty array.
        const contaOrError = Conta.create({
            userId,
            nome: nomeResult.getValue(),
            icon: iconResult.getValue(),
            saldo: dinheiroResult.getValue(),
            transacoes: []
        }, new UniqueEntityID(String(r['domainId'] ?? r['id'])));

        return contaOrError.isSuccess ? contaOrError.getValue() : null;
    }

    /**
     * Maps a Conta domain entity to a plain object suitable for persistence. Note that this does not handle nested transactions;
     * @param conta The Conta domain entity to map
     */
    public static toPersistence(conta: Conta): Record<string, unknown> {
        return {
            domainId: conta.id.toString(),
            nome: conta.nome.value,
            icon: conta.icon.value,
            saldo: { valor: conta.saldo.value, moeda: conta.saldo.moeda },
            user_domain_id: conta.userId.toString()
        };
    }

    /**
     * Maps a Conta domain entity to a DTO for API responses. This includes mapping nested transactions to their IDs to avoid circular references.
     * @param conta The Conta domain entity to map
     */
    public static toDTO(conta: Conta): IContaDTO {
        return {
            id: conta.id.toString(),
            userId: conta.userId.toString(),
            nome: conta.nome.value,
            icon: conta.icon.value,
            saldo: { valor: conta.saldo.value, moeda: conta.saldo.moeda },
            transacoes: conta.transacoes.map(t => {
                const maybe = t as unknown as { id?: unknown };
                return maybe.id !== undefined ? ({ id: String(maybe.id) } as unknown as ITransacaoDTO) : ({} as unknown as ITransacaoDTO);
            })
        } as IContaDTO;
    }
}
