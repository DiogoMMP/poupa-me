import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { IconComponent, ICON_NAMES } from '../app/shared/components/icon/icon.component';

@Component({
  selector: 'icon-catalogo',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div style="display: flex; flex-direction: column; gap: 16px; font-family: sans-serif;">
      <input
        type="text"
        placeholder="Pesquisar ícone (ex: arrow, alarm, card)..."
        [value]="query"
        (input)="onQueryChange($any($event.target).value)"
        style="width: 100%; box-sizing: border-box; padding: 10px 14px; border-radius: 8px;
               border: 1px solid var(--brand-border, #334155); background: var(--brand-accent-bg, #0b253a);
               color: var(--brand-text, #e2e8f0); font-size: 14px; outline: none;"
      />
      <p style="margin: 0; font-size: 13px; color: var(--brand-text, #94a3b8); opacity: 0.7;">
        {{ filtered.length }} de {{ total }} ícones
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 12px; max-height: 560px; overflow-y: auto;">
        <div *ngFor="let n of filtered" style="display: flex; flex-direction: column; align-items: center; gap: 6px;
             padding: 12px 8px; border-radius: 8px; border: 1px solid var(--brand-border, rgba(148,163,184,0.15));">
          <app-icon [name]="n" [size]="24" color="currentColor"></app-icon>
          <span style="font-size: 11px; text-align: center; word-break: break-word; color: var(--brand-text, #cbd5e1);">{{ n }}</span>
        </div>
      </div>
    </div>
  `
})
class IconCatalogoComponent {
  readonly total = ICON_NAMES.length;
  query = '';
  filtered: string[] = [...ICON_NAMES];

  onQueryChange(value: string): void {
    this.query = value;
    const q = value.trim().toLowerCase();
    this.filtered = q ? ICON_NAMES.filter(n => n.toLowerCase().includes(q)) : [...ICON_NAMES];
  }
}

const meta: Meta<IconComponent> = {
  title: 'Shared/Icon',
  component: IconComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente de ícones vetoriais em SVG baseado em Dazzle Icons (1.763 ícones). Consulte a story "Catálogo Pesquisável" abaixo para procurar um ícone pelo nome.'
      }
    }
  },
  argTypes: {
    name: {
      control: 'select',
      options: [...ICON_NAMES],
      description: 'Nome em inglês do ícone vetorial.'
    },
    size: {
      control: 'number',
      description: 'Tamanho em pixels ou string CSS.'
    },
    color: {
      control: 'color',
      description: 'Cor do traçado do ícone (por defeito herda via `currentColor`).'
    }
  }
};

export default meta;
type Story = StoryObj<IconComponent>;

/**
 * Ícone padrão exibindo o ícone `Bank` com cor herdada ou personalizada.
 */
export const Default: Story = {
  args: {
    name: 'Bank',
    size: 32,
    color: '#3B82F6'
  }
};

/**
 * Catálogo completo dos 1.763 ícones Dazzle com barra de pesquisa por nome.
 */
export const CatalogoPesquisavel: Story = {
  decorators: [moduleMetadata({ imports: [IconCatalogoComponent] })],
  render: () => ({
    template: `<icon-catalogo></icon-catalogo>`
  })
};

/**
 * Exemplo de variação de tamanhos do componente de ícone.
 */
export const Tamanhos: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 24px; color: #334155; font-family: sans-serif;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <app-icon name="Coins" [size]="16" color="currentColor"></app-icon>
          <span style="font-size: 12px;">16px</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <app-icon name="Coins" [size]="24" color="currentColor"></app-icon>
          <span style="font-size: 12px;">24px</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <app-icon name="Coins" [size]="32" color="currentColor"></app-icon>
          <span style="font-size: 12px;">32px</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <app-icon name="Coins" [size]="48" color="currentColor"></app-icon>
          <span style="font-size: 12px;">48px</span>
        </div>
      </div>
    `
  })
};
