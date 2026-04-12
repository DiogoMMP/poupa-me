import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type ITransacaoRepo from '../repos/IRepos/ITransacaoRepo.js';
import type { IEstatisticasDTO, ICategoriaEstatistica, IHistoricoDiario } from '../dto/IEstatisticasDTO.js';
import type { IDataProps } from '../dto/ITransacaoDTO.js';
import { CategoriaMap } from '../mappers/CategoriaMap.js';
import type { Categoria } from '../domain/Categoria/Entities/Categoria.js';
import IEstatisticasService from "./IServices/IEstatisticasService.js";

/**
 * Service responsible for building statistics payloads.
 */
@Service()
export default class EstatisticasService implements IEstatisticasService {
    constructor(
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Builds statistics for a specific banco and month/year.
     * If userRole !== 'Admin', results are scoped to the provided userId.
     */
    public async getEstatisticas(bancoId: string, month: number, year: number, userId: string, userRole?: string): Promise<Result<IEstatisticasDTO>> {
        try {
            const filterUserId = userRole === 'Admin' ? undefined : userId;

            // Fetch all conta (Entrada/Saída) and cartao (Crédito/Reembolso) transactions for this banco/user
            const [contaTransacoes, cartaoTransacoes] = await Promise.all([
                this.transacaoRepo.findAllContaTransactions(filterUserId, bancoId),
                this.transacaoRepo.findAllCartaoTransactions(filterUserId, bancoId)
            ]);

            // Build date range. If the requested month/year is the current month/year,
            // interpret "este mês" as a rolling 1-month window: from today minus one month (same day)
            // up to now. Example: today 12/04 => window 12/03 - 12/04.
            const today = new Date();
            let startDate: Date;
            let endDate: Date;
            if (month === (today.getMonth() + 1) && year === today.getFullYear()) {
                // rolling last-month window
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
            } else {
                // full calendar month
                startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
                endDate = new Date(year, month, 0, 23, 59, 59, 999);
            }

            const toDateFromData = (dataObj: any) => new Date(dataObj.year ?? dataObj.ano ?? 0, (dataObj.month ?? dataObj.mes ?? 1) - 1, dataObj.day ?? dataObj.dia ?? 1);

            // Keep only transactions within requested date range
            const contasNoMes = contaTransacoes.filter(t => {
                const dt = toDateFromData((t as any).data);
                return dt >= startDate && dt <= endDate;
            });
            const cartoesNoMes = cartaoTransacoes.filter(t => {
                const dt = toDateFromData((t as any).data);
                return dt >= startDate && dt <= endDate;
            });

            // 1) Monthly cashflow: totalIn = Entrada + Reembolso, totalOut = Saída + Crédito
            const sumValor = (arr: Array<{ tipo: { value: string }; valor: { value: number; moeda?: string } }>, tipos: string[]) =>
                arr.filter(t => tipos.includes(t.tipo.value)).reduce((s, t) => s + (Number((t.valor as any).value) || 0), 0);

            const totalIn = sumValor(contasNoMes, ['Entrada']) + sumValor(cartoesNoMes, ['Reembolso']);
            const totalOut = sumValor(contasNoMes, ['Saída']) + sumValor(cartoesNoMes, ['Crédito']);
            const netBalance = totalIn - totalOut;

            // 2) Aggregation by category (only expenses: Saída and Crédito)
            const categoriaMap = new Map<string, { categoria: ICategoriaEstatistica['categoria']; total: number; moeda: string }>();

            const accumulateCategoria = (t: unknown) => {
                const tr = t as { categoria?: { id: { toString(): string } }; valor?: { value?: number; moeda?: string } };
                if (!tr.categoria) return;
                const catId = tr.categoria.id.toString();
                const valor = Number(tr.valor?.value ?? 0) || 0;
                const moeda = String(tr.valor?.moeda ?? 'EUR');
                const existing = categoriaMap.get(catId);
                if (existing) {
                    existing.total += valor;
                } else {
                    // map categoria domain to DTO where possible
                    const catDto = CategoriaMap.toDTO((tr.categoria as unknown) as Categoria);
                    categoriaMap.set(catId, { categoria: catDto, total: valor, moeda });
                }
            };

            // Only expense types
            const despesasConta = contasNoMes.filter(t => ['Saída'].includes(t.tipo.value));
            const despesasCartao = cartoesNoMes.filter(t => ['Crédito'].includes(t.tipo.value));

            despesasConta.forEach(accumulateCategoria);
            despesasCartao.forEach(accumulateCategoria);

            const categorias: ICategoriaEstatistica[] = Array.from(categoriaMap.values()).map(v => ({
                categoria: v.categoria,
                total: { valor: v.total, moeda: v.moeda }
            }));

            // 3) Daily history (expenses only) - group by date
            const dailyMap = new Map<string, { data: IDataProps; total: number; moeda: string }>();
            const accumulateDaily = (t: unknown) => {
                const tr = t as { valor?: { value?: number; moeda?: string }; data?: { day?: number; month?: number; year?: number } };
                const valor = Number(tr.valor?.value ?? 0) || 0;
                const moeda = String(tr.valor?.moeda ?? 'EUR');
                const d = tr.data ?? { day: 0, month: 0, year: 0 };
                const key = `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
                const existing = dailyMap.get(key);
                if (existing) {
                    existing.total += valor;
                } else {
                    dailyMap.set(key, { data: { dia: d.day ?? 0, mes: d.month ?? 0, ano: d.year ?? 0 }, total: valor, moeda });
                }
            };

            despesasConta.forEach(accumulateDaily);
            despesasCartao.forEach(accumulateDaily);

            const historicoDiario: IHistoricoDiario[] = Array.from(dailyMap.values())
                .sort((a, b) => {
                    const ta = new Date(a.data.ano, a.data.mes - 1, a.data.dia).getTime();
                    const tb = new Date(b.data.ano, b.data.mes - 1, b.data.dia).getTime();
                    return ta - tb;
                })
                .map(d => ({ data: d.data, total: { valor: d.total, moeda: d.moeda } }));

            const dto: IEstatisticasDTO = {
                cashflowMensal: {
                    totalIn: totalIn,
                    totalOut: totalOut,
                    netBalance: netBalance
                },
                categorias,
                historicoDiario
            };

            return Result.ok<IEstatisticasDTO>(dto);
        } catch (err) {
            this.logger.error('EstatisticasService.getEstatisticas error: %o', err);
            return Result.fail<IEstatisticasDTO>('Erro ao calcular estatísticas');
        }
    }
}
