import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { CategoriasService } from '../../services/categorias.service';
import { NotificationService } from '../../../../services/notification.service';
import { CategoriasInputDTO } from '../../dto/categorias.dto';

/**
 * ViewModel for the Categorias Create component.
 */
@Injectable()
export class CategoriasCriarViewModel {
  private service = inject(CategoriasService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  submit(formData: CategoriasInputDTO): void {
    this.isLoading$.next(true);

    this.service.create(formData).subscribe({
      next: () => {
        this.notification.success('Categoria criada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/categorias']);
      },
      error: (_err) => {
        this.notification.error('Falha ao criar categoria');
        this.isLoading$.next(false);
      }
    });
  }
}
