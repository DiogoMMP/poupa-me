/**
 * This file contains environment-specific configuration settings for the development environment.
 * It is used during the build process to replace the default environment settings.
 */
import { version } from '../../package.json';

export const environment = {
  production: false,
  apiBaseUrl: '/api',
  version
} as const;
