import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

/**
 * Vite configuration for an Angular application.
 * This configuration sets up the Angular plugin and a development server proxy.
 *
 * You can override the API proxy target by setting the environment variable
 * VITE_API_TARGET (for example: https://10.9.10.51:7166). If the backend
 * uses a self-signed certificate, set VITE_API_SECURE=false to disable cert
 * verification for the proxy.
 */

const apiTarget = process.env.VITE_API_TARGET || 'https://localhost:7166';
const apiSecure = process.env.VITE_API_SECURE !== 'false';
const oemApiTarget = process.env.VITE_OEM_API_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [angular()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        secure: apiSecure, // set to false when using self-signed certs on the VM
        changeOrigin: true
      },
      '/oem-api': {
        target: oemApiTarget,
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/oem-api/, '/api')
      }
    }
  }
});
