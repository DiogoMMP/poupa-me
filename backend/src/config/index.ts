import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
    // This error should crash whole process

    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
    port: parseInt(process.env.PORT || '3000', 10),

    // You can add your database URI, JWT secret, etc here
    databaseURL: process.env.MONGODB_URI,

    // Postgres connection URL (preferred for new Postgres loader).
    // Default to a local Postgres DB named 'poupe-me' if POSTGRES_URL is not set.
    postgresURL: process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/poupe-me',

    logs: {
        level: process.env.LOG_LEVEL || 'silly',
    },
    api: {
        prefix: '/api',
    },

    /**
     * Main API configuration for inter-module communication.
     * The OEM module communicates with the main C# backend via REST API calls
     * for authentication and authorization (IAM-based, RBAC/ABAC approach).
     */
    mainApi: {
        baseUrl: process.env.MAIN_API_URL || 'http://localhost:5137',
    },

    repos: {
        user: {
            name: 'UserRepo',
            path: '../repos/UserRepo.js'
        }
    },

    services: {
        auth: {
            name: 'AuthService',
            path: '../services/AuthService.js'
        }
    },

    controllers: {
        auth: {
            name: 'AuthController',
            path: '../controllers/AuthController.js'
        }
    },


};
