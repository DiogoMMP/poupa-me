import { Meta, StoryObj } from '@storybook/angular';
import { SemValorSectionComponent } from './sem-valor-section.component';

const meta: Meta<SemValorSectionComponent> = {
  title: 'Shared/SemValorSection',
  component: SemValorSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    items: { control: 'object' }
  }
};

export default meta;
type Story = StoryObj<SemValorSectionComponent>;

export const Default: Story = {
  args: {
    label: 'Despesas Recorrentes Sem Valor',
    items: [
      { id: '10', userId: 'user1', bancoId: 'banco1', nome: 'Subscrição Netflix Pendente', tipo: 'Despesa', temValor: false },
      { id: '11', userId: 'user1', bancoId: 'banco1', nome: 'Reembolso Seguro Saúde', tipo: 'Receita', temValor: false }
    ] as any
  }
};
