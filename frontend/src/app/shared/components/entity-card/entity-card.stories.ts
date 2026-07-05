import { Meta, StoryObj } from '@storybook/angular';
import { EntityCardComponent } from './entity-card.component';

const meta: Meta<EntityCardComponent> = {
  title: 'Shared/EntityCard',
  component: EntityCardComponent,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    title: { control: 'text' },
    value: { control: 'text' },
    editText: { control: 'text' },
    showDelete: { control: 'boolean' },
    deleteText: { control: 'text' }
  }
};

export default meta;
type Story = StoryObj<EntityCardComponent>;

export const Default: Story = {
  args: {
    icon: '🏦',
    title: 'Banco Santander',
    value: 'Saldo total: 1 250,00 €',
    editRoute: ['/bancos/editar', 1],
    showDelete: true
  }
};

export const WithoutDelete: Story = {
  args: {
    icon: '💳',
    title: 'Cartão de Crédito Gold',
    value: 'Limite: 5 000,00 €',
    editRoute: ['/cartoes/editar', 1],
    showDelete: false
  }
};
