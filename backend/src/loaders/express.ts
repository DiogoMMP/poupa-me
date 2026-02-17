import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import routes from '../api/index.js';
import config from '../config/index.js';

export default ({ app }: { app: express.Application }) => {
  /**
   * Health check endpoints
   */
  app.get('/status', (req, res) => { res.status(200).end(); });
  app.head('/status', (req, res) => { res.status(200).end(); });

  app.enable('trust proxy');

  /**
   * CORS Configuration
   * Alinhado com o frontend do PoupaMe
   */
  app.use(cors({
    origin: [
      'http://localhost:4200',
      process.env.FRONTEND_URL || 'http://localhost:4200',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  }));

  app.use(cookieParser());

  /**
   * Session Configuration
   * Configure express-session for session-based authentication
   */
  app.use(session({
    secret: process.env.SESSION_SECRET || 'poupa-me-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production (requires HTTPS)
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    }
  }));

  app.use(express.json());

  const isLocalDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Swagger Cookie logic for dev environment
   */
  if (isLocalDevelopment) {
    app.use((req, res, next) => {
      if (req.path.toLowerCase().startsWith('/docs')) {
        res.cookie('from-swagger', '1', {
          httpOnly: false,
          secure: req.secure,
          sameSite: 'lax',
          path: '/'
        });
      }
      next();
    });
  }

  /**
   * Swagger Configuration - Poupa-Me API
   */
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Poupa-Me API',
        version: '1.0.0',
        description: `
Documentação da API do projeto Poupa-Me.

Esta API fornece os serviços de gestão financeira, contas e transações, protegidos por autenticação local.

**Segurança**:
${isLocalDevelopment ? `
🔓 **Modo Dev**: O Swagger auto-autentica os pedidos como Admin.
` : `
🔒 **Produção**: Requer o cookie 'token' gerado no login.
`}
        `,
      },
      servers: [{ url: `http://localhost:${config.port}${config.api.prefix}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'token', // Nome do cookie local
            description: 'JWT Auth Token',
          },
        },
      },
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    },
    apis: ['./src/api/**/*.ts', './src/loaders/express.ts'],
  };

  const specs = swaggerJsdoc(options);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

  /**
   * Swagger Auto-Authentication Middleware
   * Injeta o utilizador Admin para facilitar testes locais
   * NOTA: Apenas ativa quando o request vem DIRETAMENTE do Swagger (/docs)
   */
  if (isLocalDevelopment) {
    app.use(config.api.prefix, (req: any, res, next) => {
      const referer = req.headers['referer'] || '';
      // APENAS ativa se o referer contém /docs (request vem do Swagger)
      const isFromSwagger = referer.toLowerCase().includes('/docs');

      // Só injeta se vier do Swagger E não houver sessão real
      if (isFromSwagger && !req.session?.user) {
        if (!req.currentUser) {
          req.currentUser = {
            id: 'swagger-dev',
            name: 'Swagger Dev',
            role: 'Admin',
            isActive: true
          };
        }
      }
      next();
    });
  }

  // Carregamento das rotas principais da API
  app.use(config.api.prefix, routes());

  /**
   * Error Handlers
   */
  app.use((req, res, next) => {
    const err: any = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(err.status).send({ message: err.message }).end();
    }
    return next(err);
  });

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500);
    res.json({ errors: { message: err.message } });
  });
};