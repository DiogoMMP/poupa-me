import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {BancosDto, BancosInputDTO, BancosUpdateDTO} from '../dto/bancos.dto';
import {DashboardDTO} from '../dto/dashboard.dto';

@Injectable({providedIn: 'root'})
export class BancosService {
  private apiUrl = `${environment.apiBaseUrl}/banco`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<BancosDto[]> {
    return this.http.get<BancosDto[]>(this.apiUrl, {withCredentials: true});
  }

  getById(id: string): Observable<BancosDto> {
    return this.http.get<BancosDto>(`${this.apiUrl}/${id}`, {withCredentials: true});
  }

  getDashboardData(id: string): Observable<DashboardDTO> {
    return this.http.get<DashboardDTO>(`${this.apiUrl}/${id}/dashboard`, {withCredentials: true});
  }

  create(dto: BancosInputDTO): Observable<BancosDto> {
    return this.http.post<BancosDto>(this.apiUrl, dto, {withCredentials: true});
  }

  update(id: string, dto: BancosUpdateDTO): Observable<BancosDto> {
    return this.http.patch<BancosDto>(`${this.apiUrl}/${id}`, dto, {withCredentials: true});
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {withCredentials: true});
  }
}
