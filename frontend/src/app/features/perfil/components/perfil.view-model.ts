import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Location } from '@angular/common';
import { PerfilService } from '../services/perfil.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../auth/services/auth.service';
import { PerfilModel } from '../models/perfil.model';
import { PerfilMapper } from '../mappers/perfil.mapper';
import { AtualizarPerfilDTO } from '../dto/perfil.dto';

/**
 * ViewModel for the user profile component.
 */
@Injectable()
export class PerfilViewModel {
  private service = inject(PerfilService);
  private notification = inject(NotificationService);
  private auth = inject(AuthService);
  private location = inject(Location);

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly isSaving$  = new BehaviorSubject<boolean>(false);
  readonly perfil$    = new BehaviorSubject<PerfilModel | null>(null);

  loadData(): void {
    this.isLoading$.next(true);
    this.service.getCurrent().subscribe({
      next: dto => {
        this.perfil$.next(PerfilMapper.toModel(dto));
        this.isLoading$.next(false);
      },
      error: () => {
        this.notification.error('Erro ao carregar perfil');
        this.isLoading$.next(false);
      }
    });
  }

  save(payload: AtualizarPerfilDTO): void {
    const email = this.perfil$.value?.email;
    if (!email) return;

    // Only send fields that were actually filled in
    const dto: AtualizarPerfilDTO = {};
    if (payload.name?.trim())     dto.name     = payload.name.trim();
    if (payload.password?.trim()) dto.password = payload.password.trim();
    if (!dto.name && !dto.password) {
      this.notification.error('Por favor altere pelo menos um campo');
      return;
    }

    this.isSaving$.next(true);
    this.service.update(email, dto).subscribe({
      next: updated => {
        this.perfil$.next(PerfilMapper.toModel(updated));
        if (dto.name) {
          const u = this.auth.user();
          if (u) this.auth.user.set({ ...u, name: dto.name });
        }
        this.notification.success('Perfil atualizado com sucesso');
        this.isSaving$.next(false);
        this.location.back();
      },
      error: err => {
        const msg = err?.error?.error ?? 'Erro ao atualizar perfil';
        this.notification.error(msg);
        this.isSaving$.next(false);
      }
    });
  }
}
