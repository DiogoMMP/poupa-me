import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CategoriasDTO} from '../categorias/dto/categorias.dto';

@Injectable({providedIn: 'root'})
export class IaCategorizacaoService {
  private apiUrl = `${environment.apiBaseUrl}/ia-categorizacao`;

  constructor(private http: HttpClient) {
  }

  sugerir(transacao: string): Observable<CategoriasDTO> {
    const params = new HttpParams().set('description', transacao);
    return this.http.get<CategoriasDTO>(`${this.apiUrl}/sugerir`, { params, withCredentials: true });
  }
}
