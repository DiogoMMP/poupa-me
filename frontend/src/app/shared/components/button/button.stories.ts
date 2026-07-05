import { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  title: 'Shared/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'outline']
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large']
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    icon: { control: 'text' }
  }
};

export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    icon: 'Plus'
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size" [icon]="icon" [disabled]="disabled" [loading]="loading">Criar Regra</app-button>`
  })
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    size: 'medium',
    icon: 'Trash'
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size" [icon]="icon" [disabled]="disabled" [loading]="loading">Eliminar</app-button>`
  })
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    size: 'medium',
    loading: true
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size" [loading]="loading">A Guardar...</app-button>`
  })
};
