import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {ContasDto, ContasInputDTO, ContasUpdateDTO} from '../dto/contas.dto';

@Injectable({providedIn: 'root'})
export class ContasService {
  private apiUrl = `${environment.apiBaseUrl}/conta`;

  constructor(private http: HttpClient) {
  }

  getAll(bancoId?: string): Observable<ContasDto[]> {
    const options: { params?: HttpParams; withCredentials?: boolean } = { withCredentials: true };
    if (bancoId) {
      options.params = new HttpParams().set('bancoId', bancoId);
    }

    return this.http.get<ContasDto[]>(this.apiUrl, options);
  }

  getById(id: string): Observable<ContasDto> {
    return this.http.get<ContasDto>(`${this.apiUrl}/${id}`, {withCredentials: true});
  }

  create(dto: ContasInputDTO): Observable<ContasDto> {
    return this.http.post<ContasDto>(this.apiUrl, dto, {withCredentials: true});
  }

  update(id: string, dto: ContasUpdateDTO): Observable<ContasDto> {
    return this.http.patch<ContasDto>(`${this.apiUrl}/${id}`, dto, {withCredentials: true});
  }

  /**
   * Soft-deletes a conta. Without `cascade`, the backend answers 409 when it still has cartões or rules that depend on it.
   */
  delete(id: string, cascade = false): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {withCredentials: true, params: cascade ? {cascade: 'true'} : {}});
  }
}
