import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFeatureService } from '../../services/auth-feature.service';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthMapper } from '../../mappers/auth.mapper';
import { LoginDTO } from '../../dto/auth.dto';

const ERROR_MAP: Record<string, string> = {
  'Invalid credentials': 'Credenciais inválidas. Tente novamente.',
  'User not found': 'Utilizador não encontrado.',
  'Invalid password': 'Password incorreta.',
  'No login data provided': 'Dados de login em falta.',
};

function translateError(msg: string): string {
  return ERROR_MAP[msg] ?? 'Credenciais inválidas. Tente novamente.';
}

@Injectable()
export class AuthEntrarViewModel {
  private featureService = inject(AuthFeatureService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  login(dto: LoginDTO): void {
    this.loading.set(true);
    this.error.set(null);

    this.featureService.login(dto).subscribe({
      next: responseDTO => {
        const response = AuthMapper.toUserModel(responseDTO);
        this.authService.user.set({
          id: response.user.id,
          name: response.user.name,
          role: response.user.role as any,
          locale: 'pt'
        });
        this.notification.success(`Bem-vindo, ${response.user.name}!`);
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const raw: string = err?.error?.error ?? '';
        const msg = translateError(raw);
        this.error.set(msg);
        this.notification.error(msg);
        this.loading.set(false);
      }
    });
  }
}
