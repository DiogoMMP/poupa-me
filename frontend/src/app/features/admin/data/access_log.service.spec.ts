import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccessLogService } from './access_log.service';
import { PagedResult, AccessLogItem } from './access_log.model';

/**
 * Unit tests for AccessLogService.
 */
describe('AccessLogService', () => {
  let service: AccessLogService;
  let httpMock: HttpTestingController;
  const base = '/api/AccessLog';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccessLogService]
    });

    service = TestBed.inject(AccessLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('get() should GET /api/AccessLog with default page=1&pageSize=50 and include credentials', done => {
    const expected: PagedResult<AccessLogItem> = {
      total: 1,
      page: 1,
      pageSize: 50,
      items: [
        { id: 1, timestamp: '2025-01-01T00:00:00Z', userName: 'Admin', role: 'Admin', method: 'GET', path: '/x', statusCode: 200, remoteIp: '::1' }
      ]
    };

    service.get().subscribe(res => {
      expect(res).toEqual(expected);
      done();
    });

    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    // HttpParams are strings
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('50');
    // ensure cookies are sent for auth
    expect(req.request.withCredentials).toBeTrue();

    req.flush(expected);
  });

  it('get(page,pageSize) should send correct query params', done => {
    const page = 3;
    const pageSize = 25;

    service.get(page, pageSize).subscribe(res => {
      expect(res.page).toBe(page);
      expect(res.pageSize).toBe(pageSize);
      done();
    });

    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('page')).toBe(String(page));
    expect(req.request.params.get('pageSize')).toBe(String(pageSize));

    const payload: PagedResult<AccessLogItem> = { total: 0, page, pageSize, items: [] };
    req.flush(payload);
  });

  it('get() should handle empty items array', done => {
    service.get().subscribe(res => {
      expect(res.total).toBe(0);
      expect(Array.isArray(res.items)).toBeTrue();
      expect(res.items.length).toBe(0);
      done();
    });

    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('50');
    req.flush({ total: 0, page: 1, pageSize: 50, items: [] } as PagedResult<AccessLogItem>);
  });
});
