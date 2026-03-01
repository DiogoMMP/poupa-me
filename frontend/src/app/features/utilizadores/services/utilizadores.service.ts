import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from '../../admin/data/users.model';
import { EditarUtilizadorDTO, UtilizadorDTO } from '../dto/utilizadores.dto';

@Injectable({ providedIn: 'root' })
export class UtilizadoresService {
  private http = inject(HttpClient);
  private authBase = '/api/auth';
  private apiBase = '/api';

  // Logout (POST /api/auth/logout)
  logout(): Observable<any> {
    return this.http.post<any>(`${this.authBase}/logout`, {});
  }

  // Get current authenticated user (GET /api/me)
  getCurrent(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiBase}/me`, { withCredentials: true });
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
