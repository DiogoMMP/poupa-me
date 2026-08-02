import { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from '../app/shared/components/button/button.component';
import { ICON_NAMES } from '../app/shared/components/icon/icon.component';

const meta: Meta<ButtonComponent> = {
  title: 'Shared/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Botão versátil de interface da aplicação. Aceita variantes de cor, controlo de tamanho, suporte a ícones do catálogo Dazzle e estado de carregamento dinâmico.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'outline'],
      description: 'Variante de cor/estilo do botão.'
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Tamanho e padding do botão.'
    },
    disabled: { control: 'boolean', description: 'Ativa ou desativa a interatividade.' },
    loading: { control: 'boolean', description: 'Mostra o spinner de carregamento.' },
    icon: {
      control: 'select',
      options: [undefined, ...ICON_NAMES],
      description: 'Ícone a exibir ao lado do texto.'
    }
  }
};

export default meta;
type Story = StoryObj<ButtonComponent>;

/**
 * Botão primário com ícone de adição (`Plus`). Padrão para acções principais como criação de transações ou regras.
 */
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

/**
 * Botão secundário de apoio para acções alternativas ou cancelamentos.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'medium',
    icon: 'Edit'
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size" [icon]="icon" [disabled]="disabled" [loading]="loading">Editar Entidade</app-button>`
  })
};

/**
 * Botão de perigo (`danger`) com ícone do caixote do lixo (`Trash`) para ações destrutivas ou irreversíveis.
 */
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

/**
 * Botão com contorno (`outline`) útil para ações neutras em barras de ferramentas ou filtros.
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'medium',
    icon: 'Filter'
  },
  render: (args) => ({
    props: args,
    template: `<app-button [variant]="variant" [size]="size" [icon]="icon" [disabled]="disabled" [loading]="loading">Filtrar Dados</app-button>`
  })
};

/**
 * Estado de carregamento do botão, onde o ícone normal é substituído por um spinner interativo.
 */
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
