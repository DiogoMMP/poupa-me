import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EstatisticasDto } from '../dto/estatisticas.dto';

@Injectable({ providedIn: 'root' })
export class EstatisticasService {
  private apiUrl = `${environment.apiBaseUrl}/estatisticas`;

  constructor(private http: HttpClient) {}

  /**
   * Fetch statistics for a given banco.
   * If month/year are omitted, the backend will use the current month (and the "rolling month" behavior when appropriate).
   */
  getEstatisticas(bancoId: string, month?: number, year?: number): Observable<EstatisticasDto> {
    let params = new HttpParams().set('bancoId', bancoId);
    if (month !== undefined) params = params.set('month', String(month));
    if (year !== undefined) params = params.set('year', String(year));
    return this.http.get<EstatisticasDto>(this.apiUrl, { params, withCredentials: true });
  }
}
