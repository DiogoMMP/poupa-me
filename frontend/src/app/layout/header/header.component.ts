import { Component, ChangeDetectionStrategy, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { BancosService } from '../../features/bancos/services/bancos.service';
import { SelectedBancoService } from '../../services/selected-banco.service';
import { BancosStateService } from '../../services/bancos-state.service';
import { BancosDTO } from '../../features/bancos/dto/bancos.dto';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SelectComponent, AppSelectOption } from '../../shared/components/select/select.component';

/**
 * Header component displaying the application header with user info, logout functionality and the
 * dropdown (`app-select`) to switch the globally active banco.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, SelectComponent],
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.css'],
  host: { class: 'layout-header' }
})

/**
 * Header component class.
 */
export class HeaderComponent implements OnInit {
  private bancosService = inject(BancosService);
  private selectedBancoService = inject(SelectedBancoService);
  private bancosStateService = inject(BancosStateService);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  bancos = signal<BancosDTO[]>([]);
  selectedBancoId = signal<string | null>(null);
  isLoading = signal(true);

  /**
   * Bancos ordenados alfabeticamente pelo nome (pt-PT), para a lista suspensa.
   */
  readonly sortedBancos = computed(() =>
    [...this.bancos()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
  );

  /**
   * Opções do `<app-select>`, derivadas dos bancos ordenados.
   */
  readonly bancoOptions = computed<AppSelectOption[]>(() =>
    this.sortedBancos().map(b => ({ value: b.id, label: `${b.icon} ${b.nome}` }))
  );

  ngOnInit(): void {
    // Initialize with current value from service (may be loaded from localStorage)
    this.selectedBancoId.set(this.selectedBancoService.currentBancoId);

    this.loadBancos();

    // Subscribe to selected banco changes
    this.selectedBancoService.selectedBancoId$.subscribe(id => {
      this.selectedBancoId.set(id);
    });

    // Reload the list whenever a banco is created/edited/deleted elsewhere in the app — this
    // component lives across navigations and only fetched the list once on init otherwise.
    this.bancosStateService.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadBancos());
  }

  private loadBancos(): void {
    this.isLoading.set(true);
    this.bancosService.getAll().subscribe({
      next: (bancos) => {
        this.bancos.set(bancos);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);

        // If not authenticated, skip noisy logging (user may be on public pages)
        if (err?.status === 401) {
          // optional: keep empty state
          this.bancos.set([]);
          return;
        }

        console.error('[FRONTEND] HeaderComponent.loadBancos -', err?.message || err);
        this.notificationService.error('Falha ao carregar bancos');
      }
    });
  }

  onBancoChange(bancoId: string | null): void {
    this.selectedBancoService.selectBanco(bancoId || null);
  }
}
