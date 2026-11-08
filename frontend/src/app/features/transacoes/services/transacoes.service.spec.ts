import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TransacoesService } from './transacoes.service';
import { PaginatedDTO } from '../../../shared/dto/paginated.dto';
import { TransacoesDTO } from '../dto/transacoes.dto';

describe('TransacoesService (paginação)', () => {
  let service: TransacoesService;
  let httpMock: HttpTestingController;

  const emptyPage: PaginatedDTO<TransacoesDTO> = { items: [], page: 2, pageSize: 25, totalPages: 0, totalItems: 0 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransacoesService]
    });
    service = TestBed.inject(TransacoesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getContaTransactionsPage sends page, pageSize and only the filled-in filters to /all-conta', () => {
    service.getContaTransactionsPage(
      { bancoId: 'BNC1', contaId: '', categoriaId: 'CAT1', period: 'Este Mês' }, 2, 25
    ).subscribe(result => expect(result).toEqual(emptyPage));

    const req = httpMock.expectOne(r => r.url === `${environment.apiBaseUrl}/transacao/all-conta`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('25');
    expect(req.request.params.get('bancoId')).toBe('BNC1');
    expect(req.request.params.get('categoriaId')).toBe('CAT1');
    expect(req.request.params.get('period')).toBe('Este Mês');
    expect(req.request.params.has('contaId')).toBeFalse();
    req.flush(emptyPage);
  });

  it('getCartaoTransactionsPage sends every filter combined to /all-cartao', () => {
    service.getCartaoTransactionsPage(
      { bancoId: 'BNC1', cartaoCreditoId: 'CC1', categoriaId: 'CAT1', status: 'Pendente', period: '' }, 1, 10
    ).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiBaseUrl}/transacao/all-cartao`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('cartaoCreditoId')).toBe('CC1');
    expect(req.request.params.get('status')).toBe('Pendente');
    expect(req.request.params.has('period')).toBeFalse();
    req.flush({ ...emptyPage, page: 1, pageSize: 10 });
  });
});
