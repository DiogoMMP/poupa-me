import {Component, ChangeDetectionStrategy, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {AuthService} from '../auth/services/auth.service';
import { signal } from '@angular/core';
import { DashboardViewModel } from './dashboard.view-model';
import { TransacaoItemComponent } from '../../shared/components/transacao-item/transacao-item.component';
import { NovaTransacaoMenuComponent } from '../../shared/components/nova-transacao-menu/nova-transacao-menu.component';
import { LoadingCoinComponent } from '../../shared/components/loading-coin/loading-coin.component';

/**
 * Dashboard component displaying the dashboard page content.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TransacaoItemComponent, NovaTransacaoMenuComponent, LoadingCoinComponent],
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.css'],
  host: {class: 'page-dashboard'},
  standalone: true,
  providers: [DashboardViewModel]
})

/**
 * Dashboard component class.
 */
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  user = this.auth.user;

  // greeting signal (Bom dia / Boa tarde / Boa noite)
  greeting = signal('');

  // ViewModel
  vm = inject(DashboardViewModel);

  dashboard$ = this.vm.dashboard$;
  contas$ = this.vm.contas$;
  cartoes$ = this.vm.cartoes$;
  transacoes$ = this.vm.transacoes$;
  hasBancoSelected$ = this.vm.hasBancoSelected$;

  ngOnInit(): void {
    this.greeting.set(this.computeGreeting());
    this.vm.loadBancos();
  }

  private computeGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Bom dia';
    if (h >= 12 && h < 18) return 'Boa tarde';
    return 'Boa noite';
  }
}

/**
 * Routes for the dashboard feature module.
 */
export const routes: Routes = [
  { path: '', component: DashboardComponent }
];
