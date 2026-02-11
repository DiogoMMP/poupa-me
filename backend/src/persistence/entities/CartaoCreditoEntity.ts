import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    OneToMany,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { TransacaoEntity } from './TransacaoEntity.js';
import { ContaEntity } from './ContaEntity.js';

@Entity({ name: 'cartao_credito' })
@Unique(['nome'])
export class CartaoCreditoEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'domain_id', type: 'varchar', length: 50, nullable: true })
    domainId!: string;

    @Column({ name: 'nome', type: 'varchar', length: 100 })
    nome!: string;

    @Column({ name: 'icon', type: 'varchar', length: 255 })
    icon!: string;

    @Column({ name: 'limite_credito', type: 'decimal', precision: 12, scale: 2 })
    limiteCredito!: number;

    @Column({ name: 'saldo_utilizado', type: 'decimal', precision: 12, scale: 2, default: 0 })
    saldoUtilizado!: number;

    @Column({ name: 'moeda', type: 'varchar', length: 3, default: 'EUR' })
    moeda!: string;

    @Column({ name: 'periodo_fecho', type: 'date', nullable: true })
    periodoFecho!: Date | null;

    @Column({ name: 'periodo_inicio', type: 'date', nullable: true })
    periodoInicio!: Date | null;

    @ManyToOne(() => ContaEntity, { eager: false })
    @JoinColumn({ name: 'conta_pagamento_id' })
    contaPagamento!: ContaEntity;

    @Column({ name: 'conta_pagamento_id', nullable: true })
    contaPagamentoId!: number | null;

    @OneToMany(() => TransacaoEntity, (t) => t.cartaoCredito)
    transacoes?: TransacaoEntity[];

    @Column({ name: 'user_domain_id', type: 'varchar', length: 50 })
    userDomainId!: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
