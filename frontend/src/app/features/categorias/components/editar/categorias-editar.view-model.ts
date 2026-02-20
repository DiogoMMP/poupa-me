import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { CategoriasService } from '../../services/categorias.service';
import { NotificationService } from '../../../../services/notification.service';
import { CategoriasModel } from '../../models/categorias.model';
import { CategoriasMapper } from '../../mappers/categorias.mapper';
import { CategoriasInputDTO } from '../../dto/categorias.dto';

/**
 * ViewModel for the Categorias Editar component. Handles the logic for loading category data and submitting updates.
 */
@Injectable()
export class CategoriasEditarViewModel {
  private service = inject(CategoriasService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly categoria$ = new BehaviorSubject<CategoriasModel | null>(null);

  /**
   * Loads the category data by ID and updates the state accordingly.
   * @param id
   */
  loadData(id: string): void {
    this.isLoading$.next(true);

    this.service.getById(id).subscribe({
      next: (dto) => {
        const model = CategoriasMapper.toModel(dto);
        this.categoria$.next(model);
        this.isLoading$.next(false);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar categoria');
        this.isLoading$.next(false);
        this.router.navigate(['/categorias']);
      }
    });
  }

  /**
   * Submits the updated category data to the service and handles the response.
   * @param id - The ID of the category being updated.
   * @param formData - The updated category data from the form.
   */
  submit(id: string, formData: Partial<CategoriasInputDTO>): void {
    // Build full input DTO merging with existing values (PUT semantics)
    const existing = this.categoria$.getValue();
    const payload: CategoriasInputDTO = {
      nome: formData.nome !== undefined ? formData.nome : (existing?.nome || ''),
      icon: formData.icon !== undefined ? formData.icon : (existing?.icon || '')
    };

    this.isLoading$.next(true);

    this.service.update(id, payload).subscribe({
      next: () => {
        this.notification.success('Categoria atualizada com sucesso');
        this.isLoading$.next(false);
        this.router.navigate(['/categorias']);
      },
      error: (_err) => {
        this.notification.error('Falha ao atualizar categoria');
        this.isLoading$.next(false);
      }
    });
  }
}
