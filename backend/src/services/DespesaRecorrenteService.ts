import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type IDespesaRecorrenteService from './IServices/IDespesaRecorrenteService.js';
import type IDespesaRecorrenteRepo from '../repos/IRepos/IDespesaRecorrenteRepo.js';
import type ITransacaoService from './IServices/ITransacaoService.js';
import type { IDespesaRecorrenteDTO, ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO } from '../dto/IDespesaRecorrenteDTO.js';
import { DespesaRecorrenteMap } from '../mappers/DespesaRecorrenteMap.js';
import { DespesaRecorrente } from '../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';

/**
 * Service for DespesaRecorrente - handles automatic monthly expense generation
 */
@Service()
export default class DespesaRecorrenteService implements IDespesaRecorrenteService {
    constructor(
        @Inject('DespesaRecorrenteRepo') private despesaRepo: IDespesaRecorrenteRepo,
        @Inject('TransacaoService') private transacaoService: ITransacaoService,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    public async createDespesa(dto: ICreateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>> {
        try {
            const nomeOrError = Nome.create(dto.nome);
            const valorOrError = Dinheiro.create(Number(dto.valor?.valor ?? 0), String(dto.valor?.moeda ?? 'EUR'));

            if (nomeOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(nomeOrError.error));
            if (valorOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(valorOrError.error));

            const props = {
                userId: new UniqueEntityID(userId),
                nome: nomeOrError.getValue(),
                valor: valorOrError.getValue(),
                diaDoMes: dto.diaDoMes,
                categoriaId: new UniqueEntityID(dto.categoriaId),
                contaOrigemId: new UniqueEntityID(dto.contaOrigemId),
                contaDestinoId: new UniqueEntityID(dto.contaDestinoId),
                ultimoProcessamento: null,
                ativo: dto.ativo ?? true
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

    public async updateDespesa(despesaId: string, dto: IUpdateDespesaRecorrenteDTO, userId: string): Promise<Result<IDespesaRecorrenteDTO>> {
        try {
            const existing = await this.despesaRepo.findById(despesaId);
            if (!existing) return Result.fail<IDespesaRecorrenteDTO>('Despesa not found');

            // Authorization
            if (existing.userId.toString() !== userId) return Result.fail<IDespesaRecorrenteDTO>('Unauthorized');

            const nomeOrError = dto.nome ? Nome.create(dto.nome) : Result.ok<Nome>(existing.nome);
            const valorOrError = dto.valor
                ? Dinheiro.create(Number(dto.valor.valor), String(dto.valor.moeda))
                : Result.ok<Dinheiro>(existing.valor);

            if (nomeOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(nomeOrError.error));
            if (valorOrError.isFailure) return Result.fail<IDespesaRecorrenteDTO>(String(valorOrError.error));

            const props = {
                userId: existing.userId,
                nome: nomeOrError.getValue(),
                valor: valorOrError.getValue(),
                diaDoMes: dto.diaDoMes ?? existing.diaDoMes,
                categoriaId: dto.categoriaId ? new UniqueEntityID(dto.categoriaId) : existing.categoriaId,
                contaOrigemId: dto.contaOrigemId ? new UniqueEntityID(dto.contaOrigemId) : existing.contaOrigemId,
                contaDestinoId: dto.contaDestinoId ? new UniqueEntityID(dto.contaDestinoId) : existing.contaDestinoId,
                ultimoProcessamento: existing.ultimoProcessamento,
                ativo: dto.ativo !== undefined ? dto.ativo : existing.ativo
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

    public async getAllDespesas(userId: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const despesas = await this.despesaRepo.findAll(userId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getAllDespesas error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching DespesaRecorrentes');
        }
    }

    /**
     * THE MAGIC: Processes recurring expenses for a user
     * Called when user loads dashboard - checks if any monthly expenses need to be generated
     */
    public async processarRecorrencias(userId: string): Promise<Result<void>> {
        try {
            const hoje = new Date();
            const mesAtual = hoje.getMonth(); // 0-11
            const anoAtual = hoje.getFullYear();

            // 1. Get all active rules for this user
            const regras = await this.despesaRepo.findActiveByUserId(userId);

            for (const regra of regras) {
                // Check if already processed this month
                const ultimo = regra.ultimoProcessamento;

                let jaProcessadoEsteMes = false;
                if (ultimo) {
                    if (ultimo.getMonth() === mesAtual && ultimo.getFullYear() === anoAtual) {
                        jaProcessadoEsteMes = true;
                    }
                }

                // Check if today is equal or past the scheduled day
                const diaDoPagamento = regra.diaDoMes;
                const chegouODia = hoje.getDate() >= diaDoPagamento;

                // IF not processed yet AND the day has arrived: GENERATE!
                if (!jaProcessadoEsteMes && chegouODia) {
                    await this.gerarTransacao(regra, mesAtual, anoAtual, hoje);
                }
            }

            return Result.ok<void>();
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.processarRecorrencias error: %o', err);
            return Result.fail<void>('Erro ao processar recorrências');
        }
    }

    /**
     * Private helper to create Despesa Mensal transaction and update the rule
     * Calls TransacaoService.createDespesaMensal() to handle the transaction creation
     */
    private async gerarTransacao(regra: DespesaRecorrente, _mes: number, _ano: number, hoje: Date): Promise<void> {
        try {
            // Prepare DTO for createDespesaMensal
            const despesaMensalDTO = {
                data: {
                    dia: hoje.getDate(),
                    mes: hoje.getMonth() + 1,
                    ano: hoje.getFullYear()
                },
                descricao: `Mensalidade: ${regra.nome.value}`,
                valor: {
                    valor: regra.valor.value,
                    moeda: regra.valor.moeda
                },
                categoriaId: regra.categoriaId.toString(),
                contaId: regra.contaOrigemId.toString(),           // Origem (saldo real)
                contaDestinoId: regra.contaDestinoId.toString(),   // Destino (despesas mensais)
                userId: regra.userId.toString()
            };

            // Call the existing TransacaoService method to create Despesa Mensal
            const result = await this.transacaoService.createDespesaMensal(despesaMensalDTO);

            if (result.isFailure) {
                this.logger.error('DespesaRecorrenteService.gerarTransacao: TransacaoService.createDespesaMensal failed: %s', result.error);
                return;
            }

            // Mark the rule as processed today
            regra.marcarComoProcessada(new Date());
            await this.despesaRepo.update(regra);

        } catch (err) {
            this.logger.error('DespesaRecorrenteService.gerarTransacao error: %o', err);
        }
    }
}



