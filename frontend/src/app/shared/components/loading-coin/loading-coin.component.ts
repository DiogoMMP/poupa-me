import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de carregamento visual reutilizável: apresenta o ícone `Loader` (raios tipo relógio de
 * sol) da Dazzle Icons, com cada raio a acender em sequência (efeito estilo iOS/macOS).
 *
 * Os 8 raios são desenhados como `<line>` separados (mesmas coordenadas do ícone `Loader` da
 * biblioteca) em vez de usar `<app-icon>`, porque o ícone original vem como um único `<path>` — não
 * dá para animar cada raio isoladamente a partir de HTML injetado em bruto.
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
   * Mensagem informativa exibida abaixo do ícone de loading.
   */
  @Input() message: string = 'A carregar...';

  /**
   * Dimensão do ícone e do texto. Valores suportados: `'medium' | 'large'`.
   */
  @Input() size: 'medium' | 'large' = 'medium';

  /**
   * Tamanho em pixels do ícone, derivado de `size`.
   */
  get iconSize(): number {
    return this.size === 'large' ? 64 : 40;
  }
}
