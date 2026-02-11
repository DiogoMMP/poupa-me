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



    const categoriaController = {
        name: config.controllers.categoria.name,
        path: config.controllers.categoria.path
    };

    const categoriaRepo = {
        name: config.repos.categoria.name,
        path: config.repos.categoria.path
    };

    const categoriaService = {
        name: config.services.categoria.name,
        path: config.services.categoria.path
    };



    const transacaoController = {
        name: config.controllers.transacao.name,
        path: config.controllers.transacao.path
    };

    const transacaoRepo = {
        name: config.repos.transacao.name,
        path: config.repos.transacao.path
    };

    const transacaoService = {
        name: config.services.transacao.name,
        path: config.services.transacao.path
    };



    const contaController = {
        name: config.controllers.conta.name,
        path: config.controllers.conta.path
    };

    const contaService = {
        name: config.services.conta.name,
        path: config.services.conta.path
    };

    const contaRepo = {
        name: config.repos.conta.name,
        path: config.repos.conta.path
    };



    const cartaoController = {
        name: config.controllers.cartao.name,
        path: config.controllers.cartao.path
    };

    const cartaoService = {
        name: config.services.cartao.name,
        path: config.services.cartao.path
    };

    const cartaoRepo = {
        name: config.repos.cartao.name,
        path: config.repos.cartao.path
    };


    await dependencyInjectorLoader({
        dataSource: dataSource as any,
        schemas: [],
        controllers: [
            authController,
            categoriaController,
            transacaoController,
            contaController,
            cartaoController
        ],
        repos: [
            userRepo,
            categoriaRepo,
            transacaoRepo,
            contaRepo,
            cartaoRepo
        ],
        services: [
            authService,
            categoriaService,
            transacaoService,
            contaService,
            cartaoService
        ]
    } as any);
    Logger.info('✌️ Entities, Controllers, Repositories, Services, etc. loaded');

    await expressLoader({app: expressApp});
    Logger.info('✌️ Express loaded');
};
