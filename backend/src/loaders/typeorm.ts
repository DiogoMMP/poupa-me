import 'reflect-metadata';
import {DataSource} from 'typeorm';
import config from '../config/index.js';
import {UserEntity} from '../persistence/entities/UserEntity.js';
import Logger from './logger.js';
import {CategoriaEntity} from "../persistence/entities/CategoriaEntity.js";
import {TransacaoEntity} from "../persistence/entities/TransacaoEntity.js";
import {ContaEntity} from "../persistence/entities/ContaEntity.js";
import {CartaoCreditoEntity} from "../persistence/entities/CartaoCreditoEntity.js";
import {BancoEntity} from "../persistence/entities/BancoEntity.js";
import {DespesaRecorrenteEntity} from "../persistence/entities/DespesaRecorrenteEntity.js";

export default async function createTypeOrmDataSource(): Promise<DataSource> {
    if (!config.postgresURL) {
        throw new Error('Postgres URL is not configured');
    }

    const dataSource = new DataSource({
        type: 'postgres',
        url: config.postgresURL,
        entities: [UserEntity, CategoriaEntity, TransacaoEntity, ContaEntity, CartaoCreditoEntity, BancoEntity, DespesaRecorrenteEntity],
        synchronize: true, // for dev only; change to migrations in prod
        logging: false
    });

    try {
        await dataSource.initialize();
        Logger.info('TypeORM DataSource has been initialized.');
        return dataSource;
    } catch (err) {
        Logger.error('Error during DataSource initialization: %o', err);
        throw err;
    }
}
