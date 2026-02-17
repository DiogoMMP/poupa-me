import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateUserRequest, CreatedUserResponse, UserDTO } from '../features/admin/data/users.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private authBase = '/api/auth';
  private apiBase = '/api';

  // Public registration (POST /api/auth/register)
  register(payload: CreateUserRequest): Observable<CreatedUserResponse> {
    return this.http.post<CreatedUserResponse>(`${this.authBase}/register`, payload);
  }

  // Login (POST /api/auth/login) - returns { user, token? }
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.authBase}/login`, credentials, { withCredentials: true });
  }

  // Logout (POST /api/auth/logout)
  logout(): Observable<any> {
    return this.http.post<any>(`${this.authBase}/logout`, {});
  }

  // Get current authenticated user (GET /api/me)
  getCurrent(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiBase}/me`, { withCredentials: true });
  }

  // Admin: get all users (GET /api/auth)
  getAll(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.authBase);
  }

  // Admin: get user by email (GET /api/auth/by-email?email=...)
  getByEmail(email: string): Observable<UserDTO[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<UserDTO[]>(`${this.authBase}/by-email`, { params });
  }

  // Admin: get user by domain id (GET /api/auth/:id)
  getById(id: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.authBase}/${encodeURIComponent(id)}`);
  }

  // Admin: patch user by email (PATCH /api/auth/:email)
  patchByEmail(email: string, payload: Partial<UserDTO>): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.authBase}/${encodeURIComponent(email)}`, payload);
  }

  // Admin: delete user by email (DELETE /api/auth/:email)
  deleteByEmail(email: string): Observable<void> {
    return this.http.delete<void>(`${this.authBase}/${encodeURIComponent(email)}`);
  }
}
