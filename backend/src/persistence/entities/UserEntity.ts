import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity({ name: 'user' })
@Unique(['email'])
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'domain_id', type: 'varchar', length: 50 })
  domainId!: string;

  @Column({ name: 'email', type: 'varchar', length: 320 })
  email!: string;

  @Column({ name: 'name', type: 'varchar', length: 50 })
  name!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 200 })
  passwordHash?: string;

  @Column({ name: 'role', type: 'varchar', length: 50, default: 'Guest' })
  role!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'locale', type: 'varchar', length: 10, nullable: true })
  locale?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
