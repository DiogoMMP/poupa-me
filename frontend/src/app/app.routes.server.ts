import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server-side routes configuration.
 * All routes use client-side rendering (CSR) since outputMode is 'static'.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
