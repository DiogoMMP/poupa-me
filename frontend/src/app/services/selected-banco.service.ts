import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage the globally selected bank across the application.
 * Components can subscribe to selectedBancoId$ to react to bank changes.
 * The selection is persisted in localStorage to survive page refreshes and navigation.
 */
@Injectable({
  providedIn: 'root'
})
export class SelectedBancoService {
  private readonly STORAGE_KEY = 'selectedBancoId';
  private selectedBancoIdSubject = new BehaviorSubject<string | null>(this.loadFromStorage());

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
   * Set the selected banco ID and persist to localStorage.
   * @param bancoId - The banco ID to select, or null to clear selection
   */
  selectBanco(bancoId: string | null): void {
    this.selectedBancoIdSubject.next(bancoId);
    this.saveToStorage(bancoId);
  }

  /**
   * Clear the banco selection and remove from localStorage.
   */
  clearSelection(): void {
    this.selectedBancoIdSubject.next(null);
    this.removeFromStorage();
  }

  /**
   * Load the selected banco ID from localStorage on service initialization.
   */
  private loadFromStorage(): string | null {
    // avoid accessing localStorage in non-browser or SSR environments
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('[SelectedBancoService] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Save the selected banco ID to localStorage.
   */
  private saveToStorage(bancoId: string | null): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      if (bancoId) {
        localStorage.setItem(this.STORAGE_KEY, bancoId);
      } else {
        this.removeFromStorage();
      }
    } catch (error) {
      console.warn('[SelectedBancoService] Failed to save to localStorage:', error);
    }
  }

  /**
   * Remove the selected banco ID from localStorage.
   */
  private removeFromStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('[SelectedBancoService] Failed to remove from localStorage:', error);
    }
  }
}
