import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_NAMES, ICON_REGISTRY, IconName } from './icon-registry';

export { ICON_NAMES, ICON_REGISTRY, type IconName } from './icon-registry';

/**
 * Componente de ícone reutilizável em SVG que suporta todos os 1.763 ícones da biblioteca Dazzle Icons.
 * Ideal para ser utilizado com a cor `currentColor` para herdar o tom do texto do contentor pai ou com cores específicas.
 *
 * @example
 * ```html
 * <app-icon name="Bank" [size]="24" color="currentColor"></app-icon>
 * ```
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  /**
   * Nome do ícone correspondente ao vetor SVG do Dazzle Icons (ex: `'Bank'`, `'CreditCard'`, `'User'`, etc.).
   * Consulte o catálogo `Lista` no Storybook para visualizar todos os 1.763 ícones disponíveis.
   */
  @Input() name: IconName = 'Bank';

  /**
   * Tamanho do ícone em pixels (ex: `24` ou `'24px'`).
   */
  @Input() size: number | string = 24;

  /**
   * Cor de preenchimento/traçado do ícone (ex: `'#3B82F6'` ou `'currentColor'`).
   */
  @Input() color: string = 'currentColor';

  /**
   * Retorna o tamanho formatado em string, garantindo sufixo `px` quando é número.
   */
  get formattedSize(): string {
    return typeof this.size === 'number' ? `${this.size}px` : this.size;
  }

  /**
   * Retorna o conteúdo SVG interno seguro e dinâmico associado ao ícone solicitado.
   */
  get svgInnerHtml(): SafeHtml {
    const raw = ICON_REGISTRY[String(this.name)] || ICON_REGISTRY['Info'] || '';
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }
}
