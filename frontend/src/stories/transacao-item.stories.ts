import { Meta, StoryObj } from '@storybook/angular';
import { TransacaoItemComponent } from '../app/shared/components/transacao-item/transacao-item.component';

const meta: Meta<TransacaoItemComponent> = {
  title: 'Shared/TransacaoItem',
  component: TransacaoItemComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Linha de representação visual de uma transação financeira na lista de movimentações. Aplica cores automáticas para entradas e saídas e inclui acções de edição, conclusão rápida ou exclusão.'
      }
    }
  },
  argTypes: {
    transacao: {
      control: 'object',
      description: 'Modelo de dados completo da transação financeira.'
    },
    showActions: {
      control: 'boolean',
      description: 'Visibilidade dos botões de ação interativa (editar/excluir).'
    },
    showConcluir: {
      control: 'boolean',
      description: 'Ativa o botão de ação rápida de conclusão para transações pendentes.'
    },
    isBusy: {
      control: 'boolean',
      description: 'Indica processamento em curso na transação atual.'
    }
  }
};

export default meta;
type Story = StoryObj<TransacaoItemComponent>;

/**
 * Representação de uma transação de despesa (`Saída`) no supermercado.
 */
export const Despesa: Story = {
  args: {
    transacao: {
      id: '1',
      userId: 'u1',
      dia: 28,
      mes: 6,
      ano: 2026,
      descricao: 'Supermercado Continente',
      valor: 85.40,
      moeda: 'EUR',
      tipo: 'Saída',
      categoria: { id: 'cat1', nome: 'Alimentação', icon: '🛒' },
      status: 'Concluído',
      conta: {
        id: 'c1',
        nome: 'Conta à Ordem',
        icon: '🏦'
      }
    },
    showActions: true
  }
};

/**
 * Representação de uma transação de receita (`Entrada`) referente a salário.
 */
export const Receita: Story = {
  args: {
    transacao: {
      id: '2',
      userId: 'u1',
      dia: 25,
      mes: 6,
      ano: 2026,
      descricao: 'Salário Mensal',
      valor: 2450.00,
      moeda: 'EUR',
      tipo: 'Entrada',
      categoria: { id: 'cat2', nome: 'Salário', icon: '💶' },
      status: 'Concluído',
      conta: {
        id: 'c2',
        nome: 'Conta Poupança',
        icon: '🏦'
      }
    },
    showActions: true
  }
};

/**
 * Transação em estado de processamento (`isBusy: true`).
 */
export const EmProcessamento: Story = {
  args: {
    transacao: {
      id: '3',
      userId: 'u1',
      dia: 1,
      mes: 7,
      ano: 2026,
      descricao: 'Pagamento Eletricidade',
      valor: 64.20,
      moeda: 'EUR',
      tipo: 'Saída',
      categoria: { id: 'cat3', nome: 'Contas e Serviços', icon: '⚡' },
      status: 'Pendente',
      conta: {
        id: 'c1',
        nome: 'Conta à Ordem',
        icon: '🏦'
      },
      cartaoCredito: {
        id: 'cc1',
        nome: 'Cartão Gold',
        icon: '💳'
      }
    },
    showActions: true,
    showConcluir: true,
    isBusy: true
  }
};
