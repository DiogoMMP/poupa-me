import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage the globally selected bank across the application.
 * The selection is persisted in localStorage keyed by userId so each user
 * keeps their own banco selection across login/logout cycles.
 */
@Injectable({
  providedIn: 'root'
})
export class SelectedBancoService {
  private readonly STORAGE_PREFIX = 'selectedBancoId';
  private userId: string | null = null;
  private selectedBancoIdSubject = new BehaviorSubject<string | null>(this.loadFromStorage(null));

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
   * Called after login so the service loads the banco saved for this specific user.
   */
  initForUser(userId: string): void {
    this.userId = userId;
    const saved = this.loadFromStorage(userId);
    this.selectedBancoIdSubject.next(saved);
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
   * Clears the in-memory selection but does NOT remove from localStorage,
   * so the next login for the same user restores their last banco.
   */
  clearSelection(): void {
    this.userId = null;
    this.selectedBancoIdSubject.next(null);
  }

  private storageKey(userId: string | null): string {
    return userId ? `${this.STORAGE_PREFIX}_${userId}` : this.STORAGE_PREFIX;
  }

  /**
   * Load the selected banco ID from localStorage on service initialization.
   */
  private loadFromStorage(userId: string | null): string | null {
    // avoid accessing localStorage in non-browser or SSR environments
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      return localStorage.getItem(this.storageKey(userId));
    } catch {
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
      const key = this.storageKey(this.userId);
      if (bancoId) {
        localStorage.setItem(key, bancoId);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }
}
