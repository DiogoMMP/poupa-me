import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DespesaRecorrenteDTO, CreateDespesaRecorrenteDTO, UpdateDespesaRecorrenteDTO, GerarTransacaoSemValorDTO } from '../dto/despesas-recorrentes.dto';

@Injectable({ providedIn: 'root' })
export class DespesasRecorrentesService {
  private baseUrl = `${environment.apiBaseUrl}/despesa-recorrente`;

  constructor(private http: HttpClient) {}

  /** Get all recurring expense rules for the authenticated user, optionally filtered by bank */
  getAll(bancoId?: string): Observable<DespesaRecorrenteDTO[]> {
    if (bancoId) {
      const params = new HttpParams().set('bancoId', bancoId);
      return this.http.get<DespesaRecorrenteDTO[]>(this.baseUrl, { params, withCredentials: true });
    }
    return this.http.get<DespesaRecorrenteDTO[]>(this.baseUrl, { withCredentials: true });
  }

  /** Get a recurring expense rule by id */
  getById(id: string): Observable<DespesaRecorrenteDTO> {
    return this.http.get<DespesaRecorrenteDTO>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  /** Create a new recurring expense rule */
  create(dto: CreateDespesaRecorrenteDTO): Observable<DespesaRecorrenteDTO> {
    return this.http.post<DespesaRecorrenteDTO>(this.baseUrl, dto, { withCredentials: true });
  }

  /** Update a recurring expense rule */
  update(id: string, dto: UpdateDespesaRecorrenteDTO): Observable<DespesaRecorrenteDTO> {
    return this.http.patch<DespesaRecorrenteDTO>(`${this.baseUrl}/${id}`, dto, { withCredentials: true });
  }

  /** Delete a recurring expense rule */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  /**
   * Get recurring expenses that have both valor and diaDoMes configured and whose origin account belongs to the given bank
   * Matches backend route: GET /despesa-recorrente/com-valor?bancoId=...
   */
  getComValor(bancoId: string): Observable<DespesaRecorrenteDTO[]> {
    const params = new HttpParams().set('bancoId', bancoId);
    return this.http.get<DespesaRecorrenteDTO[]>(`${this.baseUrl}/com-valor`, { params, withCredentials: true });
  }

  /**
   * Get recurring expenses that have no valor/diaDoMes configured (icon/nome only) and whose origin account belongs to the given bank
   * Matches backend route: GET /despesa-recorrente/sem-valor?bancoId=...
   */
  getSemValor(bancoId: string): Observable<DespesaRecorrenteDTO[]> {
    const params = new HttpParams().set('bancoId', bancoId);
    return this.http.get<DespesaRecorrenteDTO[]>(`${this.baseUrl}/sem-valor`, { params, withCredentials: true });
  }

  /**
   * Manually generate a pending transaction for a sem-valor recurring expense.
   * Matches backend route: POST /despesa-recorrente/:id/gerar-transacao
   */
  gerarTransacao(id: string, dto: GerarTransacaoSemValorDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/gerar-transacao`, dto, { withCredentials: true });
  }
}
