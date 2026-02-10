import { Mapper } from '../core/infra/Mapper.js';
import { Result } from '../core/logic/Result.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../domain/Transacao/ValueObjects/Data.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Tipo } from '../domain/Transacao/ValueObjects/Tipo.js';
import { Status } from '../domain/Transacao/ValueObjects/Status.js';
import { Reembolso } from '../domain/Transacao/ValueObjects/Reembolso.js';
import { CategoriaMap } from './CategoriaMap.js';
import { ContaMap } from './ContaMap.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import type { ITransacaoDTO } from '../dto/ITransacaoDTO.js';

type DomainWithUser = { userDomainId?: string };

/**
 * Mapper for the Transacao aggregate. Responsible for converting raw persistence records into the
 * Transacao domain entity, producing persistence-ready objects from a Transacao domain entity, and
 * creating DTOs for API responses.
 */
export class TransacaoMap extends Mapper<Transacao> {

    /**
     * Convert a raw persistence object into a Transacao domain entity. Returns null if any required
     * value object creation fails or if the input is not valid.
     */
    public static async toDomain(raw: unknown): Promise<Transacao | null> {
        if (!raw) return null;
        const r = raw as Record<string, unknown>;

        // Descricao
        const descricaoResult = Descricao.create(String(r['descricao'] ?? r['description'] ?? ''));

        // Data: support object {data: {dia,mes,ano}} or top-level fields {dia,mes,ano} or {day,month,year} or string DD-MM-YYYY
        let dataResult: Result<Data>;
        const rawData = r['data'];
        if (rawData && typeof rawData === 'object') {
            const day = Number((rawData as Record<string, unknown>)['dia'] ?? (rawData as Record<string, unknown>)['day']);
            const month = Number((rawData as Record<string, unknown>)['mes'] ?? (rawData as Record<string, unknown>)['month']);
            const year = Number((rawData as Record<string, unknown>)['ano'] ?? (rawData as Record<string, unknown>)['year']);
            dataResult = Data.createFromParts(day, month, year);
        } else if (typeof rawData === 'string') {
            dataResult = Data.parse(String(rawData));
        } else if (r['dia'] !== undefined || r['mes'] !== undefined || r['ano'] !== undefined) {
            const day = Number(r['dia'] ?? r['day']);
            const month = Number(r['mes'] ?? r['month']);
            const year = Number(r['ano'] ?? r['year']);
            dataResult = Data.createFromParts(day, month, year);
        } else {
            dataResult = Result.fail<Data>('Invalid or missing data');
        }

        // Dinheiro: support either nested object {valor:{valor,moeda}} or top-level numeric column 'valor' and 'moeda'
        let valorNumber: number;
        let moeda: string;
        if (typeof r['valor'] === 'number' || typeof r['valor'] === 'string') {
            // top-level numeric column
            valorNumber = Number(r['valor']);
            moeda = String(r['moeda'] ?? r['currency'] ?? 'EUR');
        } else {
            const valorObj = (r['valor'] ?? r['amount'] ?? r['value'] ?? {}) as Record<string, unknown>;
            valorNumber = Number(valorObj['valor'] ?? valorObj['value'] ?? 0);
            moeda = String(valorObj['moeda'] ?? valorObj['currency'] ?? 'EUR');
        }
        const dinheiroResult = Dinheiro.create(Number(valorNumber), String(moeda));

        // Tipo and Status
        const tipoResult = Tipo.create(String(r['tipo'] ?? r['type'] ?? ''));
        const statusResult = Status.create(String(r['status'] ?? r['estado'] ?? ''));

        // Categoria (may be nested object or null)
        let categoriaDomain = null;
        if (r['categoria']) {
            categoriaDomain = await CategoriaMap.toDomain(r['categoria']);
            if (!categoriaDomain) throw new Error('TransacaoMap.toDomain: failed to map nested categoria');
        } else if (r['categoriaId'] || r['categoria_id']) {
            // Attempt to resolve a Categoria domain from provided id; if CategoriaMap cannot build it, fail explicitly
            categoriaDomain = (await CategoriaMap.toDomain({ id: r['categoriaId'] ?? r['categoria_id'] })) || null;
            if (!categoriaDomain) throw new Error('TransacaoMap.toDomain: categoriaId present but failed to map categoria');
        } else {
            throw new Error('TransacaoMap.toDomain: missing categoria'); // category required
        }

        // Conta (optional)
        let contaDomain = null;
        if (r['conta']) {
            contaDomain = await ContaMap.toDomain(r['conta']);
            if (!contaDomain) throw new Error('TransacaoMap.toDomain: failed to map nested conta');
        } else if (r['contaId'] || r['conta_id']) {
            contaDomain = (await ContaMap.toDomain({ id: r['contaId'] ?? r['conta_id'] })) || null;
        }

        // Reembolso (optional)
        let reembolsoResult: Result<Reembolso> | null = null;
        const reembolsoRaw = r['originalTransactionId'] ?? r['original_transaction_id'] ?? r['original_transactionid'];
        if (reembolsoRaw) {
            const reembolsoId = String(reembolsoRaw);
            reembolsoResult = Reembolso.create(new UniqueEntityID(reembolsoId));
        }

        const combinedResults = Result.combine([
            descricaoResult,
            dataResult,
            dinheiroResult,
            tipoResult,
            statusResult,
            ...(reembolsoResult ? [reembolsoResult] : [])
        ]);

        if (combinedResults.isFailure) {
            // Throw with details so upper layers (repo/service) can log the input that caused the failure.
            const details = {
                descricaoError: descricaoResult.isFailure ? descricaoResult.errorValue() : undefined,
                dataError: dataResult.isFailure ? dataResult.errorValue() : undefined,
                dinheiroError: dinheiroResult.isFailure ? dinheiroResult.errorValue() : undefined,
                tipoError: tipoResult.isFailure ? tipoResult.errorValue() : undefined,
                statusError: statusResult.isFailure ? statusResult.errorValue() : undefined
            };
            throw new Error(`TransacaoMap.toDomain: value object validation failed: ${JSON.stringify(details)}`);
        }

        const transacaoOrError = Transacao.create(
            {
                descricao: descricaoResult.getValue(),
                data: dataResult.getValue(),
                valor: dinheiroResult.getValue(),
                tipo: tipoResult.getValue(),
                categoria: categoriaDomain,
                status: statusResult.getValue(),
                ...(contaDomain ? { conta: contaDomain } : {}),
                reembolso: reembolsoResult ? reembolsoResult.getValue() : undefined
            },
            new UniqueEntityID(String(r['domainId'] ?? r['id']))
        );

        if (!transacaoOrError.isSuccess) return null;

        // Attach owner user id (non-domain prop) to the returned object so higher layers can persist/inspect it
        const domainObj = transacaoOrError.getValue();
        const userIdFromRaw = String(r['userDomainId'] ?? r['user_domain_id'] ?? r['userId'] ?? '');
        if (userIdFromRaw) (domainObj as unknown as DomainWithUser).userDomainId = userIdFromRaw;

        // Preserve originalTransactionId on the returned domain object (non-domain prop) so DTO mapping can use it when necessary
        if (reembolsoRaw) {
            (domainObj as unknown as Record<string, unknown>)['originalTransactionId'] = String(reembolsoRaw);
        }

        if (contaDomain) {
            (domainObj as unknown as Record<string, unknown>)['contaId'] = contaDomain.id.toString();
        } else if (r['contaId'] || r['conta_id']) {
            (domainObj as unknown as Record<string, unknown>)['contaId'] = String(r['contaId'] ?? r['conta_id']);
        }

        return domainObj;
    }

    /**
     * Converts a Transacao domain entity into a persistence-ready record.
     */
    public static toPersistence(transacao: Transacao): Record<string, unknown> {
        const userDomainId = (transacao as unknown as DomainWithUser).userDomainId;
        return {
            domainId: transacao.id.toString(),
            descricao: transacao.descricao.value,
            data: {
                dia: transacao.data.day,
                mes: transacao.data.month,
                ano: transacao.data.year
            },
            valor: {
                valor: transacao.valor.value,
                moeda: transacao.valor.moeda
            },
            tipo: transacao.tipo.value,
            categoriaId: transacao.categoria.id.toString(),
            // allow a non-domain attached property 'contaId' (string) so callers can set conta without constructing a Conta domain
            contaId: transacao.conta ? transacao.conta.id.toString() : (transacao as unknown as Record<string, unknown>)['contaId'] ?? undefined,
            status: transacao.status.value,
            reembolso: transacao.reembolso ? transacao.reembolso.originalTransactionId.toString() : undefined,
            userDomainId: userDomainId ?? undefined
        };
    }

    /**
     * Converts a Transacao domain entity into an ITransacaoDTO for API responses.
     */
    public static toDTO(transacao: Transacao): ITransacaoDTO {
        const userDomainId = (transacao as unknown as DomainWithUser).userDomainId ?? '';
        // attempt to derive reembolso id from domain VO or from any attached raw properties
        const rawTrans = transacao as unknown as Record<string, unknown>;
        const reembolsoFromVO = transacao.reembolso ? transacao.reembolso.originalTransactionId.toString() : undefined;
        const reembolsoFallback = (rawTrans['originalTransactionId'] ?? rawTrans['original_transaction_id'] ?? rawTrans['original_transactionid']) as string | undefined;
        const reembolsoValue = reembolsoFromVO ?? (reembolsoFallback ? String(reembolsoFallback) : undefined);

        return {
            id: transacao.id.toString(),
            data: {
                dia: transacao.data.day,
                mes: transacao.data.month,
                ano: transacao.data.year
            },
            descricao: transacao.descricao.value,
            valor: {
                valor: transacao.valor.value,
                moeda: transacao.valor.moeda
            },
            tipo: transacao.tipo.value,
            categoria: CategoriaMap.toDTO(transacao.categoria),
            status: transacao.status.value,
            reembolso: reembolsoValue,
            contaId: (transacao as unknown as Record<string, unknown>)['contaId'] ?? undefined,
            userId: userDomainId
        } as ITransacaoDTO;
    }
}
