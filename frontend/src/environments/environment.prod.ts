/**
 * This file contains environment-specific configuration settings for the production environment.
 * It is used during the build process to replace the default environment settings.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://poupa-me-api.onrender.com/api'
} as const;
