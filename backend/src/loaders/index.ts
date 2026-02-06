import expressLoader from './express.js';
import dependencyInjectorLoader from './dependencyInjector.js';
import createTypeOrmDataSource from './typeorm.js';
import Logger from './logger.js';
import type {Application} from 'express';

import config from '../config/index.js';

export default async ({expressApp}: { expressApp: Application }) => {
    Logger.info('✌️ Postgres DB loaded and connected!');

    const dataSource = await createTypeOrmDataSource();

    const authController = {
        name: config.controllers.auth.name,
        path: config.controllers.auth.path
    };

    const userRepo = {
        name: config.repos.user.name,
        path: config.repos.user.path
    };

    const authService = {
        name: config.services.auth.name,
        path: config.services.auth.path
    };

    await dependencyInjectorLoader({
        dataSource: dataSource as any,
        schemas: [],
        controllers: [
            authController
        ],
        repos: [
            userRepo
        ],
        services: [
            authService
        ]
    } as any);
    Logger.info('✌️ Entities, Controllers, Repositories, Services, etc. loaded');

    await expressLoader({app: expressApp});
    Logger.info('✌️ Express loaded');
};
