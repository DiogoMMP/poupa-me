/**
 * This file contains environment-specific configuration settings for the development environment.
 * It is used during the build process to replace the default environment settings.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api'
} as const;
