import { Meta, StoryObj } from '@storybook/angular';
import { PaginationComponent } from '../app/shared/components/pagination/pagination.component';

const meta: Meta<PaginationComponent> = {
  title: 'Shared/Pagination',
  component: PaginationComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Controlo de navegação paginada para listas longas e tabelas da aplicação. Apresenta botões de navegação anterior/seguinte e contagem total.'
      }
    }
  },
  argTypes: {
    currentPage: {
      control: 'number',
      description: 'Página atual selecionada.'
    },
    totalItems: {
      control: 'number',
      description: 'Total absoluto de registos.'
    },
    pageSize: {
      control: 'number',
      description: 'Quantidade de registos exibidos por página.'
    }
  }
};

export default meta;
type Story = StoryObj<PaginationComponent>;

/**
 * Paginação na primeira página com 48 itens no total (5 páginas calculadas).
 */
export const Default: Story = {
  args: {
    currentPage: 1,
    totalItems: 48,
    pageSize: 10
  }
};

/**
 * Paginação numa página intermédia (página 3 de 10).
 */
export const MiddlePage: Story = {
  args: {
    currentPage: 3,
    totalItems: 95,
    pageSize: 10
  }
};
