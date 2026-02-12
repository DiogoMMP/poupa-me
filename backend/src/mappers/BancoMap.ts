import { Mapper } from '../core/infra/Mapper.js';
import { Banco } from '../domain/Banco/Entities/Banco.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import type { IBancoDTO } from '../dto/IBancoDTO.js';

/**
 * Mapper for the Banco aggregate. Handles conversion between domain entities,
 * persistence objects, and DTOs.
 */
export class BancoMap extends Mapper<Banco> {

    /**
     * Converts a raw persistence object into a Banco domain entity.
     * @param raw - Raw persistence object from database
     * @returns Banco domain entity or null if mapping fails
     */
    public static async toDomain(raw: unknown): Promise<Banco | null> {
        if (!raw) return null;
        const r = raw as Record<string, unknown>;

        const nomeResult = Nome.create(String(r['nome'] ?? ''));
        const iconResult = Icon.create(String(r['icon'] ?? ''));

        if (nomeResult.isFailure || iconResult.isFailure) {
            return null;
        }

        const userDomainId = String(r['user_domain_id'] ?? r['userDomainId'] ?? '');
        if (!userDomainId) return null;

        const bancoOrError = Banco.create({
            userId: new UniqueEntityID(userDomainId),
            nome: nomeResult.getValue(),
            icon: iconResult.getValue()
        }, new UniqueEntityID(String(r['domainId'] ?? r['domain_id'])));

        if (bancoOrError.isFailure) return null;

        return bancoOrError.getValue();
    }

    /**
     * Converts a Banco domain entity into a persistence-ready object.
     * @param banco - Banco domain entity
     * @returns Persistence object
     */
    public static toPersistence(banco: Banco): Record<string, unknown> {
        return {
            domainId: banco.id.toString(),
            nome: banco.nome.value,
            icon: banco.icon.value,
            user_domain_id: banco.userId.toString()
        };
    }

    /**
     * Converts a Banco domain entity into a DTO for API responses.
     * @param banco - Banco domain entity
     * @returns IBancoDTO
     */
    public static toDTO(banco: Banco): IBancoDTO {
        return {
            id: banco.id.toString(),
            userId: banco.userId.toString(),
            nome: banco.nome.value,
            icon: banco.icon.value
        };
    }
}

