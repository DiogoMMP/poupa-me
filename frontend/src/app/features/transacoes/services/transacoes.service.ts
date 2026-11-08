import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {TransacoesDTO, TransacoesInputDTO, TransacoesUpdateDTO, TransacoesReembolsoDTO} from '../dto/transacoes.dto';
import {PaginatedDTO} from '../../../shared/dto/paginated.dto';

/** Optional filters for the account transactions list (`/transacao/all-conta`). */
export interface ContaTransactionsQuery {
  bancoId?: string;
  contaId?: string;
  categoriaId?: string;
  period?: string;
}

/** Optional filters for the credit-card transactions list (`/transacao/all-cartao`). */
export interface CartaoTransactionsQuery {
  bancoId?: string;
  cartaoCreditoId?: string;
  categoriaId?: string;
  status?: string;
  period?: string;
}

@Injectable({providedIn: 'root'})
export class TransacoesService {
  private apiUrl = `${environment.apiBaseUrl}/transacao`;

  constructor(private http: HttpClient) {
  }

  /**
   * Get one page of account transactions (Entrance/Exit). Only the filters that are filled in are sent.
   * @param filters - optional filters (bancoId, contaId, categoriaId, period)
   * @param page - 1-based page number
   * @param pageSize - items per page (10, 25, 50 or 100)
   */
  getContaTransactionsPage(filters: ContaTransactionsQuery, page: number, pageSize: number): Observable<PaginatedDTO<TransacoesDTO>> {
    const params = this.buildPageParams({ ...filters }, page, pageSize);
    return this.http.get<PaginatedDTO<TransacoesDTO>>(`${this.apiUrl}/all-conta`, { params, withCredentials: true });
  }

  /**
   * Get one page of credit-card transactions (Credit/Refund). Only the filters that are filled in are sent.
   * @param filters - optional filters (bancoId, cartaoCreditoId, categoriaId, status, period)
   * @param page - 1-based page number
   * @param pageSize - items per page (10, 25, 50 or 100)
   */
  getCartaoTransactionsPage(filters: CartaoTransactionsQuery, page: number, pageSize: number): Observable<PaginatedDTO<TransacoesDTO>> {
    const params = this.buildPageParams({ ...filters }, page, pageSize);
    return this.http.get<PaginatedDTO<TransacoesDTO>>(`${this.apiUrl}/all-cartao`, { params, withCredentials: true });
  }

  private buildPageParams(filters: Record<string, string | undefined>, page: number, pageSize: number): HttpParams {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return params;
  }

  /**
   * Get all transactions for a banco (5 most recent) optionally filtered by banco id
   * @param bancoId - optional bank id
   */
  getAllByBanco(bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams();
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/all-banco`, { params, withCredentials: true });
  }

  /**
   * Get all monthly expense transactions, optionally filtered by banco
   * @param bancoId - optional bank id
   */
  getDespesaRecorrente(bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams();
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente`, { params, withCredentials: true });
  }

  /**
   * Get monthly expenses filtered by category
   * @param categoriaId - category id
   * @param bancoId - optional bank id
   */
  getDespesaRecorrenteByCategoria(categoriaId: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('categoriaId', categoriaId);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente`, { params, withCredentials: true });
  }

  /**
   * Get monthly expenses filtered by status
   * @param status - status filter
   * @param bancoId - optional bank id
   */
  getDespesaRecorrenteByStatus(status: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('status', status);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente`, { params, withCredentials: true });
  }

  /**
   * Get monthly expenses filtered by period
   * @param period - period label
   * @param bancoId - optional bank id
   */
  getDespesaRecorrenteByPeriod(period: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('period', period);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente`, { params, withCredentials: true });
  }

  /**
   * Get a single transaction by id
   * @param id - transaction id
   */
  getById(id: string): Observable<TransacoesDTO> {
    return this.http.get<TransacoesDTO>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  /**
   * Create an Entrance transaction
   */
  createEntrada(dto: TransacoesInputDTO): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/entrada`, dto, { withCredentials: true });
  }

  /**
   * Create an Exit transaction
   */
  createSaida(dto: TransacoesInputDTO): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/saida`, dto, { withCredentials: true });
  }

  /**
   * Create a Credit transaction
   */
  createCredito(dto: TransacoesInputDTO): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/credito`, dto, { withCredentials: true });
  }

  /**
   * Create a Refund transaction
   */
  createReembolso(dto: TransacoesReembolsoDTO): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/reembolso`, dto, { withCredentials: true });
  }

  /**
   * Conclude a Poupança transaction (mark as Concluído)
   * @param id - transaction id
   */
  concluirPoupanca(id: string): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/poupanca/concluir/${id}`, {}, { withCredentials: true });
  }

  /**
   * Conclude a Despesa Recorrente transaction (mark as Concluído)
   * @param id - transaction id
   */
  concluirDespesaRecorrente(id: string): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/despesa-recorrente/concluir/${id}`, {}, { withCredentials: true });
  }

  /**
   * Update a transaction
   * @param id - transaction id
   * @param dto - update payload
   */
  update(id: string, dto: TransacoesUpdateDTO): Observable<TransacoesDTO> {
    return this.http.patch<TransacoesDTO>(`${this.apiUrl}/${id}`, dto, { withCredentials: true });
  }

  /**
   * Delete a transaction
   * @param id - transaction id
   */
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
