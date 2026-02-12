import { Service, Inject } from 'typedi';
import type IBancoService from './IServices/IBancoService.js';
import type IBancoRepo from '../repos/IRepos/IBancoRepo.js';
import type IContaRepo from '../repos/IRepos/IContaRepo.js';
import type ICartaoCreditoRepo from '../repos/IRepos/ICartaoCreditoRepo.js';
import { Result } from '../core/logic/Result.js';
import type { IBancoDTO, ICreateBancoDTO, IUpdateBancoDTO } from '../dto/IBancoDTO.js';
import type { IDashboardDTO, IBancoResumoDTO } from '../dto/IDashboardDTO.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Banco } from '../domain/Banco/Entities/Banco.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';
import { BancoMap } from '../mappers/BancoMap.js';

/**
 * Service handling Banco business logic
 */
@Service()
export default class BancoService implements IBancoService {

    constructor(
        @Inject('BancoRepo') private bancoRepo: IBancoRepo,
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('CartaoCreditoRepo') private cartaoRepo: ICartaoCreditoRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Creates a new Banco
     */
    public async createBanco(dto: ICreateBancoDTO, userId: string): Promise<Result<IBancoDTO>> {
        try {
            // Create value objects
            const nomeOrError = Nome.create(dto.nome);
            const iconOrError = Icon.create(dto.icon);

            if (nomeOrError.isFailure) {
                return Result.fail<IBancoDTO>(String(nomeOrError.error));
            }
            if (iconOrError.isFailure) {
                return Result.fail<IBancoDTO>(String(iconOrError.error));
            }

            // Create domain entity
            const bancoOrError = Banco.create({
                userId: new UniqueEntityID(userId),
                nome: nomeOrError.getValue(),
                icon: iconOrError.getValue()
            });

            if (bancoOrError.isFailure) {
                return Result.fail<IBancoDTO>(String(bancoOrError.error));
            }

            // Persist
            const banco = bancoOrError.getValue();
            const savedBanco = await this.bancoRepo.save(banco);

            // Return DTO
            return Result.ok<IBancoDTO>(BancoMap.toDTO(savedBanco));
        } catch (err) {
            this.logger.error('BancoService.createBanco error: %o', err);
            return Result.fail<IBancoDTO>('Failed to create banco');
        }
    }

    /**
     * Updates an existing Banco
     */
    public async updateBanco(bancoId: string, dto: IUpdateBancoDTO, userId: string): Promise<Result<IBancoDTO>> {
        try {
            // Load existing banco
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<IBancoDTO>('Banco not found');
            }

            // Authorization check
            if (banco.userId.toString() !== userId) {
                return Result.fail<IBancoDTO>('Unauthorized');
            }

            // Update properties
            const updates: Record<string, unknown> = {};

            if (dto.nome !== undefined) {
                const nomeOrError = Nome.create(dto.nome);
                if (nomeOrError.isFailure) {
                    return Result.fail<IBancoDTO>(String(nomeOrError.error));
                }
                updates.nome = nomeOrError.getValue();
            }

            if (dto.icon !== undefined) {
                const iconOrError = Icon.create(dto.icon);
                if (iconOrError.isFailure) {
                    return Result.fail<IBancoDTO>(String(iconOrError.error));
                }
                updates.icon = iconOrError.getValue();
            }

            // Create updated banco
            const updatedBancoOrError = Banco.create({
                userId: banco.userId,
                nome: (updates.nome as Nome) ?? banco.nome,
                icon: (updates.icon as Icon) ?? banco.icon
            }, banco.id);

            if (updatedBancoOrError.isFailure) {
                return Result.fail<IBancoDTO>(String(updatedBancoOrError.error));
            }

            // Persist
            const savedBanco = await this.bancoRepo.update(updatedBancoOrError.getValue());

            return Result.ok<IBancoDTO>(BancoMap.toDTO(savedBanco));
        } catch (err) {
            this.logger.error('BancoService.updateBanco error: %o', err);
            return Result.fail<IBancoDTO>('Failed to update banco');
        }
    }

    /**
     * Deletes a Banco
     */
    public async deleteBanco(bancoId: string, userId: string): Promise<Result<void>> {
        try {
            // Load banco for authorization
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<void>('Banco not found');
            }

            // Authorization check
            if (banco.userId.toString() !== userId) {
                return Result.fail<void>('Unauthorized');
            }

            await this.bancoRepo.delete(bancoId);
            return Result.ok<void>();
        } catch (err) {
            this.logger.error('BancoService.deleteBanco error: %o', err);
            return Result.fail<void>('Failed to delete banco');
        }
    }

    /**
     * Gets a Banco by ID
     */
    public async getBanco(bancoId: string, userId: string): Promise<Result<IBancoDTO>> {
        try {
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<IBancoDTO>('Banco not found');
            }

            // Authorization check
            if (banco.userId.toString() !== userId) {
                return Result.fail<IBancoDTO>('Unauthorized');
            }

            return Result.ok<IBancoDTO>(BancoMap.toDTO(banco));
        } catch (err) {
            this.logger.error('BancoService.getBanco error: %o', err);
            return Result.fail<IBancoDTO>('Failed to get banco');
        }
    }

    /**
     * Gets all Bancos for a user
     */
    public async getAllBancos(userId: string): Promise<Result<IBancoDTO[]>> {
        try {
            const bancos = await this.bancoRepo.findAll(userId);
            const dtos = bancos.map(banco => BancoMap.toDTO(banco));
            return Result.ok<IBancoDTO[]>(dtos);
        } catch (err) {
            this.logger.error('BancoService.getAllBancos error: %o', err);
            return Result.fail<IBancoDTO[]>('Failed to get bancos');
        }
    }

    /**
     * Gets the dashboard for a specific bank with its totals
     * Calculates saldoContas (real money) and saldoCartoes (mealheiro/provisions)
     */
    public async getDashboard(bancoId: string, userId: string): Promise<Result<IDashboardDTO>> {
        try {
            // 1. Load the specific banco and verify authorization
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<IDashboardDTO>('Banco not found');
            }

            // Authorization check
            if (banco.userId.toString() !== userId) {
                return Result.fail<IDashboardDTO>('Unauthorized');
            }

            // 2. Fetch contas and cartoes for this user in parallel (Performance boost)
            const [contas, cartoes] = await Promise.all([
                this.contaRepo.findAll(userId),
                this.cartaoRepo.findAll(userId)
            ]);

            // 3. Filter accounts belonging to this bank
            const contasDoBanco = contas.filter(c => c.bancoId === banco.id.toString());
            const totalContas = contasDoBanco.reduce((sum, c) => sum + c.saldo.value, 0);

            // 4. Filter cards belonging to this bank
            const cartoesDoBanco = cartoes.filter(c => c.bancoId === banco.id.toString());
            const totalCartoes = cartoesDoBanco.reduce((sum, c) => sum + c.saldoUtilizado.value, 0);

            // 5. Calculate Bank Total (Using "Mealheiro" logic: Assets + Provisions)
            const totalBanco = totalContas + totalCartoes;

            // 6. Build the banco resumo
            const resumoBanco: IBancoResumoDTO = {
                id: banco.id.toString(),
                nome: banco.nome.value,
                icon: banco.icon.value,
                saldoContas: totalContas,
                saldoCartoes: totalCartoes,
                totalBanco: totalBanco
            };

            // 7. Return the dashboard for this specific bank
            return Result.ok<IDashboardDTO>({
                saldoGlobal: totalBanco,
                detalhePorBanco: [resumoBanco]
            });

        } catch (err) {
            this.logger.error('BancoService.getDashboard error: %o', err);
            return Result.fail<IDashboardDTO>('Erro ao carregar dashboard');
        }
    }
}
