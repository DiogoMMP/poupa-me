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

@Entity({ name: 'despesa_recorrente' })
export class DespesaRecorrenteEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'domain_id', type: 'varchar', length: 50 })
    domainId!: string;

    @Column({ name: 'nome', type: 'varchar', length: 100 })
    nome!: string;

    @Column({ name: 'icon', type: 'varchar', length: 255 })
    icon!: string;

    @Column({ name: 'valor', type: 'decimal', precision: 12, scale: 2, nullable: true })
    valor!: number | null;

    @Column({ name: 'moeda', type: 'varchar', length: 3, default: 'EUR', nullable: true })
    moeda!: string | null;

    @Column({ name: 'dia_do_mes', type: 'integer', nullable: true })
    diaDoMes!: number | null;

    @ManyToOne(() => CategoriaEntity)
    @JoinColumn({ name: 'categoria_id' })
    categoria?: CategoriaEntity;

    @Column({ name: 'categoria_id' })
    categoriaId!: number;

    @ManyToOne(() => ContaEntity)
    @JoinColumn({ name: 'conta_origem_id' })
    contaOrigem?: ContaEntity;

    @Column({ name: 'conta_origem_id' })
    contaOrigemId!: number;

    @ManyToOne(() => ContaEntity)
    @JoinColumn({ name: 'conta_destino_id' })
    contaDestino?: ContaEntity;

    @Column({ name: 'conta_destino_id' })
    contaDestinoId!: number;

    @ManyToOne(() => ContaEntity, { nullable: true })
    @JoinColumn({ name: 'conta_poupanca_id' })
    contaPoupanca?: ContaEntity;

    @Column({ name: 'conta_poupanca_id', type: 'int', nullable: true })
    contaPoupancaId?: number;

    @Column({ name: 'tipo', type: 'varchar', length: 20, default: 'Despesa Mensal' })
    tipo!: string;

    @Column({ name: 'ultimo_processamento', type: 'date', nullable: true })
    ultimoProcessamento!: Date | null;

    @Column({ name: 'ativo', type: 'boolean', default: true })
    ativo!: boolean;

    @Column({ name: 'user_domain_id', type: 'varchar', length: 50 })
    userDomainId!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}

