import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type { IUserDTO, IUserRegistrationDTO, IUserLoginDTO, IUserUpdateDTO } from '../dto/IUserDTO.js';
import type IUserService from './IServices/IUserService.js';
import type IUserRepo from '../repos/IRepos/IUserRepo.js';
import { User } from '../domain/User/Entities/User.js';
import { UserName } from '../domain/User/ValueObjects/UserName.js';
import { UserEmail } from '../domain/User/ValueObjects/UserEmail.js';
import { UserPassword } from '../domain/User/ValueObjects/UserPassword.js';
import { UserRole } from '../domain/User/ValueObjects/UserRole.js';
import { Result as CoreResult } from '../core/logic/Result.js';
import { UserMap } from '../mappers/UserMap.js';
import type * as jwt from 'jsonwebtoken';

@Service()
export default class AuthService implements IUserService {
    constructor(
        @Inject('UserRepo') private userRepo: IUserRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void }
    ) {}

    /**
     * Registers a new user. Validates input, hashes password via UserPassword value object,
     * creates the domain User and persists it.
     * @param registrationDTO - The user registration data transfer object containing name, email, password, and optional role.
     * @returns Result containing the created User DTO or an error message.
     */
    public async registerUser(registrationDTO: IUserRegistrationDTO): Promise<Result<IUserDTO>> {
        try {
            if (!registrationDTO) return Result.fail<IUserDTO>('No registration data provided');

            // Check if already exists
            const existing = await this.userRepo.findByEmail(registrationDTO.email);
            if (existing) return Result.fail<IUserDTO>('Email already in use');

            // Build value objects
            const nameResult = UserName.create(registrationDTO.name);
            const emailResult = UserEmail.create(registrationDTO.email);
            const roleResult = UserRole.create(registrationDTO.role || 'User');
            const passwordResult = await UserPassword.create(registrationDTO.password, false);

            // Combine validation
            const combine = CoreResult.combine([nameResult, emailResult, roleResult, passwordResult]);
            if (combine.isFailure) return Result.fail<IUserDTO>(combine.error || 'Invalid registration data');

            // Create domain user
            const userOrError = User.create(
                {
                    name: nameResult.getValue(),
                    email: emailResult.getValue(),
                    password: passwordResult.getValue(),
                    role: roleResult.getValue()
                }
            );

            if (userOrError.isFailure) return Result.fail<IUserDTO>(userOrError.errorValue() as any);
            const user = userOrError.getValue();

            const saved = await this.userRepo.save(user);
            const dto = UserMap.toDTO(saved);

            return Result.ok<IUserDTO>(dto as IUserDTO);
        } catch (e) {
            this.logger.error('AuthService.registerUser error: %o', e);
            const message = e instanceof Error ? e.message : 'Error registering user';
            return Result.fail<IUserDTO>(message);
        }
    }

    /**
     * Authenticates a user and returns a JWT token and user DTO on success.
     * Validates credentials, checks password, and generates a JWT token with user info.
     * @param loginDTO - The user login data transfer object containing email and password.
     * @returns Result containing an object with `token` and `user` DTO or an error message.
     */
    public async login(loginDTO: IUserLoginDTO): Promise<Result<{ token: string; user: IUserDTO }>> {
        try {
            if (!loginDTO) return Result.fail<{ token: string; user: IUserDTO }>('No login data provided');

            const user = await this.userRepo.findByEmail(loginDTO.email);
            if (!user) return Result.fail<{ token: string; user: IUserDTO }>('Invalid credentials');

            const passwordMatches = await user.password.comparePassword(loginDTO.password);
            if (!passwordMatches) return Result.fail<{ token: string; user: IUserDTO }>('Invalid credentials');

            // Dynamic import to be compatible with different jsonwebtoken package shapes at runtime
            const jwtModule: any = await import('jsonwebtoken');
            const signFn: Function | undefined = jwtModule.sign || jwtModule.default?.sign || jwtModule.default;
            if (typeof signFn !== 'function') {
                this.logger.error('AuthService.login error: jwt.sign is not available (unexpected jsonwebtoken export)');
                return Result.fail<{ token: string; user: IUserDTO }>('Authentication service configuration error');
            }

            const secret: jwt.Secret = (process.env.JWT_SECRET || 'changeme') as jwt.Secret;
            const payload: jwt.JwtPayload = { sub: user.id.toString(), email: user.email.value, role: user.role.value } as jwt.JwtPayload;
            const signOptions: jwt.SignOptions = { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions;

            const token = signFn(payload, secret, signOptions) as string;

            const dto = UserMap.toDTO(user) as IUserDTO;
            return Result.ok<{ token: string; user: IUserDTO }>({ token, user: dto });
        } catch (e) {
            this.logger.error('AuthService.login error: %o', e);
            const message = e instanceof Error ? e.message : 'Error during login';
            return Result.fail<{ token: string; user: IUserDTO }>(message);
        }
    }

    /**
     * Gets a user by its domain ID.
     * @param id - The user domain ID.
     * @returns Result containing the User DTO or an error message.
     */
    public async getUserByDomainId(id: string): Promise<Result<IUserDTO>> {
        try {
            if (!id) return Result.fail<IUserDTO>('ID is required');
            const user = await this.userRepo.findByDomainId(id);
            if (!user) return Result.fail<IUserDTO>(`User not found with id=${id}`);
            const dto = UserMap.toDTO(user) as IUserDTO;
            return Result.ok<IUserDTO>(dto);
        } catch (e) {
            this.logger.error('AuthService.getUserByDomainId error: %o', e);
            const message = e instanceof Error ? e.message : 'Error getting user by id';
            return Result.fail<IUserDTO>(message);
        }
    }

    /**
     * Gets users by email.
     * @param email - The user email.
     * @returns Result containing an array of User DTOs matching the email or an error message.
     */
    public async getUserByEmail(email: string): Promise<Result<IUserDTO[]>> {
        try {
            if (!email) return Result.fail<IUserDTO[]>('Email is required');
            const user = await this.userRepo.findByEmail(email);
            if (!user) return Result.ok<IUserDTO[]>([]);
            const dto = UserMap.toDTO(user) as IUserDTO;
            return Result.ok<IUserDTO[]>([dto]);
        } catch (e) {
            this.logger.error('AuthService.getUserByEmail error: %o', e);
            const message = e instanceof Error ? e.message : 'Error getting user by email';
            return Result.fail<IUserDTO[]>(message);
        }
    }

    /**
     * Gets all users.
     * @returns Result containing an array of all User DTOs or an error message.
     */
    public async getAllUsers(): Promise<Result<IUserDTO[]>> {
        try {
            const users = await this.userRepo.findAll();
            const dtos = users.map(u => UserMap.toDTO(u) as IUserDTO);
            return Result.ok<IUserDTO[]>(dtos);
        } catch (e) {
            this.logger.error('AuthService.getAllUsers error: %o', e);
            const message = e instanceof Error ? e.message : 'Error getting all users';
            return Result.fail<IUserDTO[]>(message);
        }
    }

    /**
     * Updates a user. The DTO must include the `email` which is used to find the user (email cannot be changed).
     * Validates input, merges updates into existing domain object, and persists changes.
     * @param updateDTO - The user update data transfer object containing updated fields (email required) and optional name/password.
     * @param emailKey - The email used to locate the user in the DB (cannot be changed through update).
     * @returns Result containing the updated User DTO or an error message.
     */
    public async updateUser(updateDTO: IUserUpdateDTO, emailKey: string): Promise<Result<IUserDTO>> {
        try {
            if (!updateDTO) return Result.fail<IUserDTO>('No update data provided');
            if (!emailKey) return Result.fail<IUserDTO>('Email is required to identify the user');

            const existing = await this.userRepo.findByEmail(emailKey);
            if (!existing) return Result.fail<IUserDTO>(`User not found with email=${emailKey}`);

            // Merge updates into domain object
            const name = updateDTO.name ? UserName.create(updateDTO.name) : CoreResult.ok(existing.name);
            // Email cannot be changed; use existing.email
            const email = CoreResult.ok(existing.email);
            const role = CoreResult.ok(existing.role);
            let password = CoreResult.ok(existing.password);
            if (updateDTO.password) {
                password = await UserPassword.create(updateDTO.password, false);
            }

            const combine = CoreResult.combine([name, email, role, password]);
            if (combine.isFailure) return Result.fail<IUserDTO>(combine.error || 'Invalid update data');

            const userOrError = User.create(
                {
                    name: name.getValue(),
                    email: email.getValue(),
                    password: password.getValue(),
                    role: role.getValue()
                },
                existing.id
            );

            if (userOrError.isFailure) return Result.fail<IUserDTO>(userOrError.errorValue() as any);

            const userDomain = userOrError.getValue();

            // Update by email to ensure we match the existing DB row (avoid duplicate key issues)
            const updated = await this.userRepo.updateByEmail(userDomain, emailKey);
            const dto = UserMap.toDTO(updated) as IUserDTO;
            return Result.ok<IUserDTO>(dto);
        } catch (e) {
            this.logger.error('AuthService.updateUser error: %o', e);
            const message = e instanceof Error ? e.message : 'Error updating user';
            return Result.fail<IUserDTO>(message);
        }
    }

    /**
     * Deletes a user by email.
     * @param email - Email of the user to delete
     */
    public async deleteUserByEmail(email: string): Promise<Result<boolean>> {
        try {
            if (!email) return Result.fail<boolean>('Email is required');
            const exists = await this.userRepo.findByEmail(email);
            if (!exists) return Result.fail<boolean>(`User not found with email=${email}`);
            await this.userRepo.deleteByEmail(email);
            return Result.ok<boolean>(true);
        } catch (e) {
            this.logger.error('AuthService.deleteUserByEmail error: %o', e);
            const message = e instanceof Error ? e.message : 'Error deleting user';
            return Result.fail<boolean>(message);
        }
    }
}
