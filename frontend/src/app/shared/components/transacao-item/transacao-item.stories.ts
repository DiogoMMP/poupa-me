import { Meta, StoryObj } from '@storybook/angular';
import { TransacaoItemComponent } from './transacao-item.component';

const meta: Meta<TransacaoItemComponent> = {
  title: 'Shared/TransacaoItem',
  component: TransacaoItemComponent,
  tags: ['autodocs'],
  argTypes: {
    transacao: { control: 'object' },
    showActions: { control: 'boolean' }
  }
};

export default meta;
type Story = StoryObj<TransacaoItemComponent>;

export const Despesa: Story = {
  args: {
    transacao: {
      id: '1',
      userId: 'u1',
      bancoId: 'b1',
      descricao: 'Supermercado Continente',
      valor: 85.40,
      tipo: 'Saída',
      data: '2026-06-28',
      categoriaId: 'cat1',
      contaId: 'c1'
    } as any,
    showActions: true
  }
};

export const Receita: Story = {
  args: {
    transacao: {
      id: '2',
      userId: 'u1',
      bancoId: 'b1',
      descricao: 'Salário Mensal',
      valor: 2450.00,
      tipo: 'Entrada',
      data: '2026-06-25',
      categoriaId: 'cat2',
      contaId: 'c2'
    } as any,
    showActions: true
  }
};
