import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server-side routes configuration.
 * This configuration defines the rendering mode for all routes.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    // Use server-side rendering for dynamic routes (routes with parameters). Prerendering all paths causes errors
    // when the router contains parameterized routes (it expects getPrerenderParams to be defined).
    renderMode: RenderMode.Server
  }
];
