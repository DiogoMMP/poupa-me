import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {CategoriasDTO, CategoriasInputDTO} from '../dto/categorias.dto';

@Injectable({providedIn: 'root'})
export class CategoriasService {
  private apiUrl = `${environment.apiBaseUrl}/categoria`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<CategoriasDTO[]> {
    return this.http.get<CategoriasDTO[]>(this.apiUrl, {withCredentials: true});
  }

  getById(id: string): Observable<CategoriasDTO> {
    return this.http.get<CategoriasDTO>(`${this.apiUrl}/${id}`, {withCredentials: true});
  }

  create(dto: CategoriasInputDTO): Observable<CategoriasDTO> {
    return this.http.post<CategoriasDTO>(this.apiUrl, dto, {withCredentials: true});
  }

  update(id: string, dto: CategoriasInputDTO): Observable<CategoriasDTO> {
    return this.http.put<CategoriasDTO>(`${this.apiUrl}/${id}`, dto, {withCredentials: true});
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {withCredentials: true});
  }
}
