import { Meta, StoryObj } from '@storybook/angular';
import { EntityCardComponent } from '../app/shared/components/entity-card/entity-card.component';
import { ICON_NAMES } from '../app/shared/components/icon/icon.component';

const meta: Meta<EntityCardComponent> = {
  title: 'Shared/EntityCard',
  component: EntityCardComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Cartão de exibição unificado para entidades da aplicação Poupa-me, como bancos, contas, categorias e cartões. Integra ações de edição, exclusão e ícones interativos.'
      }
    }
  },
  argTypes: {
    icon: {
      control: 'text',
      description: 'Emoji ou nome de ícone Dazzle a exibir.'
    },
    title: {
      control: 'text',
      description: 'Nome ou título principal da entidade.'
    },
    value: {
      control: 'text',
      description: 'Saldo, limite ou detalhe da entidade.'
    },
    editText: {
      control: 'text',
      description: 'Texto do botão de edição.'
    },
    showDelete: {
      control: 'boolean',
      description: 'Controla a exibição do botão de eliminação.'
    },
    deleteText: {
      control: 'text',
      description: 'Texto do botão de eliminação.'
    }
  }
};

export default meta;
type Story = StoryObj<EntityCardComponent>;

/**
 * Cartão padrão representando uma conta bancária com opção de eliminação ativa.
 */
export const Default: Story = {
  args: {
    icon: '🏦',
    title: 'Banco Santander',
    value: 'Saldo total: 1 250,00 €',
    editRoute: ['/bancos/editar', 1],
    showDelete: true
  }
};

/**
 * Cartão de cartão de crédito sem opção de exclusão exibida (`showDelete: false`).
 */
export const WithoutDelete: Story = {
  args: {
    icon: '💳',
    title: 'Cartão de Crédito Gold',
    value: 'Limite: 5 000,00 €',
    editRoute: ['/cartoes/editar', 1],
    showDelete: false
  }
};

/**
 * Cartão utilizando um ícone vetorial Dazzle (`Bank`) ao invés de emoji.
 */
export const ComIconeDazzle: Story = {
  args: {
    icon: 'Bank',
    title: 'Conta Poupança Mais',
    value: 'Acumulado: 12 400,00 €',
    editRoute: ['/contas/editar', 2],
    showDelete: true
  }
};
