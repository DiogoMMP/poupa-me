import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage the globally selected bank across the application.
 * Components can subscribe to selectedBancoId$ to react to bank changes.
 */
@Injectable({
  providedIn: 'root'
})
export class SelectedBancoService {
  private selectedBancoIdSubject = new BehaviorSubject<string | null>(null);

  /**
   * Observable that emits the currently selected banco ID.
   * Null means no banco is selected.
   */
  public selectedBancoId$: Observable<string | null> = this.selectedBancoIdSubject.asObservable();

  /**
   * Get the current selected banco ID synchronously.
   */
  get currentBancoId(): string | null {
    return this.selectedBancoIdSubject.value;
  }

  /**
   * Set the selected banco ID.
   * @param bancoId - The banco ID to select, or null to clear selection
   */
  selectBanco(bancoId: string | null): void {
    this.selectedBancoIdSubject.next(bancoId);
  }

  /**
   * Clear the banco selection.
   */
  clearSelection(): void {
    this.selectedBancoIdSubject.next(null);
  }
}

