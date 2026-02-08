import {Result} from "../../core/logic/Result.js";
import type {IUserDTO, IUserRegistrationDTO, IUserLoginDTO, IUserUpdateDTO} from "../../dto/IUserDTO.js";

/**
 * Service interface for User operations.
 * CRUD operations for User entity:
 * - Register User
 * - Login
 * - Get User by Domain ID
 * - Get Users by Email
 * - Get all Users
 * - Update User
 * - Delete User by ID
 */
export default interface IUserService {

    /**
     * Registers and saves a User.
     * @param registrationDTO - The User registration data transfer object.
     * @returns Result containing the created User DTO with the assigned ID.
     */
    registerUser(registrationDTO: IUserRegistrationDTO): Promise<Result<IUserDTO>>;

    /**
     * Authenticates a user and returns an authentication token and user info.
     * @param loginDTO - The User login credentials.
     * @returns Result containing an object with `token` and `user`.
     */
    login(loginDTO: IUserLoginDTO): Promise<Result<{ token: string; user: IUserDTO }>>;

    /**
     * Gets a User by domain ID.
     * @param id - The User domain ID.
     * @returns Result containing the User DTO or an error.
     */
    getUserByDomainId(id: string): Promise<Result<IUserDTO>>;

    /**
     * Gets Users by email.
     * @param email - The User email.
     * @returns Result containing an array of User DTOs matching the email (usually one).
     */
    getUserByEmail(email: string): Promise<Result<IUserDTO[]>>;

    /**
     * Gets all Users.
     * @returns Result containing an array of all User DTOs.
     */
    getAllUsers(): Promise<Result<IUserDTO[]>>;

    /**
     * Updates an existing User.
     * @param updateDTO - The User update data transfer object with updated data.
     * @param email - The email used to locate the user in the DB (cannot be changed through update).
     * @returns Result containing the updated User DTO.
     */
    updateUser(updateDTO: IUserUpdateDTO, email: string): Promise<Result<IUserDTO>>;

    /**
     * Deletes a User by email.
     * @param email - The User email.
     * @returns Result indicating success (true) or failure.
     */
    deleteUserByEmail(email: string): Promise<Result<boolean>>;
}