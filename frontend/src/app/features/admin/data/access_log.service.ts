import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult, AccessLogItem } from './access_log.model';

/**
 * Service for accessing access log data.
 */
@Injectable({ providedIn: 'root' })
export class AccessLogService {
  private http = inject(HttpClient);
  private baseUrl = '/api/AccessLog';

  /**
   * Gets a paged list of access log items.
   * @param page - The page number to retrieve.
   * @param pageSize - The number of items per page.
   * @returns An observable of a paged result containing access log items.
   */
  get(page = 1, pageSize = 50): Observable<PagedResult<AccessLogItem>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResult<AccessLogItem>>(this.baseUrl, { params, withCredentials: true });
  }
}
