import { Meta, StoryObj } from '@storybook/angular';
import { NovaTransacaoMenuComponent } from '../app/shared/components/nova-transacao-menu/nova-transacao-menu.component';

const meta: Meta<NovaTransacaoMenuComponent> = {
  title: 'Shared/NovaTransacaoMenu',
  component: NovaTransacaoMenuComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Botão com menu suspenso de acesso rápido para o registo de novas transações financeiras. Suporta opções adicionais quando são utilizados cartões de crédito.'
      }
    }
  },
  argTypes: {
    showCartaoOptions: {
      control: 'boolean',
      description: 'Ativa links/opções específicas para operações de cartão de crédito.'
    }
  }
};

export default meta;
type Story = StoryObj<NovaTransacaoMenuComponent>;

/**
 * Menu padrão contendo opções de nova despesa e nova receita.
 */
export const Default: Story = {
  args: {
    showCartaoOptions: false
  }
};

/**
 * Menu com opções de cartão ativas (`showCartaoOptions: true`).
 */
export const ComOpcoesDeCartao: Story = {
  args: {
    showCartaoOptions: true
  }
};
