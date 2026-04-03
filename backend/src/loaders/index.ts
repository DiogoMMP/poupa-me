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


    const bancoController = {
        name: config.controllers.banco.name,
        path: config.controllers.banco.path
    };

    const bancoService = {
        name: config.services.banco.name,
        path: config.services.banco.path
    };

    const bancoRepo = {
        name: config.repos.banco.name,
        path: config.repos.banco.path
    };


    const despesaRecorrenteController = {
        name: config.controllers.despesaRecorrente.name,
        path: config.controllers.despesaRecorrente.path
    };

    const despesaRecorrenteService = {
        name: config.services.despesaRecorrente.name,
        path: config.services.despesaRecorrente.path
    };

    const despesaRecorrenteRepo = {
        name: config.repos.despesaRecorrente.name,
        path: config.repos.despesaRecorrente.path
    };



    const importService = {
        name: config.services.import.name,
        path: config.services.import.path
    };

    const importController = {
        name: config.controllers.import.name,
        path: config.controllers.import.path
    };



    const iaCategorizacaoController = {
        name: config.controllers.iaCategorizacao.name,
        path: config.controllers.iaCategorizacao.path
    };

    const iaCategorizacaoService = {
        name: config.services.iaCategorizacao.name,
        path: config.services.iaCategorizacao.path
    }


    await dependencyInjectorLoader({
        dataSource: dataSource as any,
        schemas: [],
        controllers: [
            authController,
            categoriaController,
            transacaoController,
            contaController,
            cartaoController,
            bancoController,
            despesaRecorrenteController,
            importController,
            iaCategorizacaoController
        ],
        repos: [
            userRepo,
            categoriaRepo,
            transacaoRepo,
            contaRepo,
            cartaoRepo,
            bancoRepo,
            despesaRecorrenteRepo
        ],
        services: [
            authService,
            categoriaService,
            transacaoService,
            contaService,
            cartaoService,
            bancoService,
            despesaRecorrenteService,
            importService,
            iaCategorizacaoService
        ]
    } as any);
    Logger.info('✌️ Entities, Controllers, Repositories, Services, etc. loaded');

    await expressLoader({app: expressApp});
    Logger.info('✌️ Express loaded');
};
