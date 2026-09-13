import { Component, Input, ChangeDetectionStrategy, inject, signal, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import type { IconName } from './icon-names';

export { ICON_NAMES } from './icon-names';
export type { IconName } from './icon-names';

/**
 * O mapa nome->SVG (`ICON_REGISTRY`) tem ~2.3MB (1.763 ícones). É carregado com `import()` dinâmico,
 * em vez de import estático, para que não entre no bundle inicial (eager) da app só por causa de
 * `NavComponent`/`FooterComponent` usarem `<app-icon>` fora de qualquer rota lazy — fica antes num
 * chunk assíncrono próprio, pedido uma única vez e partilhado por todas as instâncias.
 */
let registryPromise: Promise<Record<string, string>> | null = null;
function loadIconRegistry(): Promise<Record<string, string>> {
  if (!registryPromise) {
    registryPromise = import('./icon-registry').then(m => m.ICON_REGISTRY);
  }
  return registryPromise;
}

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
export class IconComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);

  /**
   * Nome do ícone correspondente ao vetor SVG do Dazzle Icons (ex: `'Bank'`, `'CreditCard'`, `'User'`, etc.).
   * Consulte "Icon > Catalogo Pesquisavel" no Storybook para visualizar todos os 1.763 ícones disponíveis.
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

  private readonly svgHtml = signal<SafeHtml>(this.sanitizer.bypassSecurityTrustHtml(''));

  /**
   * Retorna o tamanho formatado em string, garantindo sufixo `px` quando é número.
   */
  get formattedSize(): string {
    return typeof this.size === 'number' ? `${this.size}px` : this.size;
  }

  /**
   * Retorna o conteúdo SVG interno seguro, atualizado assim que o registo de ícones (carregado de
   * forma assíncrona) resolve.
   */
  get svgInnerHtml(): SafeHtml {
    return this.svgHtml();
  }

  ngOnChanges(): void {
    const requestedName = this.name;
    loadIconRegistry().then(registry => {
      if (this.name !== requestedName) return; // `name` já mudou entretanto; ignora resposta obsoleta
      const raw = registry[String(requestedName)] || registry['Info'] || '';
      this.svgHtml.set(this.sanitizer.bypassSecurityTrustHtml(raw));
    });
  }
}
