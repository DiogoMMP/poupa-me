import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from '../config/index.js';
import { UserEntity } from '../persistence/entities/UserEntity.js';
import Logger from './logger.js';
import {CategoriaEntity} from "../persistence/entities/CategoriaEntity.js";

export default async function createTypeOrmDataSource(): Promise<DataSource> {
  if (!config.postgresURL) {
    throw new Error('Postgres URL is not configured');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: config.postgresURL,
    entities: [UserEntity, CategoriaEntity],
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
