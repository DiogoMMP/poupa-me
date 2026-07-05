import { Meta, StoryObj } from '@storybook/angular';
import { PaginationComponent } from './pagination.component';

const meta: Meta<PaginationComponent> = {
  title: 'Shared/Pagination',
  component: PaginationComponent,
  tags: ['autodocs'],
  argTypes: {
    currentPage: { control: 'number' },
    totalPages: { control: 'number' },
    totalItems: { control: 'number' },
    pageSize: { control: 'number' }
  }
};

export default meta;
type Story = StoryObj<PaginationComponent>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 5,
    totalItems: 48,
    pageSize: 10
  }
};

export const MiddlePage: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
    totalItems: 95,
    pageSize: 10
  }
};
