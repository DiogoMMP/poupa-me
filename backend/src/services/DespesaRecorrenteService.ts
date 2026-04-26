import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type IDespesaRecorrenteService from './IServices/IDespesaRecorrenteService.js';
import type IDespesaRecorrenteRepo from '../repos/IRepos/IDespesaRecorrenteRepo.js';
import type ITransacaoService from './IServices/ITransacaoService.js';
import type { IDespesaRecorrenteDTO, ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO, IGerarTransacaoSemValorDTO } from '../dto/IDespesaRecorrenteDTO.js';
import type { ITransacaoDTO } from '../dto/ITransacaoDTO.js';
import { DespesaRecorrenteMap } from '../mappers/DespesaRecorrenteMap.js';
import { DespesaRecorrente } from '../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { Tipo } from '../domain/Shared/ValueObjects/Tipo.js';

/**
 * Service for Recurring Expenses - handles automatic monthly expense generation
 */
@Service()
export default class DespesaRecorrenteService implements IDespesaRecorrenteService {
    constructor(
        @Inject('DespesaRecorrenteRepo') private despesaRepo: IDespesaRecorrenteRepo,
        @Inject('TransacaoService') private transacaoService: ITransacaoService,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Create a new recurring expense
     */
    public async createDespesa(dto: ICreateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>> {
        try {
            const nomeOrError = Nome.create(dto.nome);
            if (nomeOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(nomeOrError.error));

            const tipoResult = Tipo.create(dto.tipo ?? 'Despesa Mensal');
            if (tipoResult.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(tipoResult.error));
            const tipoValue = tipoResult.getValue().value;

            const hasValor = dto.valor !== undefined && dto.valor !== null;
            const validationResult = this.validateAgendamento(
                tipoValue,
                hasValor,
                dto.diaDoMes,
                dto.diaDaSemana,
                dto.mes
            );
            if (validationResult.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(validationResult.error));

            let valorDomain: import('../domain/Shared/ValueObjects/Dinheiro.js').Dinheiro | undefined;
            if (hasValor) {
                const valorOrError = Dinheiro.create(Number(dto.valor!.valor ?? 0), String(dto.valor!.moeda ?? 'EUR'));
                if (valorOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(valorOrError.error));
                valorDomain = valorOrError.getValue();
            }

            const props = {
                userId: new UniqueEntityID(userId),
                nome: nomeOrError.getValue(),
                icon: dto.icon,
                valor: valorDomain,
                diaDoMes: dto.diaDoMes,
                categoriaId: new UniqueEntityID(dto.categoriaId),
                contaOrigemId: new UniqueEntityID(dto.contaOrigemId),
                ...(dto.contaDestinoId ? { contaDestinoId: new UniqueEntityID(dto.contaDestinoId) } : {}),
                ...(dto.contaPoupancaId ? { contaPoupancaId: new UniqueEntityID(dto.contaPoupancaId) } : {}),
                tipo: tipoResult.getValue(),
                ultimoProcessamento: null,
                ativo: dto.ativo ?? true,
                imediata: dto.imediata ?? false,
                diaDaSemana: dto.diaDaSemana,
                mes: dto.mes
            };

            const despesaOrError = DespesaRecorrente.create(props);
            if (despesaOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(despesaOrError.error));

            const saved = await this.despesaRepo.save(despesaOrError.getValue());
            return Result.ok<IDespesaRecorrenteDTO>(DespesaRecorrenteMap.toDTO(saved));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.createDespesa error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO>('Error creating DespesaRecorrente');
        }
    }

    /**
     * Update an existing recurring expense
     */
    public async updateDespesa(despesaId: string, dto: IUpdateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>> {
        try {
            const existing = await this.despesaRepo.findById(despesaId);
            if (!existing) return Result.fail<IDespesaRecorrenteDTO>('Despesa not found');

            if (existing.userId.toString() !== userId) return Result.fail<IDespesaRecorrenteDTO>('Unauthorized');

            const nomeOrError = dto.nome ? Nome.create(dto.nome) : Result.ok<Nome>(existing.nome);
            if (nomeOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(nomeOrError.error));

            const tipoResult = dto.tipo ? Tipo.create(dto.tipo) : Result.ok<Tipo>(existing.tipo);
            if (tipoResult.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(tipoResult.error));
            const tipoValue = tipoResult.getValue().value;

            let valorDomain: Dinheiro | undefined;
            if (dto.valor !== undefined && dto.valor !== null) {
                const valorOrError = Dinheiro.create(Number(dto.valor!.valor), String(dto.valor!.moeda ?? 'EUR'));
                if (valorOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(valorOrError.error));
                valorDomain = valorOrError.getValue();
            } else {
                valorDomain = existing.valor;
            }

            const diaDoMes = dto.diaDoMes !== undefined ? dto.diaDoMes : existing.diaDoMes;
            const diaDaSemana = dto.diaDaSemana !== undefined ? dto.diaDaSemana : existing.diaDaSemana;
            const mes = dto.mes !== undefined ? dto.mes : existing.mes;

            const hasValor = valorDomain !== undefined && valorDomain !== null;
            const validationResult = this.validateAgendamento(tipoValue, hasValor, diaDoMes, diaDaSemana, mes);
            if (validationResult.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(validationResult.error));

            const contaDestinoId = dto.contaDestinoId ? new UniqueEntityID(dto.contaDestinoId) : existing.contaDestinoId;
            const contaPoupancaId = dto.contaPoupancaId ? new UniqueEntityID(dto.contaPoupancaId) : existing.contaPoupancaId;

            const props = {
                userId: existing.userId,
                nome: nomeOrError.getValue(),
                icon: dto.icon ?? existing.icon,
                valor: valorDomain,
                diaDoMes,
                categoriaId: dto.categoriaId ? new UniqueEntityID(dto.categoriaId) : existing.categoriaId,
                contaOrigemId: dto.contaOrigemId ? new UniqueEntityID(dto.contaOrigemId) : existing.contaOrigemId,
                ...(contaDestinoId ? { contaDestinoId } : {}),
                ...(contaPoupancaId ? { contaPoupancaId } : {}),
                tipo: tipoResult.getValue(),
                ultimoProcessamento: existing.ultimoProcessamento,
                ativo: dto.ativo !== undefined ? dto.ativo : existing.ativo,
                imediata: dto.imediata !== undefined ? dto.imediata : existing.imediata,
                diaDaSemana,
                mes
            };

            const updatedOrError = DespesaRecorrente.create(props, existing.id);
            if (updatedOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(updatedOrError.error));

            const saved = await this.despesaRepo.update(updatedOrError.getValue());
            return Result.ok<IDespesaRecorrenteDTO>(DespesaRecorrenteMap.toDTO(saved));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.updateDespesa error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO>('Error updating DespesaRecorrente');
        }
    }

    /**
     * Delete a recurring expense
     */
    public async deleteDespesa(despesaId: string, userId: string): Promise<Result<void>> {
        try {
            const existing = await this.despesaRepo.findById(despesaId);
            if (!existing) return Result.fail<void>('Despesa not found');

            // Authorization
            if (existing.userId.toString() !== userId) return Result.fail<void>('Unauthorized');

            await this.despesaRepo.delete(despesaId);
            return Result.ok<void>();
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.deleteDespesa error: %o', err);
            return Result.fail<void>('Error deleting DespesaRecorrente');
        }
    }

    /**
     * Get a recurring expense by domain ID
     */
    public async getDespesa(despesaId: string, userId: string): Promise<Result<IDespesaRecorrenteDTO>> {
        try {
            const despesa = await this.despesaRepo.findById(despesaId);
            if (!despesa) return Result.fail<IDespesaRecorrenteDTO>('Despesa not found');

            // Authorization
            if (despesa.userId.toString() !== userId) return Result.fail<IDespesaRecorrenteDTO>('Unauthorized');

            return Result.ok<IDespesaRecorrenteDTO>(DespesaRecorrenteMap.toDTO(despesa));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getDespesa error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO>('Error fetching DespesaRecorrente');
        }
    }

    public async getAllDespesas(userId: string, bancoId?: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const despesas = await this.despesaRepo.findAll(userId, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getAllDespesas error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching DespesaRecorrentes');
        }
    }

    public async getDespesasComValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const despesas = await this.despesaRepo.findWithValor(userId, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getDespesasComValor error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching recurring expenses with valor');
        }
    }

    public async getDespesasSemValorByTipo(userId: string, tipo: string, bancoId?: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const tipoResult = Tipo.create(tipo);
            if (tipoResult.isFailure) {
                return Result.fail<IDespesaRecorrenteDTO[]>(String(tipoResult.error));
            }

            const despesas = await this.despesaRepo.findByTipo(userId, tipoResult.getValue().value, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getDespesasSemValorByTipo error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching recurring sem-valor expenses by tipo');
        }
    }

    public async getDespesasSemValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const despesas = await this.despesaRepo.findWithoutValor(userId, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getDespesasSemValor error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching recurring expenses without valor');
        }
    }

    /**
     * THE MAGIC: Processes recurring expenses for a user
     * Called when user loads dashboard - checks if any monthly expenses need to be generated
     */
    public async processarRecorrencias(userId: string): Promise<Result<void>> {
        try {
            const hoje = new Date();
            const mesAtualIndex = hoje.getMonth(); // 0-11
            const mesAtual = mesAtualIndex + 1; // 1-12
            const anoAtual = hoje.getFullYear();
            const weekKeyHoje = this.getWeekKey(hoje);

            // 1. Get all active rules for this user
            const regras = await this.despesaRepo.findActiveByUserId(userId);

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
            this.logger.error('DespesaRecorrenteService.processarRecorrencias error: %o', err);
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
        userId: string
    ): Promise<Result<ITransacaoDTO>> {
        try {
            const regra = await this.despesaRepo.findById(despesaId);
            if (!regra) return Result.fail<ITransacaoDTO>('Despesa not found');
            if (regra.userId.toString() !== userId) return Result.fail<ITransacaoDTO>('Unauthorized');

            // Validate that the rule is indeed sem-valor
            if (regra.valor !== undefined) {
                return Result.fail<ITransacaoDTO>('Esta despesa já tem valor configurado. Use o processamento automático.');
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
            const tipo = regra.tipo.value;

            switch (tipo) {
                case 'Poupança':
                    if (!regra.contaPoupancaId) {
                        return Result.fail<ITransacaoDTO>('Regra de Poupança sem contaPoupancaId definida');
                    }
                    result = await this.transacaoService.createPoupanca(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {}),
                            contaPoupancaId: regra.contaPoupancaId.toString()
                        },
                        regra.imediata
                    );
                    break;
                case 'Despesa Mensal':
                    result = await this.transacaoService.createDespesaMensal(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                        },
                        regra.imediata
                    );
                    break;
                case 'Despesa Semanal':
                    result = await this.transacaoService.createDespesaSemanal(
                        {
                            ...transacaoInput,
                            ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                        },
                        regra.imediata
                    );
                    break;
                case 'Despesa Anual':
                    result = await this.transacaoService.createDespesaAnual(
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
            this.logger.error('DespesaRecorrenteService.gerarTransacaoSemValor error: %o', err);
            return Result.fail<ITransacaoDTO>('Erro ao gerar transação');
        }
    }

    /**
     * Private helper to create Despesa Mensal transaction and update the rule
     * Calls TransacaoService.createDespesaMensal() to handle the transaction creation
     */
    private async gerarTransacao(regra: DespesaRecorrente, hoje: Date): Promise<void> {
        try {
            if (!regra.valor) {
                this.logger.error('DespesaRecorrenteService.gerarTransacao: rule without valor defined, skipping');
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
            
            if(!regra.contaDestinoId && !regra.imediata){
                this.logger.error('DespesaRecorrenteService.gerarTransacao: rule without contaDestino');
                return;
            }

            let result;
            if (regra.tipo.value === 'Poupança') {
                if (!regra.contaPoupancaId) {
                    this.logger.error('DespesaRecorrenteService.gerarTransacao: Poupança rule missing contaPoupancaId');
                    return;
                }
                result = await this.transacaoService.createPoupanca({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {}),
                    contaPoupancaId: regra.contaPoupancaId.toString()
                }, regra.imediata);
            } else if (regra.tipo.value === 'Despesa Mensal') {
                result = await this.transacaoService.createDespesaMensal({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                }, regra.imediata);
            } else if (regra.tipo.value === 'Despesa Semanal') {
                result = await this.transacaoService.createDespesaSemanal({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                    }, regra.imediata);
            } else {
                result = await this.transacaoService.createDespesaAnual({
                    ...baseDTO,
                    ...(regra.contaDestinoId ? { contaDestinoId: regra.contaDestinoId.toString() } : {})
                }, regra.imediata);
            }

            if (result.isFailure) {
                this.logger.error('DespesaRecorrenteService.gerarTransacao: failed: %s', result.error);
                return;
            }

            // Mark the rule as processed today
            regra.marcarComoProcessada(new Date());
            await this.despesaRepo.update(regra);

        } catch (err) {
            this.logger.error('DespesaRecorrenteService.gerarTransacao error: %o', err);
        }
    }

    private validateAgendamento(
        tipoValue: string,
        hasValor: boolean,
        diaDoMes?: number | null,
        diaDaSemana?: number | null,
        mes?: number | null
    ): Result<void> {
        const hasDiaDoMes = diaDoMes !== undefined && diaDoMes !== null;
        const hasDiaDaSemana = diaDaSemana !== undefined && diaDaSemana !== null;
        const hasMes = mes !== undefined && mes !== null;

        if (tipoValue === 'Despesa Semanal' && hasValor !== hasDiaDaSemana) {
            return Result.fail<void>('valor and diaDaSemana must be provided together or neither');
        }

        if ((tipoValue === 'Despesa Mensal' || tipoValue === 'Poupança') && hasValor !== hasDiaDoMes) {
            return Result.fail<void>('valor and diaDoMes must be provided together or neither');
        }

        if (tipoValue === 'Despesa Anual' && (hasValor || hasMes || hasDiaDoMes) && !(hasValor && hasMes && hasDiaDoMes)) {
            return Result.fail<void>('valor, diaDoMes and mes must be provided together or neither');
        }

        return Result.ok<void>();
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
