import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { CartoesCreditoService } from '../../services/cartoes-credito.service';
import { NotificationService } from '../../../../services/notification.service';
import { CartoesCreditoModel } from '../../models/cartoes-credito.model';
import { CartoesCreditoMapper } from '../../mappers/cartoes-credito.mapper';
import { AuthService } from '../../../../services/auth.service';
import { SelectedBancoService } from '../../../../services/selected-banco.service';
import { ContasService } from '../../../contas/services/contas.service';
import { ExtratoCartaoDTO } from '../../dto/cartoes-credito.dto';

/**
 * ViewModel for the lister component of Cartões. Responsible for loading the list of cartões
 * filtered by the banco selected in the header, and loading extrato details for each cartão.
 */
@Injectable()
export class CartoesCreditoListViewModel {
  private service = inject(CartoesCreditoService);
  private contasService = inject(ContasService);
  private notification = inject(NotificationService);
  public auth = inject(AuthService);
  private selectedBanco = inject(SelectedBancoService);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly cartoes$ = new BehaviorSubject<CartoesCreditoModel[]>([]);

  // Map to store extrato details per cartão ID
  private extratosMap = new Map<string, ExtratoCartaoDTO>();
  // Map to store payment account (conta) names by conta ID (used as the payment account for cards)
  private contasNamesMap = new Map<string, string>();
  // Map to cache percentage used per cartão (computed from extrato endpoint)
  private percentMap = new Map<string, number>();

  /**
   * Expose whether a banco is selected for template checks (e.g., show create button)
   */
  get hasBancoSelected(): boolean {
    return !!this.selectedBanco.currentBancoId;
  }

  constructor() {
    // Recarregar automaticamente sempre que o banco selecionado mudar
    this.selectedBanco.selectedBancoId$.subscribe(bancoId => {
      this.loadCartoes(bancoId);
    });
  }

  /**
   * Loads cartões for the optionally provided bancoId. If bancoId is undefined/null, it will
   * clear the list (or optionally load all cartões if that is desired).
   */
  loadCartoes(bancoId?: string | null): void {
    this.isLoading$.next(true);

    // If no banco selected, clear list and stop
    if (!bancoId) {
      this.cartoes$.next([]);
      this.extratosMap.clear();
      this.contasNamesMap.clear();
      this.isLoading$.next(false);
      return;
    }

    // Load cartões filtered by bancoId
    this.service.getAll(bancoId).subscribe({
      next: (dtos) => {
        const models = CartoesCreditoMapper.toModelArray(dtos);
        this.cartoes$.next(models);

        // Load extratos and payment account names for all cartões
        this.loadDetalhes(models, bancoId);
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar cartões');
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Load extrato details for all cartões and payment account names
   */
  private loadDetalhes(cartoes: CartoesCreditoModel[], bancoId: string): void {
    if (cartoes.length === 0) {
      this.isLoading$.next(false);
      return;
    }

    // Reset maps for fresh load
    this.extratosMap.clear();
    this.percentMap.clear();

    // Load payment accounts to get names
    this.contasService.getAll(bancoId).subscribe({
      next: (contas) => {
        contas.forEach(conta => {
          if (conta.id) {
            this.contasNamesMap.set(conta.id, conta.nome);
          }
        });
      },
      error: () => {
        // Silent fail loading payment account names
      }
    });

    // Load extratos for all cartões
    const extratoRequests = cartoes.map(cartao =>
      this.service.getExtrato(cartao.id)
    );

    forkJoin(extratoRequests).subscribe({
      next: (extratos) => {
        extratos.forEach((extrato, index) => {
          const cartao = cartoes[index];
          this.extratosMap.set(cartao.id, extrato);

          // Precompute percentage using extrato.saldoAtual when available
          const limite = cartao.limiteCredito?.valor ?? 0;
          const saldoAtualFromExtrato = extrato?.saldoAtual?.valor;
          const saldo = typeof saldoAtualFromExtrato === 'number' ? saldoAtualFromExtrato : (cartao.saldoUtilizado?.valor ?? 0);

          let percent = 0;
          if (limite && limite > 0) {
            percent = (saldo / limite) * 100;
            if (!isFinite(percent) || isNaN(percent)) percent = 0;
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;
          }

          this.percentMap.set(cartao.id, Math.round(percent));
        });
        this.isLoading$.next(false);
      },
      error: () => {
        // If extrato loading fails, still show cartões
        this.isLoading$.next(false);
      }
    });
  }

  /**
   * Get extrato details for a specific cartão
   */
  getExtrato(cartaoId: string): ExtratoCartaoDTO | null {
    return this.extratosMap.get(cartaoId) || null;
  }

  /**
   * Get conta name by conta ID
   */
  getContaNome(contaId: string | null): string {
    if (!contaId) return '-';
    return this.contasNamesMap.get(contaId) || '-';
  }

  getValorAPagar(cartaoId: string): number {
    const extrato = this.extratosMap.get(cartaoId);
    if (!extrato) return 0;
    return extrato.saldoAtual?.valor ?? 0;
  }

  /**
   * Calculate percentage of credit limit used
   */
  getPercentagemUtilizada(cartao: CartoesCreditoModel): number {
    // First prefer cached computed percentage from extrato endpoint
    const cached = this.percentMap.get(cartao.id);
    if (typeof cached === 'number') return cached;

    // Fallback to using extrato map if present
    const extrato = this.extratosMap.get(cartao.id);
    const limite = cartao.limiteCredito?.valor ?? 0;
    if (!limite || limite === 0) return 0;

    const saldoAtualFromExtrato = extrato?.saldoAtual?.valor;
    // Fallback to the cartao model's saldoUtilizado if extrato not yet loaded
    const saldo = typeof saldoAtualFromExtrato === 'number' ? saldoAtualFromExtrato : (cartao.saldoUtilizado?.valor ?? 0);

    let percent = (saldo / limite) * 100;
    if (!isFinite(percent) || isNaN(percent)) return 0;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    return Math.round(percent);
  }

  /**
   * Format date to dd/MM/yyyy
   */
  formatDate(isoDate: string | undefined | null): string {
    if (!isoDate) {
      console.warn('[CartoesCreditoListViewModel] formatDate - Missing date');
      return '-';
    }
    try {
      const date = new Date(isoDate);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('[CartoesCreditoListViewModel] formatDate - Invalid date:', isoDate);
        return '-';
      }
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('[CartoesCreditoListViewModel] formatDate - Error formatting date:', isoDate, error);
      return '-';
    }
  }

  /**
   * Deletes a cartão by id after confirming with the user. If the deletion is successful, it reloads the data to reflect
   * the changes.
   * @param id The id of the cartão to delete
   */
  deleteCartao(id: string): void {
    if (!id) return;

    // simple confirmation
    if (!confirm('Tem a certeza que pretende eliminar este Cartão?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.notification.success('Cartão eliminado');
        // reload current banco selection
        this.loadCartoes(this.selectedBanco.currentBancoId);
      },
      error: (err) => {
        console.error('[FRONTEND] CartoesCreditoListViewModel.deleteCartao - Error:', err);
        this.notification.error('Falha ao eliminar cartão');
      }
    });
  }
}
