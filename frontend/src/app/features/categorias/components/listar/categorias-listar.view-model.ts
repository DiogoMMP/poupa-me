import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CategoriasService } from '../../services/categorias.service';
import { NotificationService } from '../../../../services/notification.service';
import { CategoriasModel } from '../../models/categorias.model';
import { CategoriasMapper } from '../../mappers/categorias.mapper';
import { AuthService } from '../../../../services/auth.service';

/**
 * ViewModel for the categorias list component.
 */
@Injectable()
export class CategoriasListViewModel {
  private service = inject(CategoriasService);
  private notification = inject(NotificationService);
  public auth = inject(AuthService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly categorias$ = new BehaviorSubject<CategoriasModel[]>([]);

  /**
   * Loads the list of categorias. This method is called when the component initializes and can be
   * called again to refresh the data.
   */
  loadData(): void {
    this.isLoading$.next(true);
    this.service.getAll().subscribe({
      next: (dtos) => {
        const models = CategoriasMapper.toModelArray(dtos);
        this.categorias$.next(models);
        this.isLoading$.next(false);
      },
      error: (err) => {
        console.error('[FRONTEND] CategoriasListViewModel.loadData -', err);
        this.notification.error('Falha ao carregar categorias');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Deletes a categoria by id after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param id The id of the categoria to delete
   */
  deleteCategoria(id: string): void {
    if (!id) return;
    if (!confirm('Tem a certeza que pretende eliminar esta categoria?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.notification.success('Categoria eliminada');
        this.loadData();
      },
      error: (err) => {
        console.error('[FRONTEND] CategoriasListViewModel.deleteCategoria -', err);
        this.notification.error('Falha ao eliminar categoria');
      }
    });
  }
}
