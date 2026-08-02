import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de carregamento visual reutilizável que apresenta uma animação de moeda a rodar em 3D.
 *
 * @example
 * ```html
 * <app-loading-coin message="A carregar transações..." size="large"></app-loading-coin>
 * ```
 */
@Component({
  selector: 'app-loading-coin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-coin.component.html',
  styleUrls: ['./loading-coin.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingCoinComponent {
  /**
   * Mensagem informativa exibida abaixo da animação da moeda.
   */
  @Input() message: string = 'A carregar...';

  /**
   * Dimensão da moeda e do texto. Valores suportados: `'medium' | 'large'`.
   */
  @Input() size: 'medium' | 'large' = 'medium';
}
