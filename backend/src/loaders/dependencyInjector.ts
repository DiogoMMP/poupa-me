import { Container } from 'typedi';
import LoggerInstance from './logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async ({ dbConnection, dataSource, schemas, controllers, repos, services}: {
                    dbConnection?: any;
                    dataSource?: any;
                    schemas: { name: string; schema: any }[],
                    controllers: {name: string; path: string }[],
                    repos: {name: string; path: string }[],
                    services: {name: string; path: string }[] }) => {
  try {
    Container.set('logger', LoggerInstance);

    // Register dbConnection (postgres pool) if present
    if (dbConnection) {
      Container.set('dbConnection', dbConnection);
    }

    // Register TypeORM DataSource if present
    if (dataSource) {
      Container.set('dataSource', dataSource);
    }

    // 1. Registar os Schemas
    for (const m of schemas) {
      const schema = (await import(m.schema)).default;
      Container.set(m.name, schema);
    }

    // 2. Registar os Repositories
    for (const m of repos) {
      const repoClass = (await import(m.path)).default;
      Container.set(m.name, Container.get(repoClass));
    }

    // 3. Registar os Services
    for (const m of services) {
      const serviceClass = (await import(m.path)).default;
      Container.set(m.name, Container.get(serviceClass));
    }

    // 4. Registar os Controllers
    for (const m of controllers) {
      const controllerClass = (await import(m.path)).default;
      Container.set(m.name, Container.get(controllerClass));
    }


    return;
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
