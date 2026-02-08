import type { User } from '../../domain/User/Entities/User.js';

export default interface IUserRepo {
  save(user: User): Promise<User>;
  updateByEmail(user: User, email: string): Promise<User>;
  deleteByEmail(email: string): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findByDomainId(domainId: string): Promise<User | null>;
  findAll(): Promise<User[]>;
}
