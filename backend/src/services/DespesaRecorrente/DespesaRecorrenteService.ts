import { Service, Inject } from 'typedi';
import { Result } from '../../core/logic/Result.js';
import type IDespesaRecorrenteService from './IServices/IDespesaRecorrenteService.js';
import type IDespesaRecorrenteRepo from '../../repos/DespesaRecorrente/IRepos/IDespesaRecorrenteRepo.js';
import type IDespesaRecorrenteQueryRepo from '../../repos/DespesaRecorrente/IRepos/IDespesaRecorrenteQueryRepo.js';
import type { IDespesaRecorrenteDTO, ICreateDespesaRecorrenteDTO, IUpdateDespesaRecorrenteDTO } from '../../dto/IDespesaRecorrenteDTO.js';
import { DespesaRecorrenteMap } from '../../mappers/DespesaRecorrenteMap.js';
import { DespesaRecorrente } from '../../domain/DespesaRecorrente/Entities/DespesaRecorrente.js';
import { Nome } from '../../domain/Shared/ValueObjects/Nome.js';
import { Dinheiro } from '../../domain/Shared/ValueObjects/Dinheiro.js';
import { UniqueEntityID } from '../../core/domain/UniqueEntityID.js';
import { Tipo } from '../../domain/Shared/ValueObjects/Tipo.js';

/**
 * Service for Recurring Expenses CRUD operations
 */
@Service()
export default class DespesaRecorrenteService implements IDespesaRecorrenteService {
    constructor(
        @Inject('DespesaRecorrenteRepo') private despesaRepo: IDespesaRecorrenteRepo,
        @Inject('DespesaRecorrenteQueryRepo') private despesaQueryRepo: IDespesaRecorrenteQueryRepo,
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

            let valorDomain: Dinheiro | undefined;
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
            const despesas = await this.despesaQueryRepo.findAll(userId, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getAllDespesas error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching DespesaRecorrentes');
        }
    }

    public async getDespesasComValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const despesas = await this.despesaQueryRepo.findWithValor(userId, bancoId);
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

            const despesas = await this.despesaQueryRepo.findByTipo(userId, tipoResult.getValue().value, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getDespesasSemValorByTipo error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching recurring sem-valor expenses by tipo');
        }
    }

    public async getDespesasSemValor(userId: string, bancoId: string): Promise<Result<IDespesaRecorrenteDTO[]>> {
        try {
            const despesas = await this.despesaQueryRepo.findWithoutValor(userId, bancoId);
            return Result.ok<IDespesaRecorrenteDTO[]>(despesas.map(d => DespesaRecorrenteMap.toDTO(d)));
        } catch (err) {
            this.logger.error('DespesaRecorrenteService.getDespesasSemValor error: %o', err);
            return Result.fail<IDespesaRecorrenteDTO[]>('Error fetching recurring expenses without valor');
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

        if (tipoValue === 'Despesa Semanal' && hasDiaDaSemana && !hasValor) {
            return Result.fail<void>('valor is required when diaDaSemana is provided');
        }

        if ((tipoValue === 'Despesa Mensal' || tipoValue === 'Poupança') && hasDiaDoMes && !hasValor) {
            return Result.fail<void>('valor is required when diaDoMes is provided');
        }

        if (tipoValue === 'Despesa Anual') {
            const hasAgendamento = hasMes || hasDiaDoMes;
            if (hasAgendamento && !(hasMes && hasDiaDoMes)) {
                return Result.fail<void>('mes and diaDoMes must be provided together');
            }
            if (hasAgendamento && !hasValor) {
                return Result.fail<void>('valor is required when mes/diaDoMes are provided');
            }
        }

        return Result.ok<void>();
    }
}
