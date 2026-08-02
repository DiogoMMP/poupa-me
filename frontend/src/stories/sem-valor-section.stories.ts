import { Meta, StoryObj } from '@storybook/angular';
import { SemValorSectionComponent } from '../app/shared/components/sem-valor-section/sem-valor-section.component';

const meta: Meta<SemValorSectionComponent> = {
  title: 'Shared/SemValorSection',
  component: SemValorSectionComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Painel de alerta visual para itens que requerem atenção ou preenchimento de valor financeiro (por exemplo, subscrições flutuantes ou despesas pendentes de verificação).'
      }
    }
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Título de destaque da secção.'
    },
    items: {
      control: 'object',
      description: 'Array de objetos DespesaRecorrenteModel.'
    }
  }
};

export default meta;
type Story = StoryObj<SemValorSectionComponent>;

/**
 * Secção exibindo dois itens pendentes sem montante fixado.
 */
export const Default: Story = {
  args: {
    label: 'Despesas Recorrentes Sem Valor',
    items: [
      { id: '10', userId: 'user1', bancoId: 'banco1', nome: 'Subscrição Netflix Pendente', tipo: 'Despesa', temValor: false },
      { id: '11', userId: 'user1', bancoId: 'banco1', nome: 'Reembolso Seguro Saúde', tipo: 'Receita', temValor: false }
    ] as any
  }
};

/**
 * Estado vazio quando não existem itens com alertas.
 */
export const Vazio: Story = {
  args: {
    label: 'Despesas Recorrentes Sem Valor',
    items: []
  }
};
