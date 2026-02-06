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

    /**
     * We are injecting the mongoose models into the DI container.
     * This is controversial but it will provide a lot of flexibility
     * at the time of writing unit tests.
     */
    for (const m of schemas) {
      // Use dynamic import instead of require for ES modules
      const schema = (await import(m.schema)).default;
      Container.set(m.name, schema);
    }

    for (const m of repos) {
      const repoClass = (await import(m.path)).default;
      const repoInstance = Container.get(repoClass);
      Container.set(m.name, repoInstance);
    }

    for (const m of services) {
      const serviceClass = (await import(m.path)).default;
      const serviceInstance = Container.get(serviceClass);
      Container.set(m.name, serviceInstance);
    }

    for (const m of controllers) {
      // load the @Service() class by its path
      const controllerClass = (await import(m.path)).default;
      // create/get the instance of the @Service() class
      const controllerInstance = Container.get(controllerClass);
      // rename the instance inside the container
      Container.set(m.name, controllerInstance);
    }

    return;
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
