import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PerfilDTO, AtualizarPerfilDTO } from '../dto/perfil.dto';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private authBase = `${environment.apiBaseUrl}/auth`;

  // GET /api/auth/:id — returns the full user with email
  getCurrent(): Observable<PerfilDTO> {
    const id = this.auth.user()?.id ?? '';
    return this.http.get<PerfilDTO>(
      `${this.authBase}/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }

  // PATCH /api/auth/:email — update name and/or password
  update(email: string, payload: AtualizarPerfilDTO): Observable<PerfilDTO> {
    return this.http.patch<PerfilDTO>(
      `${this.authBase}/${encodeURIComponent(email)}`,
      payload,
      { withCredentials: true }
    );
  }
}
