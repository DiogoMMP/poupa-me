import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

/**
 * Componente unificado de cartão de entidade para exibição de contas, bancos, cartões de crédito, categorias ou regras recorrentes.
 * Suporta ícones (em emoji ou nomes Dazzle via `app-icon`), rotas de edição/ação e botão de exclusão.
 *
 * @example
 * ```html
 * <app-entity-card icon="Bank" title="Santander" value="Saldo: 1.500,00 €" [showDelete]="true" (deleteClicked)="onDelete()">
 * </app-entity-card>
 * ```
 */
@Component({
  selector: 'app-entity-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './entity-card.component.html',
  styleUrls: ['./entity-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class EntityCardComponent {
  /**
   * Ícone a exibir no cabeçalho do cartão. Pode ser um emoji (ex: `🏦`) ou nome de ícone Dazzle.
   */
  @Input() icon?: string;

  /**
   * Título principal da entidade exibida no cartão (ex: `'Banco Santander'` ou `'Alimentação'`).
   */
  @Input() title!: string;

  /**
   * Valor ou descrição complementar exibido sob o título (ex: `'Saldo: 1 250,00 €'`).
   */
  @Input() value?: string;

  /**
   * Rota do Angular Router para navegação ao clicar no botão/link de edição (`Editar`).
   */
  @Input() editRoute?: string | any[];

  /**
   * Texto de rótulo para a ação primária ou de edição. Padrão: `'Editar'`.
   */
  @Input() editText = 'Editar';

  /**
   * Ícone Dazzle opcional para acompanhar o botão de edição.
   */
  @Input() editIcon?: string;

  /**
   * Rota opcional para uma ação secundária personalizada no cartão.
   */
  @Input() actionRoute?: string | any[];

  /**
   * Texto para o botão de ação secundária (se `actionRoute` ou `actionClicked` forem configurados).
   */
  @Input() actionText?: string;

  /**
   * Ícone Dazzle opcional para o botão de ação secundária.
   */
  @Input() actionIcon?: string;

  /**
   * Controla a visibilidade do botão de eliminação (`Eliminar`).
   */
  @Input() showDelete = false;

  /**
   * Texto personalizado para o botão de exclusão. Padrão: `'Eliminar'`.
   */
  @Input() deleteText = 'Eliminar';

  /**
   * Controla a exibição da barra inferior de ações (edição, exclusão, ações customizadas).
   */
  @Input() showActions = true;

  /**
   * Evento emitido quando a ação secundária do cartão é clicada sem rota atribuída.
   */
  @Output() actionClicked = new EventEmitter<void>();

  /**
   * Evento emitido quando o utilizador clica no botão de eliminação do cartão.
   */
  @Output() deleteClicked = new EventEmitter<void>();
}
