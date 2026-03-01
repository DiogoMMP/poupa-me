import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { ContaEntity } from './ContaEntity.js';
import type { CartaoCreditoEntity } from './CartaoCreditoEntity.js';

/**
 * TypeORM entity representing a Banco in the database.
 * Groups Contas and CartaoCredito by financial institution.
 */
@Entity('banco')
export class BancoEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'domain_id', type: 'varchar', unique: true })
    domainId!: string;

    @Column({ type: 'varchar', length: 255 })
    nome!: string;

    @Column({ type: 'varchar', length: 255 })
    icon!: string;

    @Column({ name: 'user_domain_id', type: 'varchar' })
    userDomainId!: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'varchar', nullable: true })
    locale!: string | null;

    @Column({ name: 'contas_cartoes_selecionados', type: 'json', nullable: true })
    contasCartoesSelecionados!: string[] | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToMany('ContaEntity', 'banco')
    contas?: ContaEntity[];

    @OneToMany('CartaoCreditoEntity', 'banco')
    cartoesCredito?: CartaoCreditoEntity[];
}

