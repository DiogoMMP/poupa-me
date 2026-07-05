import { Meta, StoryObj } from '@storybook/angular';
import { LoadingCoinComponent } from './loading-coin.component';

const meta: Meta<LoadingCoinComponent> = {
  title: 'Shared/LoadingCoin',
  component: LoadingCoinComponent,
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    size: {
      control: 'select',
      options: ['medium', 'large']
    }
  }
};

export default meta;
type Story = StoryObj<LoadingCoinComponent>;

export const Medium: Story = {
  args: {
    message: 'A carregar transações...',
    size: 'medium'
  }
};

export const Large: Story = {
  args: {
    message: 'A preparar o seu dashboard financeiro...',
    size: 'large'
  }
};
