import {Component, ChangeDetectionStrategy, inject, OnInit, HostListener} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {AuthService} from '../auth/services/auth.service';
import { signal } from '@angular/core';
import { DashboardViewModel } from './dashboard.view-model';

/**
 * Dashboard component displaying the dashboard page content.
 */
@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
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

  // Nova Transação dropdown
  showCreateMenu = false;

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

  toggleCreateMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showCreateMenu = !this.showCreateMenu;
  }

  @HostListener('document:click')
  closeCreateMenu(): void {
    this.showCreateMenu = false;
  }
}

/**
 * Routes for the dashboard feature module.
 */
export const routes: Routes = [
  { path: '', component: DashboardComponent }
];
