import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {TransacoesDTO, TransacoesInputDTO, TransacoesUpdateDTO, TransacoesReembolsoDTO} from '../dto/transacoes.dto';

@Injectable({providedIn: 'root'})
export class TransacoesService {
  private apiUrl = `${environment.apiBaseUrl}/transacao`;

  constructor(private http: HttpClient) {
  }

  /**
   * Get transactions for a specific account (Entrance/Exit)
   * @param contaId - account id
   */
  getContaTransactions(contaId: string): Observable<TransacoesDTO[]> {
    const params = new HttpParams().set('contaId', contaId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/conta`, { params, withCredentials: true });
  }

  /**
   * Get transactions for a specific credit card (Credit/Refund)
   * @param cartaoCreditoId - credit card id
   */
  getCartaoTransactions(cartaoCreditoId: string): Observable<TransacoesDTO[]> {
    const params = new HttpParams().set('cartaoCreditoId', cartaoCreditoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/cartao`, { params, withCredentials: true });
  }

  /**
   * Get all account transactions (Entrance/Exit) optionally filtered by bank id
   * @param bancoId - optional bank id
   */
  getAllContaTransactions(bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams();
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/all-conta`, { params, withCredentials: true });
  }

  /**
   * Get all credit-card transactions (Credit/Refund) optionally filtered by bank id
   * @param bancoId - optional bank id
   */
  getAllCartaoTransactions(bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams();
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/all-cartao`, { params, withCredentials: true });
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
   * Get account transactions filtered by category
   * @param categoriaId - category id
   * @param bancoId - optional bank id
   */
  getContaTransactionsByCategoria(categoriaId: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('categoriaId', categoriaId);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/conta/by-categoria`, { params, withCredentials: true });
  }

  /**
   * Get credit-card transactions filtered by category
   * @param categoriaId - category id
   * @param bancoId - optional bank id
   */
  getCartaoTransactionsByCategoria(categoriaId: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('categoriaId', categoriaId);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/cartao/by-categoria`, { params, withCredentials: true });
  }

  /**
   * Get monthly expenses filtered by category
   * @param categoriaId - category id
   * @param bancoId - optional bank id
   */
  getDespesaRecorrenteByCategoria(categoriaId: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('categoriaId', categoriaId);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente/by-categoria`, { params, withCredentials: true });
  }

  /**
   * Get credit-card transactions filtered by status
   * @param status - transaction status
   * @param bancoId - optional bank id
   */
  getCartaoTransactionsByStatus(status: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('status', status);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/cartao/by-status`, { params, withCredentials: true });
  }

  /**
   * Get monthly expenses filtered by status
   * @param status - status filter
   * @param bancoId - optional bank id
   */
  getDespesaRecorrenteByStatus(status: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('status', status);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente/by-status`, { params, withCredentials: true });
  }

  /**
   * Get account transactions filtered by period
   * @param period - period label
   * @param bancoId - optional bank id
   */
  getContaTransactionsByPeriod(period: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('period', period);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/conta/by-period`, { params, withCredentials: true });
  }

  /**
   * Get credit-card transactions filtered by period
   * @param period - period label
   * @param bancoId - optional bank id
   */
  getCartaoTransactionsByPeriod(period: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('period', period);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/cartao/by-period`, { params, withCredentials: true });
  }

  /**
   * Get monthly expenses filtered by period
   * @param period - period label
   * @param bancoId - optional bank id
   */
  getDespesaRecorrenteByPeriod(period: string, bancoId?: string): Observable<TransacoesDTO[]> {
    let params = new HttpParams().set('period', period);
    if (bancoId) params = params.set('bancoId', bancoId);
    return this.http.get<TransacoesDTO[]>(`${this.apiUrl}/despesa-recorrente/by-period`, { params, withCredentials: true });
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
   * Create a Poupança (savings) transfer
   */
  createPoupanca(dto: TransacoesInputDTO): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/poupanca`, dto, { withCredentials: true });
  }

  /**
   * Conclude a Poupança transaction (mark as Concluído)
   * @param id - transaction id
   */
  concluirPoupanca(id: string): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/poupanca/concluir/${id}`, {}, { withCredentials: true });
  }

  /**
   * Create a monthly expense entry
   */
  createDespesaMensal(dto: TransacoesInputDTO): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/despesa-mensal`, dto, { withCredentials: true });
  }

  /**
   * Conclude a Despesa Mensal transaction (mark as Concluído)
   * @param id - transaction id
   */
  concluirDespesaMensal(id: string): Observable<TransacoesDTO> {
    return this.http.post<TransacoesDTO>(`${this.apiUrl}/despesa-mensal/concluir/${id}`, {}, { withCredentials: true });
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
