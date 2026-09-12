import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

/**
 * Diálogo de confirmação da app, exibido pelo ConfirmDialogService no lugar do `confirm()` nativo
 * do browser. Montado uma única vez no layout, junto a `<app-notifications>`.
 *
 * Usa botões próprios (não `app-button`) para não puxar o registo de 1.763 ícones Dazzle
 * (importado por `app-button`/`app-icon`) para o bundle inicial — este componente está montado
 * no layout raiz, carregado em todas as rotas, ao contrário das features onde `app-button` é
 * usado hoje (todas lazy-loaded).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  svc = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.request()) {
      this.svc.resolve(false);
    }
  }

  onCancel(): void {
    this.svc.resolve(false);
  }

  onConfirm(): void {
    this.svc.resolve(true);
  }
}
