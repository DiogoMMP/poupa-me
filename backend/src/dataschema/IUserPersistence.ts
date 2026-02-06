export interface IUserPersistence {
  id?: number;
  domainId?: string;
  email: string;
  name: string;
  passwordHash?: string;
  role?: string;
  isActive?: boolean;
  locale?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
