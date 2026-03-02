import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EditarUtilizadorDTO, UtilizadorDTO } from '../dto/utilizadores.dto';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UtilizadoresService {
  private http = inject(HttpClient);
  private authBase = `${environment.apiBaseUrl}/auth`;
  private apiBase = environment.apiBaseUrl;

  // Logout (POST /api/auth/logout)
  logout(): Observable<any> {
    return this.http.post<any>(`${this.authBase}/logout`, {});
  }

  // Get current authenticated user (GET /api/me)
  getCurrent(): Observable<UtilizadorDTO> {
    return this.http.get<UtilizadorDTO>(`${this.apiBase}/me`, { withCredentials: true });
  }

  getAll(): Observable<UtilizadorDTO[]> {
    return this.http.get<UtilizadorDTO[]>(this.authBase);
  }

  toggleRole(email: string, payload: EditarUtilizadorDTO): Observable<UtilizadorDTO> {
    return this.http.patch<UtilizadorDTO>(`${this.authBase}/${encodeURIComponent(email)}/role`, payload);
  }

  deleteByEmail(email: string): Observable<void> {
    return this.http.delete<void>(`${this.authBase}/${encodeURIComponent(email)}`);
  }
}
