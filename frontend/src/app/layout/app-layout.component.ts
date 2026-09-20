import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';
import { FooterComponent } from './footer/footer.component';
import { NotificationsComponent } from './notification/notifications.component';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../shared/components/icon/icon.component';
import { BancosService } from '../features/bancos/services/bancos.service';
import { BancosDTO } from '../features/bancos/dto/bancos.dto';
import { SelectedBancoService } from '../services/selected-banco.service';
import { BancosStateService } from '../services/bancos-state.service';

/**
 * URL prefixes that do not depend on a selected banco — always reachable, even while the rest of
 * the app is blocked waiting for a banco selection (e.g. so the user can create their first banco).
 */
const BANCO_INDEPENDENT_PREFIXES = ['/bancos', '/categorias', '/utilizadores', '/perfil', '/not-authorized'];

/**
 * Main application layout component.
 * Defines the overall structure with header, navigation, footer, and router outlet for content.
 *
 * Also gates `<router-outlet>` behind a single "select a banco" message (instead of rendering the
 * routed page) whenever the current route depends on a banco and none is selected — this prevents
 * every banco-dependent page from firing its own HTTP calls/errors while unblocked.
 */
@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, HeaderComponent, NavComponent, FooterComponent, RouterOutlet, NotificationsComponent, ConfirmDialogComponent, IconComponent],
  templateUrl: "app-layout.component.html",
  styleUrl: "app-layout.component.css",
  host: { class: 'app-layout' }
})

/**
 * App layout component class.
 */
export class AppLayoutComponent implements OnInit {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private bancosService = inject(BancosService);
  private selectedBancoService = inject(SelectedBancoService);
  private bancosStateService = inject(BancosStateService);

  sidebarOpen = signal(false);

  private readonly bancos = signal<BancosDTO[]>([]);
  private readonly bancosLoaded = signal(false);
  private readonly bancosLoadError = signal(false);
  private readonly selectedBancoId = signal<string | null>(null);
  private readonly currentUrl = signal(this.router.url);

  private readonly hasBancos = computed(() => this.bancos().length > 0);
  private readonly routeRequiresBanco = computed(() => {
    const path = this.currentUrl().split('?')[0].split('#')[0];
    return !BANCO_INDEPENDENT_PREFIXES.some(p => path === p || path.startsWith(p + '/'));
  });
  readonly blocked = computed(() => this.routeRequiresBanco() && !this.selectedBancoId());

  // Mutually exclusive states rendered inside the blocked overlay
  readonly showLoadingBancos = computed(() => !this.bancosLoaded());
  readonly showBancosLoadError = computed(() => this.bancosLoaded() && this.bancosLoadError());
  readonly showSelectBancoPrompt = computed(() => this.bancosLoaded() && !this.bancosLoadError() && this.hasBancos());
  readonly showCreateBancoPrompt = computed(() => this.bancosLoaded() && !this.bancosLoadError() && !this.hasBancos());

  ngOnInit(): void {
    this.selectedBancoId.set(this.selectedBancoService.currentBancoId);
    this.selectedBancoService.selectedBancoId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => this.selectedBancoId.set(id));

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(e => this.currentUrl.set(e.urlAfterRedirects));

    // Reload the cached bancos list whenever a banco is created/edited/deleted elsewhere in the
    // app, so this persistent (never-destroyed) component doesn't go stale until a page reload.
    this.bancosStateService.changed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadBancos());

    this.loadBancos();
  }

  private loadBancos(): void {
    this.bancosLoadError.set(false);
    this.bancosService.getAll().subscribe({
      next: (bancos) => {
        this.bancos.set(bancos);
        this.bancosLoaded.set(true);
      },
      error: (err: { status?: number }) => {
        // A 401 is handled globally (auth interceptor clears the session and redirects to
        // /entrar) — no need to surface a local error state for it.
        if (err?.status === 401) return;
        this.bancosLoaded.set(true);
        this.bancosLoadError.set(true);
      }
    });
  }

  retryLoadBancos(): void {
    this.bancosLoaded.set(false);
    this.loadBancos();
  }

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar() { this.sidebarOpen.set(false); }
}
