import { Meta, StoryObj } from '@storybook/angular';
import { IconComponent } from './icon.component';

const meta: Meta<IconComponent> = {
  title: 'Shared/Icon',
  component: IconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: ['Bank', 'CreditCard', 'User', 'Trash', 'Edit', 'Plus', 'Check', 'Wallet', 'Tag', 'TrendingUp', 'Coins', 'ChevronLeft', 'ChevronRight', 'Shield']
    },
    size: {
      control: 'number'
    },
    color: {
      control: 'color'
    }
  }
};

export default meta;
type Story = StoryObj<IconComponent>;

export const Bank: Story = {
  args: {
    name: 'Bank',
    size: 32,
    color: '#3498db'
  }
};

export const CreditCard: Story = {
  args: {
    name: 'CreditCard',
    size: 32,
    color: '#2ecc71'
  }
};

export const User: Story = {
  args: {
    name: 'User',
    size: 32,
    color: '#9b59b6'
  }
};
