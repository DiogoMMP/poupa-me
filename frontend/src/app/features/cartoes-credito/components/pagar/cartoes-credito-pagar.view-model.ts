import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { CartoesCreditoService } from '../../services/cartoes-credito.service';
import { NotificationService } from '../../../../services/notification.service';
import { CartoesCreditoModel } from '../../models/cartoes-credito.model';
import { CartoesCreditoMapper } from '../../mappers/cartoes-credito.mapper';
import { ExtratoCartaoDTO } from '../../dto/cartoes-credito.dto';

/**
 * Simplified ViewModel for the Cartões Pagar component.
 * Only responsibilities:
 * - load card by id
 * - compute default periodo for pagar
 * - call pagar endpoint
 */
@Injectable()
export class CartoesCreditoPagarViewModel {
  private service = inject(CartoesCreditoService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // State
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  readonly cartao$ = new BehaviorSubject<CartoesCreditoModel | null>(null);
  readonly extrato$ = new BehaviorSubject<ExtratoCartaoDTO | null>(null);

  constructor() {}

  /**
   * Loads the card data by ID and updates the state accordingly.
   * @param id
   */
  loadData(id: string): void {
    if (!id) return;
    this.isLoading$.next(true);

    this.service.getById(id).subscribe({
      next: (dto) => {
        const model = CartoesCreditoMapper.toModel(dto);
        this.cartao$.next(model);

        this.service.getExtrato(id).subscribe({
          next: (extrato) => {
            this.extrato$.next(extrato);
            this.isLoading$.next(false);
          },
          error: () => {
            this.isLoading$.next(false);
          }
        });
      },
      error: (_err) => {
        this.notification.error('Falha ao carregar cartão');
        this.isLoading$.next(false);
        this.router.navigate(['/cartoes-credito']);
      }
    });
  }

  /**
   * Compute default periodo ISO strings for the pagar form based on the cartao's current periodo.fecho.
   * Default start = day after current fecho. Default end = start + 1 month - 1 day.
   * Returns { dataInicioISO, dataFimISO } where ISO is yyyy-MM-dd suitable for <input type="date">.
   */
  computeDefaultPeriodoISO(cartao: CartoesCreditoModel): { dataInicioISO: string; dataFimISO: string } | null {
    if (!cartao || !cartao.periodo || !cartao.periodo.dataFim) return null;
    const fecho = new Date(cartao.periodo.dataFim);
    if (isNaN(fecho.getTime())) return null;

    // start = day after fecho
    const start = new Date(fecho.getTime());
    start.setDate(start.getDate() + 1);

    // end = start + 1 month - 1 day
    const end = new Date(start.getTime());
    const startMonth = end.getMonth();
    end.setMonth(end.getMonth() + 1);
    // if adding month rolled over day (e.g., Jan 31 -> Mar 3), adjust by setting to last day of previous month
    if (end.getMonth() !== ((startMonth + 1) % 12)) {
      // set to last day of the target month
      end.setDate(0); // day 0 of month -> last day of previous month
    }
    // now subtract 1 day to make it end = start + 1 month - 1 day
    end.setDate(end.getDate() - 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    return { dataInicioISO: toISODate(start), dataFimISO: toISODate(end) };
  }

  /**
   * Submits a pagar request for the cartão. The form gives periodo as ISO date strings (yyyy-MM-dd) so we need
   * to parse them into {dia, mes, ano} structures expected by the API PeriodoDTO.
   */
  submitPagar(id: string, periodoRaw: { dataInicio: string; dataFim: string }): void {
    if (!id) return;
    if (!periodoRaw || !periodoRaw.dataInicio || !periodoRaw.dataFim) {
      this.notification.error('Periodo inválido');
      return;
    }

    // parse yyyy-MM-dd or other
    const parseParts = (isoOrStr: string) => {
      const m = String(isoOrStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return { dia: Number(m[3]), mes: Number(m[2]), ano: Number(m[1]) };
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return null;
      return { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
    };

    const inicio = parseParts(periodoRaw.dataInicio);
    const fim = parseParts(periodoRaw.dataFim);
    if (!inicio || !fim) {
      this.notification.error('Datas inválidas. Use o selector de datas para definir o período.');
      return;
    }

    const payload: any = { novoPeriodo: { inicio, fecho: fim } };

    this.isLoading$.next(true);
    this.service.pagar(id, payload).subscribe({
      next: () => {
        this.notification.success('Cartão pago com sucesso!');
        this.isLoading$.next(false);
        this.router.navigate(['/cartoes-credito']);
      },
      error: (err) => {
        console.error('[FRONTEND] pagar erro', err);
        this.notification.error('Falha ao pagar o cartão!');
        this.isLoading$.next(false);
      }
    });
  }
}
