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
            path: '../repos/UserRepo.js'
        },

        categoria: {
            name: 'CategoriaRepo',
            path: '../repos/CategoriaRepo.js'
        },

        transacao: {
            name: 'TransacaoRepo',
            path: '../repos/TransacaoRepo.js'
        },

        conta: {
            name: 'ContaRepo',
            path: '../repos/ContaRepo.js'
        },

        cartao: {
            name: 'CartaoCreditoRepo',
            path: '../repos/CartaoCreditoRepo.js'
        },

        banco: {
            name: 'BancoRepo',
            path: '../repos/BancoRepo.js'
        },

        despesaRecorrente: {
            name: 'DespesaRecorrenteRepo',
            path: '../repos/DespesaRecorrenteRepo.js'
        }
    },

    ai: {
        hfToken: process.env.HF_TOKEN,
        model: 'Qwen/Qwen2.5-7B-Instruct',
    },

    services: {
        auth: {
            name: 'AuthService',
            path: '../services/AuthService.js'
        },

        categoria: {
            name: 'CategoriaService',
            path: '../services/CategoriaService.js'
        },

        transacao: {
            name: 'TransacaoService',
            path: '../services/TransacaoService.js'
        },

        conta: {
            name: 'ContaService',
            path: '../services/ContaService.js'
        },

        cartao: {
            name: 'CartaoCreditoService',
            path: '../services/CartaoCreditoService.js'
        },

        banco: {
            name: 'BancoService',
            path: '../services/BancoService.js'
        },

        despesaRecorrente: {
            name: 'DespesaRecorrenteService',
            path: '../services/DespesaRecorrenteService.js'
        },

        import: {
            name: 'ImportService',
            path: '../services/ImportService.js'
        },

        iaCategorizacao: {
            name: 'IACategorizacaoService',
            path: '../services/IACategorizacaoService.js'
        },

        estatisticas: {
            name: 'EstatisticasService',
            path: '../services/EstatisticasService.js'
        }
    },

    controllers: {
        auth: {
            name: 'AuthController',
            path: '../controllers/AuthController.js'
        },

        categoria: {
            name: 'CategoriaController',
            path: '../controllers/CategoriaController.js'
        },

        transacao: {
            name: 'TransacaoController',
            path: '../controllers/TransacaoController.js'
        },

        conta: {
            name: 'ContaController',
            path: '../controllers/ContaController.js'
        },

        cartao: {
            name: 'CartaoCreditoController',
            path: '../controllers/CartaoCreditoController.js'
        },

        banco: {
            name: 'BancoController',
            path: '../controllers/BancoController.js'
        },

        despesaRecorrente: {
            name: 'DespesaRecorrenteController',
            path: '../controllers/DespesaRecorrenteController.js'
        },

        import: {
            name: 'ImportController',
            path: '../controllers/ImportController.js'
        },

        iaCategorizacao: {
            name: 'IACategorizacaoController',
            path: '../controllers/IACategorizacaoController.js'
        },

        estatisticas: {
            name: 'EstatisticasController',
            path: '../controllers/EstatisticasController.js'
        }
    },


};
