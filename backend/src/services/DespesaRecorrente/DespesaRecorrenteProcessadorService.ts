import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type IDespesaRecorrenteProcessadorService from './IServices/IDespesaRecorrenteProcessadorService.js';
import type IDespesaRecorrenteRepo from '../../repos/DespesaRecorrente/IRepos/IDespesaRecorrenteRepo.js';
import type IDespesaRecorrenteQueryRepo from '../../repos/DespesaRecorrente/IRepos/IDespesaRecorrenteQueryRepo.js';
import type ITransacaoDespesasRecorrentesService from '../Transacao/IServices/ITransacaoDespesasRecorrentesService.js';
import type { IGerarTransacaoSemValorDTO } from '../../dto/IDespesaRecorrenteDTO.js';
import type { ITransacaoDTO } from '../../dto/ITransacaoDTO.js';
import type { DespesaRecorrente } from '../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';

/**
 * Service for Recurring Expenses processing logic
 */
@Service()
export default class DespesaRecorrenteProcessadorService implements IDespesaRecorrenteProcessadorService {
    constructor(
        @Inject('DespesaRecorrenteRepo') private despesaRepo: IDespesaRecorrenteRepo,
        @Inject('DespesaRecorrenteQueryRepo') private despesaQueryRepo: IDespesaRecorrenteQueryRepo,
        @Inject('TransacaoDespesasRecorrentesService') private transacaoDespesasRecorrentesService: ITransacaoDespesasRecorrentesService,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Processes recurring expenses for a user
     * Called when user loads dashboard - checks if any monthly expenses need to be generated
     */
    public async processarRecorrencias(userId: string): Promise<Result<void>> {
        try {
            const hoje = new Date();
            const mesAtualIndex = hoje.getMonth(); // 0-11
            const mesAtual = mesAtualIndex + 1; // 1-12
            const anoAtual = hoje.getFullYear();
            const weekKeyHoje = this.getWeekKey(hoje);

            // Get all active rules for this user
            const regras = await this.despesaQueryRepo.findActiveByUserId(userId);

            for (const regra of regras) {
                const ultimo = regra.ultimoProcessamento;
                const tipoValue = regra.tipo.value;

                if (tipoValue === 'Despesa Mensal' || tipoValue === 'Poupança') {
                    const jaProcessadoEsteMes = !!(ultimo && ultimo.getMonth() === mesAtualIndex && ultimo.getFullYear() === anoAtual);
                    const diaDoPagamento = regra.diaDoMes;
                    if (diaDoPagamento === undefined) continue;
                    const chegouODia = hoje.getDate() >= diaDoPagamento;
                    if (!jaProcessadoEsteMes && chegouODia) {
                        await this.gerarTransacao(regra, hoje);
                    }
                    continue;
                }

                if (tipoValue === 'Despesa Semanal') {
                    const jaProcessadoEstaSemana = !!(ultimo && this.getWeekKey(ultimo) === weekKeyHoje);
                    const diaDaSemana = regra.diaDaSemana;
                    if (diaDaSemana === undefined) continue;
                    const hojeDiaSemana = this.getDiaDaSemana(hoje);
                    const chegouODia = hojeDiaSemana >= diaDaSemana;
                    if (!jaProcessadoEstaSemana && chegouODia) {
                        await this.gerarTransacao(regra, hoje);
                    }
                    continue;
                }

                if (tipoValue === 'Despesa Anual') {
                    const jaProcessadoEsteAno = !!(ultimo && ultimo.getFullYear() === anoAtual);
                    if (regra.mes === undefined || regra.diaDoMes === undefined) continue;
                    const jaPassouODia = (mesAtual > regra.mes) || (mesAtual === regra.mes && hoje.getDate() >= regra.diaDoMes);
                    if (!jaProcessadoEsteAno && jaPassouODia) {
                        await this.gerarTransacao(regra, hoje);
                    }
                }
            }

            return Result.ok<void>();
        } catch (err) {
            this.logger.error('DespesaRecorrenteProcessadorService.processarRecorrencias error: %o', err);
            return Result.fail<void>('Error processing recurring expenses');
        }
    }

    /**
     * Manually generates a single pending transaction for a sem-valor rule.
     * The rule is NOT updated — valor/diaDoMes come from the request, not the rule.
     */
    public async gerarTransacaoSemValor(
        despesaId: string,
        dto: IGerarTransacaoSemValorDTO,
        userId: string,
        userRole?: string
    ): Promise<Result<ITransacaoDTO>> {
        try {
            const regra = await this.despesaRepo.findById(despesaId);
            if (!regra) return Result.fail<ITransacaoDTO>('Despesa not found');
            if (userRole !== 'Admin' && regra.userId.toString() !== userId) return Result.fail<ITransacaoDTO>('Unauthorized');

            // Validate that the rule is not fully scheduled
            const tipo = regra.tipo.value;
            const hasValor = regra.valor !== undefined && regra.valor !== null;
            const hasDiaDoMes = regra.diaDoMes !== undefined && regra.diaDoMes !== null;
            const hasDiaDaSemana = regra.diaDaSemana !== undefined && regra.diaDaSemana !== null;
            const hasMes = regra.mes !== undefined && regra.mes !== null;

            const isFullyScheduled =
                (tipo === 'Despesa Semanal' && hasValor && hasDiaDaSemana) ||
                ((tipo === 'Despesa Mensal' || tipo === 'Poupança') && hasValor && hasDiaDoMes) ||
                (tipo === 'Despesa Anual' && hasValor && hasDiaDoMes && hasMes);

            if (isFullyScheduled) {
                return Result.fail<ITransacaoDTO>('Esta despesa já está totalmente agendada. Use o processamento automático.');
            }

            const transacaoInput = {
                data: {
                    dia: dto.data.dia,
                    mes: dto.data.mes,
                    ano: dto.data.ano
                },
                descricao: regra.nome.value,
                valor: {
                    valor: dto.valor.valor,
                    moeda: dto.valor.moeda
                },
                categoriaId: regra.categoriaId.toString(),
                contaId: regra.contaOrigemId.toString(),
                userId: regra.userId.toString(),
                imediata: regra.imediata
            };

            if (!regra.contaDestinoId && !regra.imediata) {
                return Result.fail<ITransacaoDTO>('A regra de despesa recorrente não tem uma conta de destino e não é uma transação imediata.');
            }

            let result: Result<ITransacaoDTO>;

            switch (tipo) {
                case 'Poupança':
                    if (!regra.contaPoupancaId) {
                        return Result.fail<ITransacaoDTO>('Regra de Poupança sem contaPoupancaId definida');
                    }
                    result = await this.transacaoDespesasRecorrentesService.createPoupanca(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {}),
                            contaPoupancaId: regra.contaPoupancaId.toString()
                        },
                        regra.imediata
                    );
                    break;
                case 'Despesa Mensal':
                    result = await this.transacaoDespesasRecorrentesService.createDespesaMensal(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                        },
                        regra.imediata
                    );
                    break;
                case 'Despesa Semanal':
                    result = await this.transacaoDespesasRecorrentesService.createDespesaSemanal(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                        },
                        regra.imediata
                    );
                    break;
                case 'Despesa Anual':
                    result = await this.transacaoDespesasRecorrentesService.createDespesaAnual(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                        },
                        regra.imediata
                    );
                    break;
                default:
                    this.logger.error(`Tipo de despesa recorrente desconhecido: ${tipo}`);
                    return Result.fail<ITransacaoDTO>('Tipo de despesa recorrente desconhecido.');
            }

            return result;
        } catch (err) {
            this.logger.error('DespesaRecorrenteProcessadorService.gerarTransacaoSemValor error: %o', err);
            return Result.fail<ITransacaoDTO>('Erro ao gerar transação');
        }
    }

    private async gerarTransacao(regra: DespesaRecorrente, hoje: Date): Promise<void> {
        try {
            if (!regra.valor) {
                this.logger.error('DespesaRecorrenteProcessadorService.gerarTransacao: rule without valor defined, skipping');
                return;
            }
            const baseDTO = {
                data: {
                    dia: hoje.getDate(),
                    mes: hoje.getMonth() + 1,
                    ano: hoje.getFullYear()
                },
                descricao: `${regra.nome.value}`,
                valor: {
                    valor: regra.valor.value,
                    moeda: regra.valor.moeda
                },
                categoriaId: regra.categoriaId.toString(),
                contaId: regra.contaOrigemId.toString(),
                userId: regra.userId.toString(),
                imediata: regra.imediata
            };
            
            if (!regra.contaDestinoId && !regra.imediata) {
                this.logger.error('DespesaRecorrenteProcessadorService.gerarTransacao: rule without contaDestino');
                return;
            }

            let result;
            if (regra.tipo.value === 'Poupança') {
                if (!regra.contaPoupancaId) {
                    this.logger.error('DespesaRecorrenteProcessadorService.gerarTransacao: Poupança rule missing contaPoupancaId');
                    return;
                }
                result = await this.transacaoDespesasRecorrentesService.createPoupanca({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {}),
                    contaPoupancaId: regra.contaPoupancaId.toString()
                }, regra.imediata);
            } else if (regra.tipo.value === 'Despesa Mensal') {
                result = await this.transacaoDespesasRecorrentesService.createDespesaMensal({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                }, regra.imediata);
            } else if (regra.tipo.value === 'Despesa Semanal') {
                result = await this.transacaoDespesasRecorrentesService.createDespesaSemanal({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                }, regra.imediata);
            } else {
                result = await this.transacaoDespesasRecorrentesService.createDespesaAnual({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                }, regra.imediata);
            }

            if (result.isFailure) {
                this.logger.error('DespesaRecorrenteProcessadorService.gerarTransacao: failed: %s', result.error);
                return;
            }

            // Mark the rule as processed today
            regra.marcarComoProcessada(new Date());
            await this.despesaRepo.update(regra);
        } catch (err) {
            this.logger.error('DespesaRecorrenteProcessadorService.gerarTransacao error: %o', err);
        }
    }

    private getDiaDaSemana(data: Date): number {
        const jsDay = data.getDay();
        return jsDay === 0 ? 7 : jsDay;
    }

    private getWeekKey(data: Date): string {
        const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-${weekNo}`;
    }
}
