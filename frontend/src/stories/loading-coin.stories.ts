import { Meta, StoryObj } from '@storybook/angular';
import { LoadingCoinComponent } from '../app/shared/components/loading-coin/loading-coin.component';

const meta: Meta<LoadingCoinComponent> = {
  title: 'Shared/LoadingCoin',
  component: LoadingCoinComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Indicador visual de carregamento da aplicação com animação 3D de uma moeda em rotação. Ideal para painéis de dados, modais ou transições de rota.'
      }
    }
  },
  argTypes: {
    message: {
      control: 'text',
      description: 'Texto descritivo do carregamento.'
    },
    size: {
      control: 'select',
      options: ['medium', 'large'],
      description: 'Dimensão do spinner da moeda.'
    }
  }
};

export default meta;
type Story = StoryObj<LoadingCoinComponent>;

/**
 * Carregamento de tamanho médio com mensagem padrão.
 */
export const Medium: Story = {
  args: {
    message: 'A carregar transações...',
    size: 'medium'
  }
};

/**
 * Carregamento de tamanho grande para ecrãs inteiros ou dashboards principais.
 */
export const Large: Story = {
  args: {
    message: 'A preparar o seu dashboard financeiro...',
    size: 'large'
  }
};
