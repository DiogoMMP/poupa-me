import {Injectable, signal, computed} from '@angular/core';
import {Role} from '../features/auth/services/auth.service';
import type {IconName} from '../shared/components/icon/icon.component';

/**
 * Menu item definition.
 */
export interface MenuItem {
  id: string;
  labelKey: string;
  icon: IconName;
  route?: string;
  roles: Role[];
  children?: MenuItem[];
}

/**
 * Service providing the application menu structure and filtering by user role.
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {

  private all = signal<MenuItem[]>([
    // Home
    {
      id: 'Dashboard',
      labelKey: 'Dashboard',
      icon: 'Gauge',
      route: '/dashboard',
      roles: ['Admin', 'User']
    },

    {
      id: 'Estatísticas',
      labelKey: 'Estatísticas',
      icon: 'ChartBar',
      route: '/estatisticas',
      roles: ['Admin', 'User']
    },

    {
      id: 'Bancos',
      labelKey: 'Bancos',
      icon: 'Bank',
      route: '/bancos',
      roles: ['Admin', 'User']
    },

    {
      id: 'Contas',
      labelKey: 'Contas',
      icon: 'Wallet',
      route: '/contas',
      roles: ['Admin', 'User']
    },

    {
      id: 'Cartões de Crédito',
      labelKey: 'Cartões de Crédito',
      icon: 'CreditCard',
      route: '/cartoes-credito',
      roles: ['Admin', 'User']
    },

    {
      id: 'Transações',
      labelKey: 'Transações',
      icon: 'ArrowDownArrowUp',
      route: '/transacoes',
      roles: ['Admin', 'User']
    },

    {
      id: 'Despesas Recorrentes',
      labelKey: 'Despesas Recorrentes',
      icon: 'Repeat',
      route: '/despesas-recorrentes',
      roles: ['Admin', 'User']
    },

    {
      id: 'Categorias',
      labelKey: 'Categorias',
      icon: 'Tags',
      route: '/categorias',
      roles: ['Admin']
    },

    {
      id: 'Utilizadores',
      labelKey: 'Utilizadores',
      icon: 'Users',
      route: '/utilizadores',
      roles: ['Admin']
    }
  ]);


  /**
   * Returns a computed menu filtered for `role`.
   * Accepts either a Role value or a function (signal/computed) returning a Role;
   * when a function is passed the returned computed will update reactively.
   */
  filteredForRole(role: Role | (() => Role)) {
    return computed(() => {
      const r: Role = typeof role === 'function' ? (role as () => Role)() : role;

      // recursive filter to support arbitrary submenu depth
      const filterItem = (item: MenuItem): MenuItem | undefined => {
        // if item has children, filter them recursively
        const children = item.children?.map(filterItem).filter((c): c is MenuItem => !!c) ?? [];

        // include item if its roles include r or any child remains
        if (item.roles.includes(r) || children.length > 0) {
          // return a shallow copy, only include children when present
          return children.length > 0 ? {...item, children} : {...item, children: undefined};
        }

        return undefined;
      };

      // filter items and their children by role
      return this.all().map(filterItem).filter((it): it is MenuItem => !!it);
    });
  }
}
