import 'reflect-metadata';
import 'dotenv/config'; // Just import for side effects (loads .env)
import express from 'express';

// ⚠️ Note: In NodeNext, you often need the .js extension for local imports
import Logger from './loaders/logger.js';
import config from './config/index.js'; // You need to create this file!

async function startServer() {
  const app = express();

  // 🔴 FIX: Replace 'require' with dynamic 'import'
  const loaders = await import('./loaders/index.js');
  await loaders.default({ expressApp: app });

  app.listen(config.port, () => {
    Logger.info(`
      ################################################
      Server listening on port: ${config.port}
      ################################################
    `);
  }).on('error', (err) => {
    Logger.error(err);
    process.exit(1);
  });
}

startServer();
