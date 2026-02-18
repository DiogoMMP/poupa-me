import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { BancosService } from '../../features/bancos/services/bancos.service';
import { SelectedBancoService } from '../../services/selected-banco.service';
import { BancosDTO } from '../../features/bancos/dto/bancos.dto';

/**
 * Header component displaying the application header with user info and logout functionality.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
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
  private notificationService = inject(NotificationService);

  bancos = signal<BancosDTO[]>([]);
  selectedBancoId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadBancos();

    // Subscribe to selected banco changes
    this.selectedBancoService.selectedBancoId$.subscribe(id => {
      this.selectedBancoId.set(id);
    });
  }

  private loadBancos(): void {
    this.bancosService.getAll().subscribe({
      next: (bancos) => {
        this.bancos.set(bancos);
      },
      error: (err) => {
        console.error('[FRONTEND] HeaderComponent.loadBancos -', err);
        this.notificationService.error('Falha ao carregar bancos');
      }
    });
  }

  onBancoChange(bancoId: string): void {
    const id = bancoId || null;
    this.selectedBancoService.selectBanco(id);
  }
}
