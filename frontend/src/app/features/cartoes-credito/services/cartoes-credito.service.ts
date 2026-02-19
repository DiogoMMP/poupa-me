import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {CartoesCreditoDTO, CartoesCreditoInputDTO, CartoesCreditoUpdateDTO, ExtratoCartaoDTO} from '../dto/cartoes-credito.dto';

@Injectable({providedIn: 'root'})
export class CartoesCreditoService {
  private apiUrl = `${environment.apiBaseUrl}/cartao`;

  constructor(private http: HttpClient) {
  }

  getAll(bancoId?: string): Observable<CartoesCreditoDTO[]> {
    const options: { params?: HttpParams; withCredentials?: boolean } = { withCredentials: true };
    if (bancoId) {
      options.params = new HttpParams().set('bancoId', bancoId);
    }

    return this.http.get<CartoesCreditoDTO[]>(this.apiUrl, options);
  }

  getById(id: string): Observable<CartoesCreditoDTO> {
    return this.http.get<CartoesCreditoDTO>(`${this.apiUrl}/${id}`, {withCredentials: true});
  }

  create(dto: CartoesCreditoInputDTO): Observable<CartoesCreditoDTO> {
    return this.http.post<CartoesCreditoDTO>(this.apiUrl, dto, {withCredentials: true});
  }

  update(id: string, dto: CartoesCreditoUpdateDTO): Observable<CartoesCreditoDTO> {
    return this.http.patch<CartoesCreditoDTO>(`${this.apiUrl}/${id}`, dto, {withCredentials: true});
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {withCredentials: true});
  }

  getExtrato(id: string): Observable<ExtratoCartaoDTO> {
    return this.http.get<ExtratoCartaoDTO>(`${this.apiUrl}/${id}/extrato`, {withCredentials: true});
  }
}
