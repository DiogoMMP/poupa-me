import { Component, Input, HostListener, ChangeDetectionStrategy, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  @Input() showCartaoOptions = false;

  readonly showMenu = signal(false);

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu.update(v => !v);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.showMenu.set(false);
  }
}
