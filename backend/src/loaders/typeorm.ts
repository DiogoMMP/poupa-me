import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import config from '../config/index.js';
import {UserEntity} from '../persistence/entities/UserEntity.js';
import Logger from './logger.js';
import {CategoriaEntity} from "../persistence/entities/CategoriaEntity.js";
import {TransacaoEntity} from "../persistence/entities/TransacaoEntity.js";
import {ContaEntity} from "../persistence/entities/ContaEntity.js";
import {CartaoCreditoEntity} from "../persistence/entities/CartaoCreditoEntity.js";
import {BancoEntity} from "../persistence/entities/BancoEntity.js";
import {DespesaRecorrenteEntity} from "../persistence/entities/DespesaRecorrenteEntity.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default async function createTypeOrmDataSource(): Promise<DataSource> {
    if (!config.postgresURL) {
        throw new Error('Postgres URL is not configured');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isCloudDB = config.postgresURL.includes('aivencloud.com');

    const dataSource = new DataSource({
        type: 'postgres',
        url: config.postgresURL,
        entities: [
            UserEntity,
            CategoriaEntity,
            TransacaoEntity,
            ContaEntity,
            CartaoCreditoEntity,
            BancoEntity,
            DespesaRecorrenteEntity
        ],
        synchronize: !isProduction,
        // Migrations only run in production: dev/test keep relying on `synchronize` above, and
        // running both against the same schema change would make the migration fail trying to
        // (re)create something synchronize already created.
        migrations: isProduction ? [path.join(currentDir, '../persistence/migrations/*.js')] : [],
        migrationsRun: isProduction,
        logging: false,

        ssl: isProduction || isCloudDB ? { rejectUnauthorized: false } : false,

        extra: (isProduction || isCloudDB) ? {
            ssl: {
                rejectUnauthorized: false
            }
        } : {}
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
