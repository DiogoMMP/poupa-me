import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

/**
 * Componente de botão reutilizável com suporte a múltiplas variantes de estilo, estados de carregamento (`loading`), ícones e navegação via `routerLink`.
 *
 * @example
 * ```html
 * <app-button variant="primary" size="medium" icon="Plus" (clicked)="onSave($event)">
 *   Guardar
 * </app-button>
 * ```
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  /**
   * Estilo visual do botão. Define as cores de fundo e borda.
   * Valores aceites: `'primary' | 'secondary' | 'danger' | 'outline'`.
   */
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'outline' = 'primary';

  /**
   * Dimensão do botão em altura e espaçamento interno.
   * Valores aceites: `'small' | 'medium' | 'large'`.
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Tipo nativo do elemento `<button>` HTML gerado.
   */
  @Input() type: 'button' | 'submit' = 'button';

  /**
   * Define se o botão está desativado para interação do utilizador.
   */
  @Input() disabled = false;

  /**
   * Exibe um indicador de carregamento no lugar do ícone habitual e bloqueia cliques enquanto `true`.
   */
  @Input() loading = false;

  /**
   * Nome do ícone Dazzle a exibir antes do texto (ex: `'Plus'`, `'Trash'`, `'Edit'`).
   */
  @Input() icon?: string;

  /**
   * Rota ou array de rotas do Angular Router a navegar quando clicado. Se fornecido, é gerada uma tag `<a>`.
   */
  @Input() routerLink?: string | any[];

  /**
   * Evento emitido quando o utilizador clica no botão (e não está em estado `disabled` ou `loading`).
   */
  @Output() clicked = new EventEmitter<MouseEvent>();

  /**
   * Manipulador do clique que verifica se o botão está habilitado antes de emitir o evento `clicked`.
   */
  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
