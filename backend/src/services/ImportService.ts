import { Service, Inject } from 'typedi';
import { Result } from '../core/logic/Result.js';
import type IImportService from './IServices/IImportService.js';
import type IContaRepo from '../repos/IRepos/IContaRepo.js';
import type ITransacaoRepo from '../repos/IRepos/ITransacaoRepo.js';
import type ICategoriaRepo from '../repos/IRepos/ICategoriaRepo.js';
import type ICartaoCreditoRepo from '../repos/IRepos/ICartaoCreditoRepo.js';
import { Conta } from '../domain/Conta/Entities/Conta.js';
import { Transacao } from '../domain/Transacao/Entities/Transacao.js';
import { Categoria } from '../domain/Categoria/Entities/Categoria.js';
import { CartaoCredito } from '../domain/CartaoCredito/Entities/CartaoCredito.js';
import { Nome } from '../domain/Shared/ValueObjects/Nome.js';
import { Icon } from '../domain/Shared/ValueObjects/Icon.js';
import { Dinheiro } from '../domain/Shared/ValueObjects/Dinheiro.js';
import { Data } from '../domain/Shared/ValueObjects/Data.js';
import { Descricao } from '../domain/Transacao/ValueObjects/Descricao.js';
import { Tipo } from '../domain/Shared/ValueObjects/Tipo.js';
import { Status } from '../domain/Transacao/ValueObjects/Status.js';
import { Periodo } from '../domain/CartaoCredito/ValueObjects/Periodo.js';
import { UniqueEntityID } from '../core/domain/UniqueEntityID.js';

/**
 * Service for importing CSV data from Notion exports into the system.
 * Handles dirty data cleanup and transformation into domain entities.
 */
@Service()
export default class ImportService implements IImportService {
    constructor(
        @Inject('ContaRepo') private contaRepo: IContaRepo,
        @Inject('TransacaoRepo') private transacaoRepo: ITransacaoRepo,
        @Inject('CategoriaRepo') private categoriaRepo: ICategoriaRepo,
        @Inject('CartaoCreditoRepo') private cartaoRepo: ICartaoCreditoRepo,
        @Inject('logger') private logger: { error: (...args: unknown[]) => void; info: (...args: unknown[]) => void }
    ) {}

    // --- HELPER FUNCTIONS ---

    private parseCurrency(value: string): number {
        if (!value) return 0;
        let cleaned = value
            .replace(/€/g, '')
            .replace(/\s+/g, '')
            .replace(/<[^>]*>/g, '')
            .trim();
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        const monthMap: Record<string, number> = {
            'janeiro': 0, 'fevereiro': 1, 'marco': 2, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
            'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
        };
        const cleaned = dateStr.replace(/<[^>]*>/g, '').trim().toLowerCase();
        const match = cleaned.match(/(\d{1,2})\s+de\s+([\w\u00C0-\u024F]+)\s+de\s+(\d{4})/);
        if (!match || match.length < 4) return null;

        const day = parseInt(match[1] || '0', 10);
        const monthName = match[2] || '';
        const year = parseInt(match[3] || '0', 10);
        const monthIndex = monthMap[monthName];

        if (monthIndex === undefined) return null;
        return new Date(year, monthIndex, day);
    }

    private cleanName(name: string): string {
        if (!name) return '';
        let cleaned = name.normalize('NFC').replace(/<[^>]*>/g, '');
        cleaned = cleaned.replace(/\([^)]*\)/g, '');
        return cleaned.trim();
    }

    private parseCSV(csvContent: string): string[][] {
        if (!csvContent) return [];
        const lines = csvContent.split(/\r?\n/);
        const result: string[][] = [];
        for (const line of lines) {
            if (!line.trim()) continue;
            const row: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') { inQuotes = !inQuotes; }
                else if (char === ',' && !inQuotes) { row.push(current.trim()); current = ''; }
                else { current += char; }
            }
            row.push(current.trim());
            result.push(row);
        }
        return result;
    }

    // --- CONSTANTS ---

    /** Names that are always treated as Monthly Expense (one per month, Exit + Entry pair) */
    private readonly DESPESA_MENSAL_NAMES = [
        'vodafone', 'luz', 'água', 'agua', 'gás', 'gas',
        'seguro multirriscos', 'seguro de recheio', 'prestação da casa', 'prestacao da casa',
        'nos pais', 'associação vencedora', 'associacao vencedora', 'associacao', 'associação', 'seguro vida'
    ];

    private isDespesaMensalName(name: string): boolean {
        const lower = name.normalize('NFC').toLowerCase().trim();
        return this.DESPESA_MENSAL_NAMES.some(dm => {
            const dmNorm = dm.normalize('NFC').toLowerCase();
            // Exact match, or the name starts with the keyword followed by a space/punctuation
            // (prevents 'gas' from matching 'gasolina', 'gás' from matching 'gás natural station', etc.)
            return lower === dmNorm || lower.startsWith(dmNorm + ' ') || lower.startsWith(dmNorm + '-');
        });
    }

    /** Names that are always treated as Savings (savings transfer, one per month) */
    private readonly POUPANCA_NAMES = ['conta poupança', 'conta poupanca'];

    private isPoupancaName(name: string): boolean {
        const lower = name.toLowerCase().trim();
        return this.POUPANCA_NAMES.some(p => lower === p || lower.startsWith(p));
    }

    // --- IMPORT METHODS ---

    public async importContas(csvContent: string, userId: string, bancoId?: string): Promise<Result<void>> {
        try {
            const rows = this.parseCSV(csvContent);
            if (rows.length < 2) return Result.fail<void>('Empty CSV');

            const dataRows = rows.slice(1);
            const existingContas = await this.contaRepo.findAll(userId);
            const existingCartoes = await this.cartaoRepo.findAll(userId);

            for (const row of dataRows) {
                const contaName = this.cleanName(row[0] || '');
                const totalStr = row[6] || row[5] || '';

                if (!contaName) continue;

                const balance = this.parseCurrency(totalStr);
                const isCard = contaName.toLowerCase().includes('cartão') || contaName.toLowerCase().includes('cartao');

                // Use account name as icon (e.g., "Continente.jpg")
                const iconName = `${contaName}.jpg`;

                if (isCard) {
                    // Create or update credit card (CartaoCredito)
                    // When bancoId is given, only match cards within the same bank
                    const existingCartao = existingCartoes.find(c => {
                        if (c.nome.value.toLowerCase() !== contaName.toLowerCase()) return false;
                        if (bancoId) return c.bancoId === bancoId;
                        return true;
                    });

                    if (!existingCartao) {
                        // Create new CartaoCredito
                        // Default: credit limit = balance * 2 (or reasonable default)
                        const limiteCredito = Dinheiro.create(Math.max(balance * 2, 1000), 'EUR');
                        const saldoUtilizado = Dinheiro.create(balance, 'EUR');
                        const nome = Nome.create(contaName);
                        const icon = Icon.create(iconName);

                        // Default period: current month
                        const now = new Date();
                        const inicio = Data.createFromParts(1, now.getMonth() + 1, now.getFullYear(), true);
                        const fecho = Data.createFromParts(28, now.getMonth() + 1, now.getFullYear(), true);
                        const periodo = Periodo.create(inicio.getValue(), fecho.getValue());

                        if (limiteCredito.isSuccess && saldoUtilizado.isSuccess && nome.isSuccess && icon.isSuccess && periodo.isSuccess) {
                            const novoCartao = CartaoCredito.create({
                                userId: new UniqueEntityID(userId),
                                nome: nome.getValue(),
                                icon: icon.getValue(),
                                limiteCredito: limiteCredito.getValue(),
                                saldoUtilizado: saldoUtilizado.getValue(),
                                periodo: periodo.getValue(),
                                contaPagamentoId: null,
                                bancoId: bancoId,
                            });
                            if (novoCartao.isSuccess) {
                                const saved = await this.cartaoRepo.save(novoCartao.getValue());
                                existingCartoes.push(saved);
                            }
                        }
                    }
                } else {
                    // Create or update Account (Conta)
                    // When bancoId is given, only match accounts within the same bank
                    const existingConta = existingContas.find(c => {
                        if (c.nome.value.toLowerCase() !== contaName.toLowerCase()) return false;
                        if (bancoId) return c.bancoId === bancoId;
                        return true;
                    });

                    if (!existingConta) {
                        const novoSaldo = Dinheiro.create(balance, 'EUR');
                        const nome = Nome.create(contaName);
                        const icon = Icon.create(iconName);

                        if (novoSaldo.isSuccess && nome.isSuccess && icon.isSuccess) {
                            const novaConta = Conta.create({
                                userId: new UniqueEntityID(userId),
                                nome: nome.getValue(),
                                icon: icon.getValue(),
                                saldo: novoSaldo.getValue(),
                                bancoId: bancoId,
                            });
                            if (novaConta.isSuccess) {
                                const saved = await this.contaRepo.save(novaConta.getValue());
                                existingContas.push(saved);
                            }
                        }
                    }
                }
            }
            return Result.ok<void>();
        } catch (error) {
            this.logger.error('ImportContas error: %o', error);
            return Result.fail<void>('Error importing accounts');
        }
    }

    public async importEntradas(csvContent: string, userId: string, periodo?: { inicio: Date; fim: Date }, bancoId?: string): Promise<Result<void>> {
        return this.importTransacoes(csvContent, userId, 'entradas', periodo, undefined, undefined, undefined, bancoId);
    }

    public async importSaidas(csvContent: string, userId: string, entradasVistas?: Set<string>, bancoId?: string): Promise<Result<void>> {
        return this.importTransacoes(csvContent, userId, 'saidas', undefined, entradasVistas, undefined, undefined, bancoId);
    }

    /**
     * Imports entries and exits together, sharing session state for correct status detection.
     * This method processes entries first, then exits using the collected session state.
     */
    public async importTransacoesCompleto(
        entradasCsv: string | undefined,
        saidasCsv: string | undefined,
        userId: string,
        periodo?: { inicio: Date; fim: Date },
        bancoId?: string
    ): Promise<Result<string[]>> {
        const entradasVistas = new Set<string>();
        const results: string[] = [];

        // Pre-parse saidas rows so entradas can look up cartao for Reembolso (include header row)
        const saidasAllRows = saidasCsv ? this.parseCSV(saidasCsv) : [];
        const saidasRows = saidasAllRows.slice(1);

        if (entradasCsv) {
            const r = await this.importTransacoes(entradasCsv, userId, 'entradas', periodo, entradasVistas, saidasRows, saidasAllRows[0], bancoId);
            if (r.isFailure) return Result.fail<string[]>(`Entradas: ${r.error}`);
            results.push('entradas');
        }

        if (saidasCsv) {
            const r = await this.importTransacoes(saidasCsv, userId, 'saidas', undefined, entradasVistas, undefined, undefined, bancoId);
            if (r.isFailure) return Result.fail<string[]>(`Saídas: ${r.error}`);
            results.push('saídas');
        }

        return Result.ok<string[]>(results);
    }

    /**
     * Unified method to import transactions (entries or exits).
     * 'entradasVistas' is a session-level set of keys used to match entries when processing exits.
     */
    private async importTransacoes(
        csvContent: string,
        userId: string,
        fileType: 'entradas' | 'saidas',
        periodo?: { inicio: Date; fim: Date },
        entradasVistas?: Set<string>,
        saidasRows?: string[][],
        saidasHeader?: string[],
        bancoId?: string
    ): Promise<Result<void>> {
        try {
            const rows = this.parseCSV(csvContent);
            if (rows.length < 2) return Result.fail<void>('Empty CSV');

            const existingCategorias = await this.categoriaRepo.findAll();
            // Load accounts filtered by bank (strict: only accounts belonging to the given bank).
            // Also load ALL user accounts so that shared/virtual accounts like "Despesas Mensais" and
            // "Conta Poupança" (which have no banco_id) are always found when needed.
            const existingContasBanco = bancoId ? await this.contaRepo.findAll(userId, bancoId) : await this.contaRepo.findAll(userId);
            const allUserContas = await this.contaRepo.findAll(userId);
            // existingContas is used for finding source accounts: prefer bank-specific, but special
            // accounts (no bancoId) from allUserContas are also included for Despesas Mensais / Poupança.
            const bancoContaIds = new Set(existingContasBanco.map(c => c.id.toString()));
            const existingContas = [
                ...existingContasBanco,
                // Include accounts with no bancoId (shared/virtual) from the full list
                ...allUserContas.filter(c => !bancoContaIds.has(c.id.toString()) && !c.bancoId)
            ];
            const existingCartoes = await this.cartaoRepo.findAll(userId, bancoId);
            const allTransacoes = await this.transacaoRepo.findAll(userId);

            // Session set to accumulate seen entries/exits for status matching
            const entradasVistasSessao: Set<string> = entradasVistas ?? new Set<string>();

            // Pre-scan of the 'saidas' CSV to collect monthly-expense exits from the "Despesas Mensais" account.
            // When such exits are present, the corresponding Saldo Real exit + Despesas Mensais exit pair should be
            // considered completed (status = 'Concluído'). The pre-scan collects keys of those expenses.
            const saidasDespesasMensaisVistas = new Set<string>();
            if (fileType === 'saidas') {
                const dataRowsPreScan = rows.slice(1);
                for (const row of dataRowsPreScan) {
                    const nomeRow = this.cleanName(row[0] || '');
                    const contaRow = this.cleanName(row[2] || '');
                    const dataRow = row[3] || '';
                    if (!nomeRow || !contaRow) continue;
                    if (!this.isDespesaMensalName(nomeRow)) continue;
                    const dateRow = this.parseDate(dataRow);
                    if (!dateRow) continue;
                    const extractedContaName = (contaRow.split('(')[0] ?? contaRow).trim().toLowerCase();
                    // If this line references the "Despesas Mensais" account, mark the expense as having an exit there
                    if (extractedContaName.includes('despesas mensais')) {
                        const key = `${nomeRow.toLowerCase()}|${dateRow.getMonth() + 1}|${dateRow.getFullYear()}`;
                        saidasDespesasMensaisVistas.add(key);
                    }
                }
            }

            const headers = (rows[0] || []).map(h => h.toLowerCase().trim());
            const valorColIndex = headers.indexOf('valor');
            const saiuColIndex = headers.indexOf('saiu?');

            const dataRows = rows.slice(1);

            for (const row of dataRows) {
                const nome = this.cleanName(row[0] || '');
                const categoriaStr = this.cleanName(row[1] || 'Sem Categoria');
                const contaStr = this.cleanName(row[2] || '');
                const dataStr = row[3] || '';

                // Use the "Valor" column if found in headers, otherwise fall back to previous hardcoded indices
                const saiuStr = fileType === 'entradas' ? ((saiuColIndex >= 0 ? row[saiuColIndex] : row[6]) || '').toLowerCase() : '';
                const valorStr = valorColIndex >= 0
                    ? (row[valorColIndex] || '')
                    : (fileType === 'entradas' ? (row[7] || '') : (row[5] || ''));

                if (!nome || !contaStr || !valorStr) continue;

                const valor = this.parseCurrency(valorStr);
                const date = this.parseDate(dataStr);
                if (!date) continue;

                // Find or create category
                let categoria = existingCategorias.find(c => c.nome.value.toLowerCase() === categoriaStr.toLowerCase());
                if (!categoria) {
                    const defaultIcon = fileType === 'entradas' ? '📁' : '💸';
                    const newCatOrError = Categoria.create({
                        nome: Nome.create(categoriaStr).getValue(),
                        icon: Icon.create(defaultIcon).getValue()
                    });
                    if (newCatOrError.isSuccess) {
                        categoria = await this.categoriaRepo.save(newCatOrError.getValue());
                        existingCategorias.push(categoria);
                    }
                }

                // Detect if it's a card or account
                const isCard = contaStr.toLowerCase().includes('cartão') || contaStr.toLowerCase().includes('cartao');

                // Extract the actual account/card name from the HTML-like string
                const extractedName = (contaStr.split('(')[0] ?? contaStr).trim();

                // Find matching account or card by checking if the CSV string contains the entity name.
                // When bancoId is provided, prefer accounts from that bank; accounts with no bancoId
                // (shared/virtual like "Despesas Mensais") are always eligible.
                const conta = existingContas.find(c => {
                    const entityName = c.nome.value.toLowerCase();
                    const searchStr = extractedName.toLowerCase();
                    if (!searchStr.includes(entityName) && !entityName.includes(searchStr)) return false;
                    // If a bancoId filter is active, only match accounts that belong to that bank OR have no bank
                    if (bancoId) return c.bancoId === bancoId || !c.bancoId;
                    return true;
                });

                const cartao = existingCartoes.find(c => {
                    const entityName = c.nome.value.toLowerCase();
                    const searchStr = extractedName.toLowerCase();
                    // Check both directions: entity name in CSV string OR CSV string in entity name
                    return searchStr.includes(entityName) || entityName.includes(searchStr);
                });

                if (!isCard && !conta) {
                    this.logger.info(`Account not found for: ${extractedName}`);
                    continue;
                }
                if (isCard && !cartao) {
                    this.logger.info(`Card not found for: ${extractedName}`);
                    continue;
                }

                // --- Monthly Expense (Despesa Mensal) detection by name ---
                const isSaidaConta = fileType === 'saidas' && !isCard;
                const isMensal = isSaidaConta && this.isDespesaMensalName(nome);

                // Exit lines that are from the "Despesas Mensais" account for a known monthly expense
                // have already been recorded in the pre-scan; skip creating a duplicate transaction for them
                const isSaidaDespesasMensais = isSaidaConta && this.isDespesaMensalName(nome) &&
                    conta != null && conta.nome.value.toLowerCase() === 'despesas mensais';
                if (isSaidaDespesasMensais) {
                    this.logger.info(`Skipping Saída from Despesas Mensais account: ${nome}`);
                    continue;
                }

                // Entry with a savings name in the "Conta Poupança" account -> conclude pending Poupança
                // Entry with a savings name in another account -> ignore
                const isEntradaPoupanca = fileType === 'entradas' && !isCard && this.isPoupancaName(nome);

                if (isEntradaPoupanca) {
                    // Always register this key in the session set regardless of account — used when matching exits
                    const key = `${nome.toLowerCase()}|${date.getMonth() + 1}|${date.getFullYear()}|${valor}`;
                    entradasVistasSessao.add(key);

                    if (conta != null && this.isPoupancaName(conta.nome.value)) {
                        // Find pending Poupança with same name/month/amount
                        const poupancaPendente = allTransacoes.find(t =>
                            t.descricao.value.toLowerCase() === nome.toLowerCase() &&
                            t.tipo.value === 'Poupança' &&
                            t.status.value === 'Pendente' &&
                            t.data.month === (date.getMonth() + 1) &&
                            t.data.year === date.getFullYear() &&
                            Math.abs(t.valor.value - valor) < 0.01
                        );
                        if (poupancaPendente) {
                            this.logger.info(`Concluding Poupança: ${nome} (${date.getMonth() + 1}/${date.getFullYear()})`);
                            const statusResult = Status.create('Concluído');
                            const novaData = Data.createFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear(), true);
                            if (statusResult.isSuccess && novaData.isSuccess) {
                                const updatedOrError = Transacao.create({
                                    descricao: poupancaPendente.descricao,
                                    data: novaData.getValue(),
                                    valor: poupancaPendente.valor,
                                    tipo: poupancaPendente.tipo,
                                    categoria: poupancaPendente.categoria,
                                    status: statusResult.getValue(),
                                    conta: poupancaPendente.conta,
                                    contaDestino: poupancaPendente.contaDestino,
                                    contaPoupanca: poupancaPendente.contaPoupanca,
                                    cartaoCredito: poupancaPendente.cartaoCredito
                                }, poupancaPendente.id);
                                if (updatedOrError.isSuccess) {
                                    const updated = updatedOrError.getValue();
                                    (updated as unknown as Record<string, unknown>)['userDomainId'] = userId;
                                    await this.transacaoRepo.update(updated);
                                    const idx = allTransacoes.indexOf(poupancaPendente);
                                    if (idx >= 0) allTransacoes[idx] = updated;
                                }
                            }
                        } else {
                            this.logger.info(`No pending Poupança found for Entrada in conta poupança: ${nome}, skipping`);
                        }
                    } else {
                        this.logger.info(`Skipping Entrada with poupança name in non-poupança account: ${nome}`);
                    }
                    continue; // never create a normal Entry for savings names
                }

                // ---- Entry with a monthly-expense name ----
                const isEntradaDespesaMensal = fileType === 'entradas' && !isCard && this.isDespesaMensalName(nome);

                if (isEntradaDespesaMensal) {
                    // Always register this key in the session set regardless of account — used when matching exits
                    const key = `${nome.toLowerCase()}|${date.getMonth() + 1}|${date.getFullYear()}|${valor}`;
                    entradasVistasSessao.add(key);

                    if (conta != null && conta.nome.value.toLowerCase() === 'despesas mensais') {
                        const despesaPendente = allTransacoes.find(t =>
                            t.descricao.value.toLowerCase() === nome.toLowerCase() &&
                            t.tipo.value === 'Despesa Mensal' &&
                            t.status.value === 'Pendente' &&
                            t.data.month === (date.getMonth() + 1) &&
                            t.data.year === date.getFullYear() &&
                            Math.abs(t.valor.value - valor) < 0.01
                        );
                        if (despesaPendente) {
                            this.logger.info(`Concluding Despesa Mensal: ${nome} (${date.getMonth() + 1}/${date.getFullYear()})`);
                            const statusResult = Status.create('Concluído');
                            const novaData = Data.createFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear(), true);
                            if (statusResult.isSuccess && novaData.isSuccess) {
                                const updatedOrError = Transacao.create({
                                    descricao: despesaPendente.descricao,
                                    data: novaData.getValue(),
                                    valor: despesaPendente.valor,
                                    tipo: despesaPendente.tipo,
                                    categoria: despesaPendente.categoria,
                                    status: statusResult.getValue(),
                                    conta: despesaPendente.conta,
                                    contaDestino: despesaPendente.contaDestino,
                                    cartaoCredito: despesaPendente.cartaoCredito
                                }, despesaPendente.id);
                                if (updatedOrError.isSuccess) {
                                    const updated = updatedOrError.getValue();
                                    (updated as unknown as Record<string, unknown>)['userDomainId'] = userId;
                                    await this.transacaoRepo.update(updated);
                                    const idx = allTransacoes.indexOf(despesaPendente);
                                    if (idx >= 0) allTransacoes[idx] = updated;
                                }
                            }
                        } else {
                            this.logger.info(`No pending Despesa Mensal found for Entrada: ${nome}, skipping`);
                        }
                    } else {
                        this.logger.info(`Skipping Entrada with despesa mensal name in non-despesas-mensais account: ${nome}`);
                    }
                    continue; // never create a normal Entry for monthly-expense names
                }

                if (isMensal) {
                    // Only one Despesa Mensal per name per month
                    const existsThisMonth = allTransacoes.find(t =>
                        t.descricao.value.toLowerCase() === nome.toLowerCase() &&
                        t.tipo.value === 'Despesa Mensal' &&
                        t.data.month === (date.getMonth() + 1) &&
                        t.data.year === date.getFullYear()
                    );
                    if (existsThisMonth) {
                        this.logger.info(`Skipping duplicate Despesa Mensal: ${nome} (${date.getMonth() + 1}/${date.getFullYear()})`);
                        continue;
                    }

                    // Completed if a Despesas Mensais exit with same name/month exists (collected during pre-scan)
                    const despesaKey = `${nome.toLowerCase()}|${date.getMonth() + 1}|${date.getFullYear()}`;
                    const despesaStatus = saidasDespesasMensaisVistas.has(despesaKey) ? 'Concluído' : 'Pendente';

                    // Find or create Despesas Mensais destination account
                    let contaDestino = existingContas.find(c => c.nome.value.toLowerCase() === 'despesas mensais');
                    if (!contaDestino) {
                        const nomeRes = Nome.create('Despesas Mensais');
                        const iconRes = Icon.create('Despesas Mensais.jpg');
                        const saldoRes = Dinheiro.create(0, 'EUR');
                        if (nomeRes.isSuccess && iconRes.isSuccess && saldoRes.isSuccess) {
                            const contaRes = Conta.create({
                                userId: new UniqueEntityID(userId),
                                nome: nomeRes.getValue(),
                                icon: iconRes.getValue(),
                                saldo: saldoRes.getValue()
                            });
                            if (contaRes.isSuccess) {
                                contaDestino = await this.contaRepo.save(contaRes.getValue());
                                existingContas.push(contaDestino);
                            }
                        }
                    }

                    if (!conta || !contaDestino) {
                        this.logger.info(`Skipping Despesa Mensal ${nome}: conta or contaDestino not found`);
                        continue;
                    }

                    // Find/create category for Despesa Mensal
                    let catDespesa = existingCategorias.find(c => c.nome.value.toLowerCase() === 'despesas mensais');
                    if (!catDespesa) {
                        const catResult = Categoria.create({
                            nome: Nome.create('Despesas Mensais').getValue(),
                            icon: Icon.create('📅').getValue()
                        });
                        if (catResult.isSuccess) {
                            catDespesa = await this.categoriaRepo.save(catResult.getValue());
                            existingCategorias.push(catDespesa);
                        }
                    }

                    const propsDm = {
                        descricao: Descricao.create(nome).getValue(),
                        valor: Dinheiro.create(valor, 'EUR').getValue(),
                        data: Data.createFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear(), true).getValue(),
                        tipo: Tipo.create('Despesa Mensal').getValue(),
                        status: Status.create(despesaStatus).getValue(),
                        categoria: catDespesa ?? categoria!,
                        conta: conta,
                        contaDestino: contaDestino
                    };

                    const dmOrError = Transacao.create(propsDm);
                    if (dmOrError.isSuccess) {
                        const dm = dmOrError.getValue();
                        (dm as unknown as Record<string, unknown>)['userDomainId'] = userId;
                        const saved = await this.transacaoRepo.save(dm);
                        allTransacoes.push(saved);
                    }
                    continue; // skip normal flow
                }

                // --- Poupança detection by name ---

                // Saída com nome de poupança → criar transação do tipo Poupança
                const isPoupanca = isSaidaConta && this.isPoupancaName(nome);

                if (isPoupanca) {
                    // Only one Poupança per name per month
                    const existsThisMonth = allTransacoes.find(t =>
                        t.descricao.value.toLowerCase() === nome.toLowerCase() &&
                        t.tipo.value === 'Poupança' &&
                        t.data.month === (date.getMonth() + 1) &&
                        t.data.year === date.getFullYear()
                    );
                    if (existsThisMonth) {
                        this.logger.info(`Skipping duplicate Poupança: ${nome} (${date.getMonth() + 1}/${date.getFullYear()})`);
                        continue;
                    }

                    // contaDestino = conta Despesas Mensais (igual à DespesaMensal)
                    let contaDestinoPoupanca = existingContas.find(c => c.nome.value.toLowerCase() === 'despesas mensais');
                    if (!contaDestinoPoupanca) {
                        const nomeRes = Nome.create('Despesas Mensais');
                        const iconRes = Icon.create('Despesas Mensais.jpg');
                        const saldoRes = Dinheiro.create(0, 'EUR');
                        if (nomeRes.isSuccess && iconRes.isSuccess && saldoRes.isSuccess) {
                            const contaRes = Conta.create({
                                userId: new UniqueEntityID(userId),
                                nome: nomeRes.getValue(),
                                icon: iconRes.getValue(),
                                saldo: saldoRes.getValue()
                            });
                            if (contaRes.isSuccess) {
                                contaDestinoPoupanca = await this.contaRepo.save(contaRes.getValue());
                                existingContas.push(contaDestinoPoupanca);
                            }
                        }
                    }

                    // contaPoupanca = conta real de poupança (pelo nome)
                    const contaPoupanca = existingContas.find(c => this.isPoupancaName(c.nome.value));

                    if (!conta || !contaDestinoPoupanca || !contaPoupanca) {
                        this.logger.info(`Skipping Poupança ${nome}: missing conta (${!!conta}), contaDestino (${!!contaDestinoPoupanca}), or contaPoupanca (${!!contaPoupanca})`);
                        continue;
                    }

                    // Concluído se já existe Entrada na conta poupança (isPoupancaName) no mesmo mês (DB ou sessão actual)
                    const poupancaKey = `${nome.toLowerCase()}|${date.getMonth() + 1}|${date.getFullYear()}|${valor}`;
                    const matchingEntradaPoupanca = entradasVistasSessao.has(poupancaKey) ||
                        allTransacoes.some(t =>
                            t.descricao.value.toLowerCase() === nome.toLowerCase() &&
                            t.tipo.value === 'Entrada' &&
                            t.data.month === (date.getMonth() + 1) &&
                            t.data.year === date.getFullYear() &&
                            Math.abs(t.valor.value - valor) < 0.01 &&
                            t.conta != null &&
                            this.isPoupancaName(t.conta.nome.value)
                        );
                    const poupancaStatus = matchingEntradaPoupanca ? 'Concluído' : 'Pendente';
                    let catPoupanca = existingCategorias.find(c => c.nome.value.toLowerCase() === 'poupança' || c.nome.value.toLowerCase() === 'poupanca');
                    if (!catPoupanca) {
                        const catResult = Categoria.create({
                            nome: Nome.create('Poupança').getValue(),
                            icon: Icon.create('🐷').getValue()
                        });
                        if (catResult.isSuccess) {
                            catPoupanca = await this.categoriaRepo.save(catResult.getValue());
                            existingCategorias.push(catPoupanca);
                        }
                    }

                    const propsPoupanca = {
                        descricao: Descricao.create(nome).getValue(),
                        valor: Dinheiro.create(valor, 'EUR').getValue(),
                        data: Data.createFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear(), true).getValue(),
                        tipo: Tipo.create('Poupança').getValue(),
                        status: Status.create(poupancaStatus).getValue(),
                        categoria: catPoupanca ?? categoria!,
                        conta: conta,
                        contaDestino: contaDestinoPoupanca,
                        contaPoupanca: contaPoupanca
                    };

                    const poupancaOrError = Transacao.create(propsPoupanca);
                    if (poupancaOrError.isSuccess) {
                        const p = poupancaOrError.getValue();
                        (p as unknown as Record<string, unknown>)['userDomainId'] = userId;
                        const saved = await this.transacaoRepo.save(p);
                        allTransacoes.push(saved);
                    }
                    continue; // skip normal flow
                }

                // Determine transaction type based on file type and other factors
                let tipo: 'Entrada' | 'Saída' | 'Crédito' | 'Reembolso';
                const isReembolso = fileType === 'entradas' && nome.toLowerCase().includes('reembolso');

                if (isReembolso) {
                    tipo = 'Reembolso';
                } else if (fileType === 'entradas') {
                    tipo = isCard ? 'Crédito' : 'Entrada';
                } else {
                    tipo = isCard ? 'Crédito' : 'Saída';
                }

                // Check for duplicates
                const duplicate = allTransacoes.find(t =>
                    t.descricao.value.toLowerCase() === nome.toLowerCase() &&
                    t.data.day === date.getDate() &&
                    t.data.month === (date.getMonth() + 1) &&
                    t.data.year === date.getFullYear() &&
                    Math.abs(t.valor.value - valor) < 0.01
                );

                if (duplicate) {
                    this.logger.info(`Skipping duplicate transaction: ${nome}`);
                    continue;
                }

                // Determine status based on type and period
                let status: string;
                if (tipo === 'Entrada') {
                    status = 'Concluído';
                } else if (tipo === 'Crédito' || tipo === 'Reembolso') {
                    // Check if transaction is within the provided period
                    if (periodo) {
                        const transactionDate = new Date(date);
                        transactionDate.setHours(0, 0, 0, 0);
                        const periodoInicio = new Date(periodo.inicio);
                        periodoInicio.setHours(0, 0, 0, 0);
                        const periodoFim = new Date(periodo.fim);
                        periodoFim.setHours(23, 59, 59, 999);

                        if (transactionDate >= periodoInicio && transactionDate <= periodoFim) {
                            status = 'Pendente';
                        } else {
                            status = 'Concluído';
                        }
                    } else {
                        status = 'Concluído';
                    }
                } else if (tipo === 'Saída') {
                    status = 'Concluído';
                } else {
                    // Fallback for any other types
                    status = (saiuStr === 'yes' || saiuStr === 'sim') ? 'Concluído' : 'Pendente';
                }

                // For Reembolso: conta comes from the entrada row, cartao is found in the saidas CSV by matching name/month/valor
                let contaFinal = isCard ? undefined : conta;
                let cartaoFinal = isCard ? cartao : undefined;

                if (tipo === 'Reembolso' && saidasRows) {
                    contaFinal = conta ?? undefined;
                    // Determine the valor column index from the saídas header
                    const saidasValorColIndex = saidasHeader
                        ? saidasHeader.map(h => h.toLowerCase().trim()).indexOf('valor')
                        : -1;
                    // Find matching row in saidas CSV: same name, same month/year, same valor, and conta is a cartão
                    const saidaMatch = saidasRows.find(r => {
                        const saidaNome = this.cleanName(r[0] || '');
                        const saidaContaStr = this.cleanName(r[2] || '');
                        const saidaDataStr = r[3] || '';
                        // Use "Valor" column if found, otherwise fall back to column 5
                        const saidaValorStr = saidasValorColIndex >= 0 ? (r[saidasValorColIndex] || '') : (r[5] || '');
                        if (!saidaNome || !saidaContaStr) return false;
                        const saidaIsCard = saidaContaStr.toLowerCase().includes('cartão') || saidaContaStr.toLowerCase().includes('cartao');
                        if (!saidaIsCard) return false;
                        if (saidaNome.toLowerCase() !== nome.toLowerCase()) return false;
                        const saidaDate = this.parseDate(saidaDataStr);
                        if (!saidaDate) return false;
                        if (saidaDate.getMonth() !== date.getMonth() || saidaDate.getFullYear() !== date.getFullYear()) return false;
                        const saidaValor = this.parseCurrency(saidaValorStr);
                        return Math.abs(saidaValor - valor) < 0.01;
                    });

                    if (saidaMatch) {
                        const saidaCartaoStr = this.cleanName(saidaMatch[2] || '');
                        const saidaExtractedName = (saidaCartaoStr.split('(')[0] ?? saidaCartaoStr).trim();
                        cartaoFinal = existingCartoes.find(c => {
                            const entityName = c.nome.value.toLowerCase();
                            const searchStr = saidaExtractedName.toLowerCase();
                            return searchStr.includes(entityName) || entityName.includes(searchStr);
                        });
                    }
                }

                const props = {
                    descricao: Descricao.create(nome).getValue(),
                    valor: Dinheiro.create(valor, 'EUR').getValue(),
                    data: Data.createFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear(), true).getValue(),
                    tipo: Tipo.create(tipo).getValue(),
                    status: Status.create(status).getValue(),
                    categoria: categoria!,
                    conta: contaFinal,
                    cartaoCredito: cartaoFinal
                };

                const transacaoOrError = Transacao.create(props);
                if (transacaoOrError.isSuccess) {
                    const transacao = transacaoOrError.getValue();
                    (transacao as unknown as Record<string, unknown>)['userDomainId'] = userId;
                    const saved = await this.transacaoRepo.save(transacao);
                    allTransacoes.push(saved);
                }
            }
            return Result.ok<void>();
        } catch (e) {
            this.logger.error(e);
            return Result.fail(`Error importing ${fileType}`);
        }
    }
}

