import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { CategoriaEntity } from './CategoriaEntity.js';
import { ContaEntity } from './ContaEntity.js';
import { CartaoCreditoEntity } from './CartaoCreditoEntity.js';

@Entity({ name: 'transacao' })
export class TransacaoEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'domain_id', type: 'varchar', length: 50, unique: true })
    domainId!: string;

    @Column({ name: 'descricao', type: 'varchar', length: 500 })
    descricao!: string;

    @Column({ name: 'dia', type: 'int' })
    dia!: number;

    @Column({ name: 'mes', type: 'int' })
    mes!: number;

    @Column({ name: 'ano', type: 'int' })
    ano!: number;

    @Column({ name: 'valor', type: 'decimal', precision: 12, scale: 2 })
    valor!: number;

    @Column({ name: 'moeda', type: 'varchar', length: 3, default: 'EUR' })
    moeda!: string;

    @Column({ name: 'tipo', type: 'varchar', length: 30 })
    tipo!: string;

    @Column({ name: 'status', type: 'varchar', length: 30 })
    status!: string;

    @ManyToOne(() => CategoriaEntity, { eager: false })
    @JoinColumn({ name: 'categoria_id' })
    categoria!: CategoriaEntity;

    @Column({ name: 'categoria_id' })
    categoriaId!: number;

    @ManyToOne(() => ContaEntity, { eager: false })
    @JoinColumn({ name: 'conta_id' })
    conta?: ContaEntity;

    @Column({ name: 'conta_id', type: 'int', nullable: true })
    contaId?: number;

    @ManyToOne(() => ContaEntity, { eager: false })
    @JoinColumn({ name: 'conta_destino_id' })
    contaDestino?: ContaEntity;

    @Column({ name: 'conta_destino_id', type: 'int', nullable: true })
    contaDestinoId?: number;

    @ManyToOne(() => CartaoCreditoEntity, { eager: false })
    @JoinColumn({ name: 'cartao_credito_id' })
    cartaoCredito?: CartaoCreditoEntity;

    @Column({ name: 'cartao_credito_id', type: 'int', nullable: true })
    cartaoCreditoId?: number;

    @Column({ name: 'user_domain_id', type: 'varchar', length: 50 })
    userDomainId!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}