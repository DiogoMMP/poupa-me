import { Mapper } from '../core/infra/Mapper.js';
import { DespesaRecorrente } from '../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import type { IDespesaRecorrenteDTO } from '../dto/IDespesaRecorrenteDTO.js';

/**
 * Mapper for DespesaRecorrente: persistence <-> domain <-> DTO
 */
export class DespesaRecorrenteMap extends Mapper<DespesaRecorrente> {
    public static async toDomain(raw: unknown): Promise<DespesaRecorrente | null> {
        if (!raw) return null;
        const r = raw as Record<string, unknown>;

        const userId = new UniqueEntityID(String(r['user_domain_id'] ?? r['userId'] ?? ''));
        const nomeResult = Nome.create(String(r['nome'] ?? ''));
        if (nomeResult.isFailure) return null;

        // Handle valor e moeda
        let valorNum: number;
        let moeda: string;
        const valorRaw = r['valor'];
        if (typeof valorRaw === 'number') {
            valorNum = valorRaw;
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (typeof valorRaw === 'string') {
            valorNum = Number(String(valorRaw).replace(',', '.')) || 0;
            moeda = String(r['moeda'] ?? 'EUR');
        } else if (typeof valorRaw === 'object' && valorRaw !== null) {
            const vObj = valorRaw as Record<string, unknown>;
            const v = vObj['valor'] ?? vObj['value'] ?? 0;
            valorNum = typeof v === 'string' ? Number(String(v).replace(',', '.')) || 0 : Number(v || 0);
            moeda = String(vObj['moeda'] ?? vObj['currency'] ?? r['moeda'] ?? 'EUR');
        } else {
            valorNum = 0;
            moeda = String(r['moeda'] ?? 'EUR');
        }

        const valorResult = Dinheiro.create(valorNum, moeda);
        if (valorResult.isFailure) return null;

        const diaDoMes = Number(r['diaDoMes'] ?? r['dia_do_mes'] ?? 1);

        // Extract domain IDs from relations if available, otherwise use raw IDs
        let categoriaIdStr = '';
        if (r['categoria'] && typeof r['categoria'] === 'object') {
            const catObj = r['categoria'] as Record<string, unknown>;
            categoriaIdStr = String(catObj['domainId'] ?? catObj['domain_id'] ?? '');
        }
        if (!categoriaIdStr) {
            categoriaIdStr = String(r['categoriaId'] ?? r['categoria_id'] ?? '');
        }
        const categoriaId = new UniqueEntityID(categoriaIdStr);

        let contaOrigemIdStr = '';
        if (r['contaOrigem'] && typeof r['contaOrigem'] === 'object') {
            const coObj = r['contaOrigem'] as Record<string, unknown>;
            contaOrigemIdStr = String(coObj['domainId'] ?? coObj['domain_id'] ?? '');
        }
        if (!contaOrigemIdStr) {
            contaOrigemIdStr = String(r['contaOrigemId'] ?? r['conta_origem_id'] ?? '');
        }
        const contaOrigemId = new UniqueEntityID(contaOrigemIdStr);

        let contaDestinoIdStr = '';
        if (r['contaDestino'] && typeof r['contaDestino'] === 'object') {
            const cdObj = r['contaDestino'] as Record<string, unknown>;
            contaDestinoIdStr = String(cdObj['domainId'] ?? cdObj['domain_id'] ?? '');
        }
        if (!contaDestinoIdStr) {
            contaDestinoIdStr = String(r['contaDestinoId'] ?? r['conta_destino_id'] ?? '');
        }
        const contaDestinoId = new UniqueEntityID(contaDestinoIdStr);

        const ultimoProcessamento = r['ultimoProcessamento'] ?? r['ultimo_processamento'] ?? null;
        const ultimoDate = ultimoProcessamento ? new Date(String(ultimoProcessamento)) : null;

        const ativo = r['ativo'] !== undefined ? Boolean(r['ativo']) : true;

        const despesaOrError = DespesaRecorrente.create({
            userId,
            nome: nomeResult.getValue(),
            valor: valorResult.getValue(),
            diaDoMes,
            categoriaId,
            contaOrigemId,
            contaDestinoId,
            ultimoProcessamento: ultimoDate,
            ativo
        }, new UniqueEntityID(String(r['domainId'] ?? r['id'])));

        return despesaOrError.isSuccess ? despesaOrError.getValue() : null;
    }

    public static toPersistence(despesa: DespesaRecorrente): Record<string, unknown> {
        return {
            domainId: despesa.id.toString(),
            nome: despesa.nome.value,
            valor: despesa.valor.value,
            moeda: despesa.valor.moeda,
            dia_do_mes: despesa.diaDoMes,
            categoria_id: despesa.categoriaId.toString(),
            conta_origem_id: despesa.contaOrigemId.toString(),
            conta_destino_id: despesa.contaDestinoId.toString(),
            ultimo_processamento: despesa.ultimoProcessamento,
            ativo: despesa.ativo,
            user_domain_id: despesa.userId.toString()
        };
    }

    public static toDTO(despesa: DespesaRecorrente): IDespesaRecorrenteDTO {
        return {
            id: despesa.id.toString(),
            userId: despesa.userId.toString(),
            nome: despesa.nome.value,
            valor: {
                valor: despesa.valor.value,
                moeda: despesa.valor.moeda
            },
            diaDoMes: despesa.diaDoMes,
            categoriaId: despesa.categoriaId.toString(),
            contaOrigemId: despesa.contaOrigemId.toString(),
            contaDestinoId: despesa.contaDestinoId.toString(),
            ultimoProcessamento: despesa.ultimoProcessamento,
            ativo: despesa.ativo
        };
    }
}

