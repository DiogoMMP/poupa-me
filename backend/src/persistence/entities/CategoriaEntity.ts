import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique} from 'typeorm';

@Entity({name: 'categoria'})
@Unique(['nome'])
export class CategoriaEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'domain_id', type: 'varchar', length: 50, nullable: true })
    domainId?: string;

    @Column({name: 'nome', type: 'varchar', length: 50})
    nome!: string;

    @Column({name: 'icon', type: 'varchar', length: 255})
    icon!: string;

    @Column({name: 'is_active', type: 'boolean', default: true})
    isActive!: boolean;

    @Column({name: 'locale', type: 'varchar', length: 10, nullable: true})
    locale?: string;

    @CreateDateColumn({name: 'created_at'})
    createdAt!: Date;

    @UpdateDateColumn({name: 'updated_at'})
    updatedAt!: Date;
}
