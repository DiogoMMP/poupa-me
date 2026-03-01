import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, inject } from '@angular/core';
import { AuthService } from './app/features/auth/services/auth.service';

import { App } from './app/app';
import { routes } from './app/app.routes';

// Create interceptor function
function authInterceptor(req: any, next: any) {
  const authService = inject(AuthService);
  return authService.handleHttpInterceptor(req, next);
}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initializeAuth(),
      deps: [AuthService],
      multi: true
    }
  ]
}).catch(err => console.error(err));

