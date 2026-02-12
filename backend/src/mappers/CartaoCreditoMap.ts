import { Mapper } from '../core/infra/Mapper.js';
import { Result } from '../core/logic/Result.js';
import { CartaoCredito } from '../domain/CartaoCredito/Entities/CartaoCredito.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Periodo } from '../domain/CartaoCredito/ValueObjects/Periodo.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import type { ICartaoCreditoDTO } from '../dto/ICartaoCreditoDTO.js';
import { Data } from '../domain/Shared/ValueObjects/Data.js';

/**
 * Mapper for CartaoCredito aggregate: persistence <-> domain <-> DTO
 */
export class CartaoCreditoMap extends Mapper<CartaoCredito> {
    public static async toDomain(raw: unknown): Promise<CartaoCredito | null> {
        if (!raw) return null;
        const r = raw as Record<string, unknown>;

        const userId = new UniqueEntityID(String(r['user_domain_id'] ?? r['userId'] ?? ''));
        const nomeResult = Nome.create(String(r['nome'] ?? r['name'] ?? ''));
        const iconResult = Icon.create(String(r['icon'] ?? ''));

        // Handle limiteCredito - accept number, string, snake_case, or nested object with valor/moeda
        let limiteCreditoVal: number;
        let moeda: string;
        const limiteRaw = r['limiteCredito'] ?? r['limite_credito'] ?? null;
        if (limiteRaw === null || limiteRaw === undefined) {
            limiteCreditoVal = 0;
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (typeof limiteRaw === 'number') {
            limiteCreditoVal = Number(limiteRaw);
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (typeof limiteRaw === 'string') {
            // postgres decimals often come as strings
            limiteCreditoVal = Number(String(limiteRaw).replace(',', '.')) || 0;
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (typeof limiteRaw === 'object' && limiteRaw !== null) {
            const limitObj = limiteRaw as Record<string, unknown>;
            const v = limitObj['valor'] ?? limitObj['value'] ?? 0;
            limiteCreditoVal = typeof v === 'string' ? Number(String(v).replace(',', '.')) || 0 : Number(v || 0);
            moeda = String(limitObj['moeda'] ?? limitObj['currency'] ?? r['moeda'] ?? 'EUR');
        } else {
            limiteCreditoVal = 0;
            moeda = String(r['moeda'] ?? 'EUR');
        }

        // Handle saldoUtilizado - accept number, string, snake_case, or nested object
        let saldoUtilizadoVal: number;
        const saldoRaw = r['saldoUtilizado'] ?? r['saldo_utilizado'] ?? null;
        if (saldoRaw === null || saldoRaw === undefined) {
            saldoUtilizadoVal = 0;
        } else if (typeof saldoRaw === 'number') {
            saldoUtilizadoVal = Number(saldoRaw);
        } else if (typeof saldoRaw === 'string') {
            saldoUtilizadoVal = Number(String(saldoRaw).replace(',', '.')) || 0;
        } else if (typeof saldoRaw === 'object' && saldoRaw !== null) {
            const sObj = saldoRaw as Record<string, unknown>;
            const v = sObj['valor'] ?? sObj['value'] ?? 0;
            saldoUtilizadoVal = typeof v === 'string' ? Number(String(v).replace(',', '.')) || 0 : Number(v || 0);
        } else {
            saldoUtilizadoVal = 0;
        }

        const limiteCreditoResult = Dinheiro.create(limiteCreditoVal, moeda);
        const saldoUtilizadoResult = Dinheiro.create(saldoUtilizadoVal, moeda);

        // Handle periodo - can be object with inicio/fecho as IDataProps, or persistence date fields periodo_inicio/periodo_fecho
        let inicioData: Record<string, unknown> | null = null;
        let fechoData: Record<string, unknown> | null = null;

        const pInicio = r['periodo_inicio'] ?? r['periodoInicio'] ?? r['periodoInicio'] ?? null;
        const pFecho = r['periodo_fecho'] ?? r['periodoFecho'] ?? r['periodoFecho'] ?? null;
        if (pInicio) {
            const d = new Date(String(pInicio));
            if (!Number.isNaN(d.getTime())) inicioData = { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
        }
        if (pFecho) {
            const d = new Date(String(pFecho));
            if (!Number.isNaN(d.getTime())) fechoData = { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
        }

        // If missing, default to simple current date parts
        const now = new Date();
        inicioData = inicioData ?? { dia: now.getDate(), mes: now.getMonth() + 1, ano: now.getFullYear() };
        fechoData = fechoData ?? { dia: now.getDate(), mes: now.getMonth() + 1, ano: now.getFullYear() };

        // Create Data VOs
        // allow future dates for cartao periodo (fecho can be in the future)
        const inicioResult = Data.createFromParts(Number(inicioData['dia'] ?? inicioData['day'] ?? 1), Number(inicioData['mes'] ?? inicioData['month'] ?? 1), Number(inicioData['ano'] ?? inicioData['year'] ?? now.getFullYear()), true);
        const fechoResult = Data.createFromParts(Number(fechoData['dia'] ?? fechoData['day'] ?? 1), Number(fechoData['mes'] ?? fechoData['month'] ?? 1), Number(fechoData['ano'] ?? fechoData['year'] ?? now.getFullYear()), true);

        const periodoCombined = Result.combine([inicioResult, fechoResult]);
        if (periodoCombined.isFailure) return null;

        const periodoResult = Periodo.create(inicioResult.getValue(), fechoResult.getValue());

        const rawConta = r['conta_pagamento_id'] ?? r['contaPagamentoId'] ?? null;
        const contaPagamentoId = rawConta ? new UniqueEntityID(String(rawConta)) : undefined;

        const bancoId = r['bancoId'] ?? r['banco_id'];

        const combined = Result.combine([nomeResult, iconResult, limiteCreditoResult, saldoUtilizadoResult, periodoResult]);
        if (combined.isFailure) return null;

        const cartaoOrError = CartaoCredito.create({
            userId,
            nome: nomeResult.getValue(),
            icon: iconResult.getValue(),
            limiteCredito: limiteCreditoResult.getValue(),
            saldoUtilizado: saldoUtilizadoResult.getValue(),
            periodo: periodoResult.getValue(),
            contaPagamentoId,
            bancoId: bancoId ? String(bancoId) : undefined
        }, new UniqueEntityID(String(r['domainId'] ?? r['id'])));

        return cartaoOrError.isSuccess ? cartaoOrError.getValue() : null;
    }

    /**
     * Maps a CartaoCredito domain entity to a plain object suitable for persistence.
     * @param cartao The CartaoCredito domain entity to map
     */
    public static toPersistence(cartao: CartaoCredito): Record<string, unknown> {
        return {
            domainId: cartao.id.toString(),
            nome: cartao.nome.value,
            icon: cartao.icon.value,
            limiteCredito: cartao.limiteCredito.value,
            saldoUtilizado: cartao.saldoUtilizado.value,
            moeda: cartao.limiteCredito.moeda,
            periodo_fecho: new Date(cartao.periodo.fecho.year, cartao.periodo.fecho.month - 1, cartao.periodo.fecho.day),
            periodo_inicio: new Date(cartao.periodo.inicio.year, cartao.periodo.inicio.month - 1, cartao.periodo.inicio.day),
            user_domain_id: cartao.userId.toString(),
            conta_pagamento_id: cartao.contaPagamentoId ? cartao.contaPagamentoId.toString() : null,
            banco_id: cartao.bancoId
        };
    }

    /**
     * Maps a CartaoCredito domain entity to a DTO for API responses.
     * @param cartao The CartaoCredito domain entity to map
     */
    public static toDTO(cartao: CartaoCredito): ICartaoCreditoDTO {
        return {
            id: cartao.id.toString(),
            userId: cartao.userId.toString(),
            nome: cartao.nome.value,
            icon: cartao.icon.value,
            limiteCredito: {
                valor: cartao.limiteCredito.value,
                moeda: cartao.limiteCredito.moeda
            },
            saldoUtilizado: {
                valor: cartao.saldoUtilizado.value,
                moeda: cartao.saldoUtilizado.moeda
            },
            periodo: {
                inicio: {
                    dia: cartao.periodo.inicio.day,
                    mes: cartao.periodo.inicio.month,
                    ano: cartao.periodo.inicio.year
                },
                fecho: {
                    dia: cartao.periodo.fecho.day,
                    mes: cartao.periodo.fecho.month,
                    ano: cartao.periodo.fecho.year
                }
            },
            contaPagamentoId: cartao.contaPagamentoId ? cartao.contaPagamentoId.toString() : null,
            bancoId: cartao.bancoId
        } as ICartaoCreditoDTO;
    }
}
