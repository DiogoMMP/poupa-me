import { Meta, StoryObj } from '@storybook/angular';
import { PaginationComponent } from '../app/shared/components/pagination/pagination.component';

const meta: Meta<PaginationComponent> = {
  title: 'Shared/Pagination',
  component: PaginationComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Controlo de navegação paginada para listas longas e tabelas da aplicação. Apresenta botões de navegação anterior/seguinte, a página atual sobre o total de páginas, um seletor de itens por página (10/25/50/100) e o total de itens.'
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
 * Paginação com o número de páginas vindo da API e um tamanho de página de 25 escolhido no seletor.
 */
export const WithPageSizeSelector: Story = {
  args: {
    currentPage: 2,
    totalItems: 87,
    pageSize: 25,
    totalPagesInput: 4,
    pageSizeOptions: [10, 25, 50, 100]
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
