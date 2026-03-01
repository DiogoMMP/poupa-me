import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFeatureService } from '../../services/auth-feature.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../services/notification.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { AuthMapper } from '../../mappers/auth.mapper';
import { RegisterDTO } from '../../dto/auth.dto';

const ERROR_MAP: Record<string, string> = {
  'Email already in use': 'Este email já está registado.',
  'No registration data provided': 'Dados de registo em falta.',
  'Invalid registration data': 'Dados inválidos. Verifique os campos.',
};

function translateError(msg: string): string {
  return ERROR_MAP[msg] ?? msg;
}

@Injectable()
export class AuthRegistarViewModel {
  private featureService = inject(AuthFeatureService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private selectedBanco = inject(SelectedBancoService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  register(dto: RegisterDTO): void {
    this.loading.set(true);
    this.error.set(null);

    this.featureService.register(dto).subscribe({
      next: () => {
        // Register succeeded — now login automatically with the same credentials
        this.featureService.login({ email: dto.email, password: dto.password }).subscribe({
          next: responseDTO => {
            const response = AuthMapper.toUserModel(responseDTO);
            this.authService.user.set({
              id: response.user.id,
              name: response.user.name,
              role: response.user.role as any,
              locale: 'pt'
            });
            // Restore this user's previously selected banco (new user will have none)
            this.selectedBanco.initForUser(response.user.id);
            this.notification.success(`Conta criada! Bem-vindo, ${response.user.name}!`);
            this.loading.set(false);
            void this.router.navigate(['/dashboard']);
          },
          error: () => {
            // Account was created but auto-login failed — redirect to entrar
            this.notification.success('Conta criada! Faça login para continuar.');
            this.loading.set(false);
            void this.router.navigate(['/auth/entrar']);
          }
        });
      },
      error: (err) => {
        const raw: string = err?.error?.error ?? 'Erro ao criar conta. Tente novamente.';
        const msg = translateError(raw);
        this.error.set(msg);
        this.notification.error(msg);
        this.loading.set(false);
      }
    });
  }
}
