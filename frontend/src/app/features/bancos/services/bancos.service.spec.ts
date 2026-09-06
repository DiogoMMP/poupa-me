import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { BancosService } from './bancos.service';
import { DashboardDTO } from '../dto/dashboard.dto';

describe('BancosService', () => {
  let service: BancosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BancosService]
    });
    service = TestBed.inject(BancosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getDashboardData should GET /dashboard/{id}, not /banco/{id}/dashboard', () => {
    const bancoId = 'BNC00000000001';
    const dashboard: DashboardDTO = { saldoGlobal: 0, detalhePorBanco: [] };

    service.getDashboardData(bancoId).subscribe(result => {
      expect(result).toEqual(dashboard);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/dashboard/${bancoId}`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(dashboard);
  });
});
