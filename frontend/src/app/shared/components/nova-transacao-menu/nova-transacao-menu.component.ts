import { Component, Input, HostListener, ChangeDetectionStrategy, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Componente de menu suspenso (`dropdown`) rápido para criação de novas transações (despesa, receita ou transferência/pagamento de cartão).
 *
 * @example
 * ```html
 * <app-nova-transacao-menu [showCartaoOptions]="true"></app-nova-transacao-menu>
 * ```
 */
@Component({
  selector: 'app-nova-transacao-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nova-transacao-menu.component.html',
  styleUrls: ['./nova-transacao-menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NovaTransacaoMenuComponent {
  /**
   * Controla a exibição das opções extras relacionadas com transações de cartão de crédito no menu suspenso.
   */
  @Input() showCartaoOptions = false;

  readonly showMenu = signal(false);

  /**
   * Alterna a visibilidade do menu suspenso ao clicar no botão disparador.
   */
  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu.update(v => !v);
  }

  /**
   * Fecha o menu quando ocorre um clique fora do elemento no documento.
   */
  @HostListener('document:click')
  closeMenu(): void {
    this.showMenu.set(false);
  }
}
