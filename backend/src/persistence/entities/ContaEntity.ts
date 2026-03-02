import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, OneToMany, ManyToOne, JoinColumn} from 'typeorm';
import {TransacaoEntity} from "./TransacaoEntity.js";
import {BancoEntity} from "./BancoEntity.js";

@Entity({name: 'conta'})
@Unique(['nome', 'bancoId'])
export class ContaEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'domain_id', type: 'varchar', length: 50, nullable: true })
    domainId!: string;

    @Column({name: 'nome', type: 'varchar', length: 50})
    nome!: string;

    @Column({name: 'icon', type: 'varchar', length: 255})
    icon!: string;

    @Column({ name: 'saldo', type: 'decimal', precision: 12, scale: 2 })
    saldo!: number;

    @Column({ name: 'moeda', type: 'varchar', length: 3, default: 'EUR' })
    moeda!: string;

    @Column({ name: 'user_domain_id', type: 'varchar', length: 50 })
    userDomainId!: string;

    @Column({ name: 'banco_id', type: 'varchar', length: 50, nullable: true })
    bancoId?: string | null;

    @ManyToOne(() => BancoEntity, (banco) => banco.contas, { nullable: true })
    @JoinColumn({ name: 'banco_id', referencedColumnName: 'domainId' })
    banco?: BancoEntity;

    @OneToMany(() => TransacaoEntity, (t) => t.conta)
    transacoes?: TransacaoEntity[];

    @Column({name: 'is_active', type: 'boolean', default: true})
    isActive!: boolean;

    @Column({name: 'locale', type: 'varchar', length: 10, nullable: true})
    locale?: string;

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt!: Date;
}
