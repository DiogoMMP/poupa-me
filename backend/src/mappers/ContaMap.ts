import { Mapper } from '../core/infra/Mapper.js';
import { Result } from '../core/logic/Result.js';
import { Conta } from '../domain/Conta/Entities/Conta.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import type { IContaDTO } from '../dto/IContaDTO.js';

/**
 * Mapper for Conta aggregate: persistence <-> domain <-> DTO
 */
export class ContaMap extends Mapper<Conta> {
    public static async toDomain(raw: unknown): Promise<Conta | null> {
        if (!raw) return null;
        const r = raw as Record<string, unknown>;

        // Read authenticated owner id from DB/raw object: prefer snake_case column but accept camelCase entity prop
        const userIdRaw = String(r['user_domain_id'] ?? r['userDomainId'] ?? r['userId'] ?? '');
        if (!userIdRaw) {
            console.error('ContaMap.toDomain: Missing userId in raw data:', r);
            return null;
        }

        const userId = new UniqueEntityID(userIdRaw);
        const nomeStr = String(r['nome'] ?? r['name'] ?? '');
        const iconStr = String(r['icon'] ?? '');

        const nomeResult = Nome.create(nomeStr);
        const iconResult = Icon.create(iconStr);

        // Handle saldo: can be a number (from DB entity), an object {valor, moeda}, or nested structure
        let saldoVal = 0;
        let moeda = 'EUR';

        if (typeof r['saldo'] === 'number' || typeof r['saldo'] === 'string') {
            // Direct number from TypeORM entity
            saldoVal = Number(r['saldo']);
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (r['saldo'] && typeof r['saldo'] === 'object') {
            // Object structure {valor, moeda}
            const saldoObj = r['saldo'] as Record<string, unknown>;
            saldoVal = Number(saldoObj['valor'] ?? saldoObj['value'] ?? 0);
            moeda = String(saldoObj['moeda'] ?? saldoObj['currency'] ?? r['moeda'] ?? 'EUR');
        } else {
            // Fallback
            saldoVal = 0;
            moeda = String(r['moeda'] ?? 'EUR');
        }

        const dinheiroResult = Dinheiro.create(Number(saldoVal), moeda);

        const combined = Result.combine([nomeResult, iconResult, dinheiroResult]);
        if (combined.isFailure) {
            console.error('ContaMap.toDomain: Value object creation failed:', combined.errorValue(), { nome: nomeStr, icon: iconStr, saldo: saldoVal, moeda });
            return null;
        }

        const bancoId = r['bancoId'] ?? r['banco_id'];
        const domainId = String(r['domainId'] ?? r['domain_id'] ?? '');

        const contaOrError = Conta.create({
            userId,
            nome: nomeResult.getValue(),
            icon: iconResult.getValue(),
            saldo: dinheiroResult.getValue(),
            bancoId: bancoId ? String(bancoId) : undefined
        }, domainId ? new UniqueEntityID(domainId) : undefined);

        if (contaOrError.isFailure) {
            console.error('ContaMap.toDomain: Conta.create failed:', contaOrError.errorValue());
            return null;
        }

        return contaOrError.getValue();
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
            user_domain_id: conta.userId.toString(),
            banco_id: conta.bancoId
        };
    }

    /**
     * Maps a Conta domain entity to a DTO for API responses.
     * @param conta The Conta domain entity to map
     */
    public static toDTO(conta: Conta): IContaDTO {
        return {
            id: conta.id.toString(),
            userId: conta.userId.toString(),
            nome: conta.nome.value,
            icon: conta.icon.value,
            saldo: { valor: conta.saldo.value, moeda: conta.saldo.moeda },
            bancoId: conta.bancoId
        } as IContaDTO;
    }
}
