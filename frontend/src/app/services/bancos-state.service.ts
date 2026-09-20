import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Notifies persistent, layout-level consumers (sidebar selector, app-layout gate) that the list
 * of Bancos changed (created/edited/deleted), so they reload their own cached copy instead of
 * going stale until the next full page reload — those components live across navigations and
 * fetch the list once on init, so a mutation elsewhere in the app never reaches them otherwise.
 */
@Injectable({ providedIn: 'root' })
export class BancosStateService {
  private readonly changedSubject = new Subject<void>();
  readonly changed$ = this.changedSubject.asObservable();

  notifyChanged(): void {
    this.changedSubject.next();
  }
}
