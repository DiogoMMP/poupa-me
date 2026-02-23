import { Mapper } from '../core/infra/Mapper.js';
import { Result } from '../core/logic/Result.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { Descricao } from '../domain/Transacao/ValueObjects/Descricao.js';
import { Data } from '../domain/Shared/ValueObjects/Data.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Tipo } from '../domain/Transacao/ValueObjects/Tipo.js';
import { Status } from '../domain/Transacao/ValueObjects/Status.js';
import { CategoriaMap } from './CategoriaMap.js';
import { ContaMap } from './ContaMap.js';
import { CartaoCreditoMap } from './CartaoCreditoMap.js';
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

        // Descricao (use entity column 'descricao')
        const descricaoResult = Descricao.create(String(r['descricao'] ?? ''));

        // Data: use entity columns 'dia', 'mes', 'ano'
        const day = Number(r['dia'] ?? NaN);
        const month = Number(r['mes'] ?? NaN);
        const year = Number(r['ano'] ?? NaN);
        let dataResult: Result<Data>;
        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
            dataResult = Data.createFromParts(day, month, year);
        } else {
            dataResult = Result.fail<Data>('Invalid or missing data');
        }

        // Dinheiro: accept multiple persistence shapes:
        // - DB returns a plain decimal (number or string) in 'valor' column
        // - Mapper may provide an object { valor, moeda }
        let valorNumber: number;
        let moeda: string;
        const valorRaw = r['valor'] ?? r['valor'] ?? null;
        if (valorRaw === null || valorRaw === undefined) {
            valorNumber = 0;
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (typeof valorRaw === 'object') {
            const v = (valorRaw as Record<string, unknown>)['valor'] ?? (valorRaw as Record<string, unknown>)['value'] ?? 0;
            valorNumber = typeof v === 'string' ? Number(String(v).replace(',', '.')) || 0 : Number(v || 0);
            moeda = String((valorRaw as Record<string, unknown>)['moeda'] ?? (valorRaw as Record<string, unknown>)['currency'] ?? r['moeda'] ?? 'EUR');
        } else {
            // string or number
            valorNumber = Number(String(valorRaw).replace(',', '.')) || 0;
            moeda = String(r['moeda'] ?? 'EUR');
        }
        const dinheiroResult = Dinheiro.create(Number(valorNumber), String(moeda));

        // Tipo and Status
        const tipoResult = Tipo.create(String(r['tipo'] ?? ''));
        const statusResult = Status.create(String(r['status'] ?? ''));

        // Categoria (may be nested object or null)
        let categoriaDomain = null;
        if (r['categoria']) {
            try {
                categoriaDomain = await CategoriaMap.toDomain(r['categoria']);
                if (!categoriaDomain) {
                    console.error('TransacaoMap.toDomain - CategoriaMap.toDomain returned null for nested categoria:', r['categoria']);
                    throw new Error('TransacaoMap.toDomain: failed to map nested categoria');
                }
            } catch (e) {
                console.error('TransacaoMap.toDomain - error mapping nested categoria. raw.categoria=%o, err=%o', r['categoria'], e);
                throw e;
            }
        } else if (r['categoria_id']) {
            // expecting joined categoria object; if not present, cannot construct full domain
            console.error('TransacaoMap.toDomain - missing nested categoria object but categoria_id present in raw:', r);
            throw new Error('TransacaoMap.toDomain: missing nested categoria object; categoria_id present without join');
        } else {
            console.error('TransacaoMap.toDomain - missing categoria in raw:', r);
            throw new Error('TransacaoMap.toDomain: missing categoria'); // category required
        }

        // Conta (optional)
        let contaDomain = null;
        if (r['conta']) {
            contaDomain = await ContaMap.toDomain(r['conta']);
            if (!contaDomain) throw new Error('TransacaoMap.toDomain: failed to map nested conta');
        } else if (r['conta_id']) {
            // no nested join provided
            contaDomain = null;
        }

        // ContaDestino (optional - only for Despesa Mensal)
        let contaDestinoDomain = null;
        if (r['contaDestino']) {
            contaDestinoDomain = await ContaMap.toDomain(r['contaDestino']);
            if (!contaDestinoDomain) throw new Error('TransacaoMap.toDomain: failed to map nested contaDestino');
        } else if (r['conta_destino_id']) {
            contaDestinoDomain = null;
        }

        // ContaPoupanca (optional - only for Poupança)
        let contaPoupancaDomain = null;
        if (r['contaPoupanca']) {
            contaPoupancaDomain = await ContaMap.toDomain(r['contaPoupanca']);
            if (!contaPoupancaDomain) throw new Error('TransacaoMap.toDomain: failed to map nested contaPoupanca');
        } else if (r['conta_poupanca_id']) {
            contaPoupancaDomain = null;
        }

        // CartaoCredito (optional)
        let cartaoCreditoDomain = null;
        if (r['cartaoCredito']) {
            cartaoCreditoDomain = await CartaoCreditoMap.toDomain(r['cartaoCredito']);
            if (!cartaoCreditoDomain) throw new Error('TransacaoMap.toDomain: failed to map nested cartaoCredito');
        } else if (r['cartao_credito_id']) {
            // no nested join provided
            cartaoCreditoDomain = null;
        }

        const combinedResults = Result.combine([
            descricaoResult,
            dataResult,
            dinheiroResult,
            tipoResult,
            statusResult
        ]);

        if (combinedResults.isFailure) {
            // Log detailed VO errors for diagnostics
            const details: Record<string, unknown> = {};
            try {
                details.descricaoError = descricaoResult.isFailure ? descricaoResult.errorValue() : undefined;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) { details.descricaoError = descricaoResult.error; }
            try {
                details.dataError = dataResult.isFailure ? dataResult.errorValue() : undefined;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) { details.dataError = dataResult.error; }
            try {
                details.dinheiroError = dinheiroResult.isFailure ? dinheiroResult.errorValue() : undefined;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) { details.dinheiroError = dinheiroResult.error; }
            try {
                details.tipoError = tipoResult.isFailure ? tipoResult.errorValue() : undefined;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) { details.tipoError = tipoResult.error; }
            try {
                details.statusError = statusResult.isFailure ? statusResult.errorValue() : undefined;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) { details.statusError = statusResult.error; }

            console.error('TransacaoMap.toDomain - VO validation failed. raw=%o, details=%o', r, details);
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
                ...(contaDestinoDomain ? { contaDestino: contaDestinoDomain } : {}),
                ...(contaPoupancaDomain ? { contaPoupanca: contaPoupancaDomain } : {}),
                ...(cartaoCreditoDomain ? { cartaoCredito: cartaoCreditoDomain } : {})
            },
            new UniqueEntityID(String(r['domainId'] ?? r['id']))
        );

        if (!transacaoOrError.isSuccess) return null;

        // Attach owner user id (non-domain prop) to the returned object so higher layers can persist/inspect it
        const domainObj = transacaoOrError.getValue();
        const userIdFromRaw = String(r['user_domain_id'] ?? '');
        if (userIdFromRaw) {
            (domainObj as unknown as DomainWithUser).userDomainId = userIdFromRaw;
            // Also ensure nested conta/cartao domain objects use the same owner id so DTOs match
            try {
                if ((domainObj as any).conta && (userIdFromRaw)) {
                    // write directly into the Conta props.userId so ContaMap.toDTO will show this owner
                    (domainObj as any).conta.props.userId = new UniqueEntityID(userIdFromRaw);
                }
            } catch (_e) { /* ignore */ }
            try {
                if ((domainObj as any).cartaoCredito && (userIdFromRaw)) {
                    (domainObj as any).cartaoCredito.props.userId = new UniqueEntityID(userIdFromRaw);
                }
            } catch (_e) { /* ignore */ }
        }

        if (contaDomain) {
            (domainObj as unknown as Record<string, unknown>)['contaId'] = contaDomain.id.toString();
        } else if (r['conta_id']) {
            (domainObj as unknown as Record<string, unknown>)['contaId'] = String(r['conta_id']);
        }

        if (cartaoCreditoDomain) {
            (domainObj as unknown as Record<string, unknown>)['cartaoCreditoId'] = cartaoCreditoDomain.id.toString();
        } else if (r['cartao_credito_id']) {
            (domainObj as unknown as Record<string, unknown>)['cartaoCreditoId'] = String(r['cartao_credito_id']);
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
            categoria_id: transacao.categoria.id.toString(),
            conta_id: transacao.conta ? transacao.conta.id.toString() : (transacao as unknown as Record<string, unknown>)['contaId'] ?? undefined,
            cartao_credito_id: transacao.cartaoCredito ? transacao.cartaoCredito.id.toString() : (transacao as unknown as Record<string, unknown>)['cartaoCreditoId'] ?? undefined,
            conta_destino_id: transacao.contaDestino ? transacao.contaDestino.id.toString() : undefined,
            conta_poupanca_id: transacao.contaPoupanca ? transacao.contaPoupanca.id.toString() : undefined,
            status: transacao.status.value,
            user_domain_id: userDomainId ?? undefined
        };
    }

    /**
     * Converts a Transacao domain entity into an ITransacaoDTO for API responses.
     */
    public static toDTO(transacao: Transacao): ITransacaoDTO {
        const userDomainId = (transacao as unknown as DomainWithUser).userDomainId ?? '';

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
            conta: (() => {
                if (!transacao.conta) return undefined;
                const contaDto = ContaMap.toDTO(transacao.conta);
                // Prefer transaction-level user id if available to ensure consistency
                if (userDomainId) contaDto.userId = String(userDomainId);
                return contaDto;
            })(),
            cartaoCredito: (() => {
                if (!transacao.cartaoCredito) return undefined;
                const cartaoDto = CartaoCreditoMap.toDTO(transacao.cartaoCredito);
                if (userDomainId) cartaoDto.userId = String(userDomainId);
                return cartaoDto;
            })(),
            contaDestino: transacao.contaDestino ? ContaMap.toDTO(transacao.contaDestino) : undefined,
            contaPoupanca: transacao.contaPoupanca ? ContaMap.toDTO(transacao.contaPoupanca) : undefined,
            userId: userDomainId
        } as ITransacaoDTO;
    }
}
