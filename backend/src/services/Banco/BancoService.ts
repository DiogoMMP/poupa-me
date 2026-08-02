import { Service, Inject } from 'typedi';
import type IBancoService from './IBancoService.js';
import type IBancoRepo from '../../repos/Banco/IBancoRepo.js';
import type IContaRepo from '../../repos/Conta/IContaRepo.js';
import type ICartaoCreditoRepo from '../../repos/CartaoCredito/ICartaoCreditoRepo.js';
import type IUserRepo from '../../repos/User/IUserRepo.js';
import { Result } from '../../core/logic/Result.js';
import type { IBancoDTO, IBancoSummaryDTO, ICreateBancoDTO, IUpdateBancoDTO } from '../../dto/IBancoDTO.js';
import type { IDashboardDTO, IBancoResumoDTO } from '../../dto/IDashboardDTO.js';
import { Nome } from '../../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../../domain/Shared/ValueObjects/Icon.js';
import { Banco } from '../../domain/Banco/Entities/Banco.js';
import { UniqueEntityID } from '../../core/domain/UniqueEntityID.js';
import { BancoMap } from '../../mappers/BancoMap.js';

/**
 * Service handling Banco business logic
 */
@Service()
export default class BancoService implements IBancoService {

    constructor(
        @Inject('BancoRepo') private bancoRepo: IBancoRepo,
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('CartaoCreditoRepo') private cartaoRepo: ICartaoCreditoRepo,
        @Inject('UserRepo') private userRepo: IUserRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    private async getUserNome(userId: string): Promise<string | undefined> {
        try {
            const user = await this.userRepo.findByDomainId(userId);
            return user?.name.value;
        } catch {
            return undefined;
        }
    }

    private async getContasCartoesMap(userId?: string): Promise<Map<string, { nome: string; icon: string }>> {
        const [contas, cartoes] = await Promise.all([
            this.contaRepo.findAll(userId),
            this.cartaoRepo.findAll(userId)
        ]);
        const map = new Map<string, { nome: string; icon: string }>();
        for (const c of contas) {
            map.set(c.id.toString(), { nome: c.nome.value, icon: c.icon.value });
        }
        for (const cart of cartoes) {
            map.set(cart.id.toString(), { nome: cart.nome.value, icon: cart.icon.value });
        }
        return map;
    }

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
            const map = await this.getContasCartoesMap(userId);
            const userNome = await this.getUserNome(userId);
            return Result.ok<IBancoDTO>(BancoMap.toDTO(savedBanco, map, userNome));
        } catch (err) {
            this.logger.error('BancoService.createBanco error: %o', err);
            return Result.fail<IBancoDTO>('Failed to create banco');
        }
    }

    /**
     * Updates an existing Banco
     */
    public async updateBanco(bancoId: string, dto: IUpdateBancoDTO, userId: string, userRole?: string): Promise<Result<IBancoDTO>> {
        try {
            // Load existing banco
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<IBancoDTO>('Banco not found');
            }

            // Authorization check (Admin can update any banco)
            if (userRole !== 'Admin' && banco.userId.toString() !== userId) {
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
                icon: (updates.icon as Icon) ?? banco.icon,
                contasCartoesSelecionados: dto.contasCartoesSelecionados !== undefined
                    ? dto.contasCartoesSelecionados
                    : banco.contasCartoesSelecionados
            }, banco.id);

            if (updatedBancoOrError.isFailure) {
                return Result.fail<IBancoDTO>(String(updatedBancoOrError.error));
            }

            const updatedBanco = updatedBancoOrError.getValue();

            // Persist
            const savedBanco = await this.bancoRepo.update(updatedBanco);

            const map = await this.getContasCartoesMap(banco.userId.toString());
            const userNome = await this.getUserNome(banco.userId.toString());
            return Result.ok<IBancoDTO>(BancoMap.toDTO(savedBanco, map, userNome));
        } catch (err) {
            this.logger.error('BancoService.updateBanco error: %o', err);
            return Result.fail<IBancoDTO>('Failed to update banco');
        }
    }

    /**
     * Deletes a Banco
     */
    public async deleteBanco(bancoId: string, userId: string, userRole?: string): Promise<Result<void>> {
        try {
            // Load banco for authorization
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<void>('Banco not found');
            }

            // Authorization check (Admin can delete any banco)
            if (userRole !== 'Admin' && banco.userId.toString() !== userId) {
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
    public async getBanco(bancoId: string, userId: string, userRole?: string): Promise<Result<IBancoDTO>> {
        try {
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<IBancoDTO>('Banco not found');
            }

            // Authorization check (Admin can access any banco)
            if (userRole !== 'Admin' && banco.userId.toString() !== userId) {
                return Result.fail<IBancoDTO>('Unauthorized');
            }

            const map = await this.getContasCartoesMap(banco.userId.toString());
            const userNome = await this.getUserNome(banco.userId.toString());
            return Result.ok<IBancoDTO>(BancoMap.toDTO(banco, map, userNome));
        } catch (err) {
            this.logger.error('BancoService.getBanco error: %o', err);
            return Result.fail<IBancoDTO>('Failed to get banco');
        }
    }

    /**
     * Gets all Bancos for a user (or all if Admin)
     */
    public async getAllBancos(userId: string, userRole?: string): Promise<Result<IBancoSummaryDTO[]>> {
        try {
            // Admin can see all bancos
            const filterUserId = userRole === 'Admin' ? undefined : userId;
            const bancos = await this.bancoRepo.findAll(filterUserId);
            // Build a user name cache
            const userNameCache = new Map<string, string | undefined>();
            const dtos = await Promise.all(bancos.map(async b => {
                const uid = b.userId.toString();
                if (!userNameCache.has(uid)) {
                    userNameCache.set(uid, await this.getUserNome(uid));
                }
                return BancoMap.toSummaryDTO(b, userNameCache.get(uid));
            }));
            return Result.ok<IBancoSummaryDTO[]>(dtos);
        } catch (err) {
            this.logger.error('BancoService.getAllBancos error: %o', err);
            return Result.fail<IBancoSummaryDTO[]>('Failed to get bancos');
        }
    }

    /**
     * Gets the dashboard for a specific bank with its totals
     * Calculates saldoContas (real money) and saldoCartoes (mealheiro/provisions)
     */
    public async getDashboard(bancoId: string, userId: string, userRole?: string): Promise<Result<IDashboardDTO>> {
        try {
            // 1. Load the specific banco and verify authorization
            const banco = await this.bancoRepo.findById(bancoId);
            if (!banco) {
                return Result.fail<IDashboardDTO>('Banco not found');
            }

            // Authorization check (Admin can access any banco's dashboard)
            if (userRole !== 'Admin' && banco.userId.toString() !== userId) {
                return Result.fail<IDashboardDTO>('Unauthorized');
            }

            // 2. Fetch contas and cartoes (Admin sees all, regular user sees only their own)
            const filterUserId = userRole === 'Admin' ? undefined : userId;
            const [contas, cartoes] = await Promise.all([
                this.contaRepo.findAll(filterUserId),
                this.cartaoRepo.findAll(filterUserId)
            ]);

            // 3. Filter accounts belonging to this bank
            let contasDoBanco = contas.filter(c => c.bancoId === banco.id.toString());

            // If banco has selected contas/cartoes, filter only those
            if (banco.contasCartoesSelecionados && banco.contasCartoesSelecionados.length > 0) {
                contasDoBanco = contasDoBanco.filter(c =>
                    banco.contasCartoesSelecionados!.includes(c.id.toString())
                );
            }

            const totalContas = contasDoBanco.reduce((sum, c) => sum + c.saldo.value, 0);

            // 4. Filter cards belonging to this bank
            let cartoesDoBanco = cartoes.filter(c => c.bancoId === banco.id.toString());

            // If banco has selected contas/cartoes, filter only those
            if (banco.contasCartoesSelecionados && banco.contasCartoesSelecionados.length > 0) {
                cartoesDoBanco = cartoesDoBanco.filter(c =>
                    banco.contasCartoesSelecionados!.includes(c.id.toString())
                );
            }

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
