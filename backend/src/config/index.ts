import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();

if (envFound.error) {
    if (process.env.NODE_ENV === 'development') {
        throw new Error("⚠️  Couldn't find .env file  ⚠️");
    } else {
        console.info("ℹ️  No .env file found, using system environment variables.");
    }
}

export default {
    port: parseInt(process.env.PORT || '10000', 10),

    postgresURL: process.env.POSTGRES_URL || process.env.DATABASE_URL,

    logs: {
        level: process.env.LOG_LEVEL || 'info',
    },
    api: {
        prefix: '/api',
    },

    repos: {
        user: {
            name: 'UserRepo',
            path: '../repos/User/UserRepo.js'
        },

        categoria: {
            name: 'CategoriaRepo',
            path: '../repos/Categoria/CategoriaRepo.js'
        },

        transacao: {
            name: 'TransacaoRepo',
            path: '../repos/Transacao/TransacaoRepo.js'
        },

        transacaoContaQuery: {
            name: 'TransacaoContaQueryRepo',
            path: '../repos/Transacao/TransacaoContaQueryRepo.js'
        },

        transacaoCartaoQuery: {
            name: 'TransacaoCartaoQueryRepo',
            path: '../repos/Transacao/TransacaoCartaoQueryRepo.js'
        },

        transacaoPagarCartao: {
            name: 'TransacaoPagarCartaoRepo',
            path: '../repos/Transacao/TransacaoPagarCartaoRepo.js'
        },

        transacaoDespesasRecorrentes: {
            name: 'TransacaoDespesasRecorrentesRepo',
            path: '../repos/Transacao/TransacaoDespesasRecorrentesRepo.js'
        },

        conta: {
            name: 'ContaRepo',
            path: '../repos/Conta/ContaRepo.js'
        },

        cartao: {
            name: 'CartaoCreditoRepo',
            path: '../repos/CartaoCredito/CartaoCreditoRepo.js'
        },

        banco: {
            name: 'BancoRepo',
            path: '../repos/Banco/BancoRepo.js'
        },

        despesaRecorrente: {
            name: 'DespesaRecorrenteRepo',
            path: '../repos/DespesaRecorrente/DespesaRecorrenteRepo.js'
        },
        despesaRecorrenteQuery: {
            name: 'DespesaRecorrenteQueryRepo',
            path: '../repos/DespesaRecorrente/DespesaRecorrenteQueryRepo.js'
        }
    },

    ai: {
        hfToken: process.env.HF_TOKEN,
        model: 'Qwen/Qwen2.5-7B-Instruct',
    },

    services: {
        auth: {
            name: 'AuthService',
            path: '../services/Auth/AuthService.js'
        },

        categoria: {
            name: 'CategoriaService',
            path: '../services/Categoria/CategoriaService.js'
        },

        transacao: {
            name: 'TransacaoService',
            path: '../services/Transacao/TransacaoService.js'
        },

        transacaoContaQuery: {
            name: 'TransacaoContaQueryService',
            path: '../services/Transacao/TransacaoContaQueryService.js'
        },

        transacaoCartaoQuery: {
            name: 'TransacaoCartaoQueryService',
            path: '../services/Transacao/TransacaoCartaoQueryService.js'
        },

        transacaoDespesasRecorrentes: {
            name: 'TransacaoDespesasRecorrentesService',
            path: '../services/Transacao/TransacaoDespesasRecorrentesService.js'
        },

        conta: {
            name: 'ContaService',
            path: '../services/Conta/ContaService.js'
        },

        cartao: {
            name: 'CartaoCreditoService',
            path: '../services/CartaoCredito/CartaoCreditoService.js'
        },

        banco: {
            name: 'BancoService',
            path: '../services/Banco/BancoService.js'
        },

        despesaRecorrente: {
            name: 'DespesaRecorrenteService',
            path: '../services/DespesaRecorrente/DespesaRecorrenteService.js'
        },
        despesaRecorrenteProcessador: {
            name: 'DespesaRecorrenteProcessadorService',
            path: '../services/DespesaRecorrente/DespesaRecorrenteProcessadorService.js'
        },

        iaCategorizacao: {
            name: 'IACategorizacaoService',
            path: '../services/IACategorizacao/IACategorizacaoService.js'
        },

        estatisticas: {
            name: 'EstatisticasService',
            path: '../services/Estatisticas/EstatisticasService.js'
        }
    },

    controllers: {
        auth: {
            name: 'AuthController',
            path: '../controllers/Auth/AuthController.js'
        },

        categoria: {
            name: 'CategoriaController',
            path: '../controllers/Categoria/CategoriaController.js'
        },

        transacao: {
            name: 'TransacaoController',
            path: '../controllers/Transacao/TransacaoController.js'
        },

        transacaoContaQuery: {
            name: 'TransacaoContaQueryController',
            path: '../controllers/Transacao/TransacaoContaQueryController.js'
        },

        transacaoCartaoQuery: {
            name: 'TransacaoCartaoQueryController',
            path: '../controllers/Transacao/TransacaoCartaoQueryController.js'
        },

        conta: {
            name: 'ContaController',
            path: '../controllers/Conta/ContaController.js'
        },

        cartao: {
            name: 'CartaoCreditoController',
            path: '../controllers/CartaoCredito/CartaoCreditoController.js'
        },

        banco: {
            name: 'BancoController',
            path: '../controllers/Banco/BancoController.js'
        },

        despesaRecorrente: {
            name: 'DespesaRecorrenteController',
            path: '../controllers/DespesaRecorrente/DespesaRecorrenteController.js'
        },
        despesaRecorrenteProcessador: {
            name: 'DespesaRecorrenteProcessadorController',
            path: '../controllers/DespesaRecorrente/DespesaRecorrenteProcessadorController.js'
        },

        iaCategorizacao: {
            name: 'IACategorizacaoController',
            path: '../controllers/IACategorizacao/IACategorizacaoController.js'
        },

        estatisticas: {
            name: 'EstatisticasController',
            path: '../controllers/Estatisticas/EstatisticasController.js'
        }
    },


};
