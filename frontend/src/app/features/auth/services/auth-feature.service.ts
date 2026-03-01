import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginDTO, RegisterDTO, AuthResponseDTO } from '../dto/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthFeatureService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/auth`;

  login(dto: LoginDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.base}/login`, dto, { withCredentials: true });
  }

  register(dto: RegisterDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.base}/register`, dto, { withCredentials: true });
  }
}

