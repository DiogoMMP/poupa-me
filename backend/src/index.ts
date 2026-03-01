import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import Logger from './loaders/logger.js';
import config from './config/index.js';

async function startServer() {
  const app = express();

  app.get('/', (req, res) => {
    res.status(200).send('PoupaMe API is Live! 🚀');
  });

  const loaders = await import('./loaders/index.js');
  await loaders.default({ expressApp: app });

  app.listen(config.port, '0.0.0.0', () => {
    Logger.info(`
      ################################################
      🛡️  Server listening on port: ${config.port} 🛡️
      ################################################
    `);
  }).on('error', (err) => {
    Logger.error(err);
    process.exit(1);
  });
}

startServer();