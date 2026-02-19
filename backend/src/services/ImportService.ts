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
import { Tipo } from '../domain/Transacao/ValueObjects/Tipo.js';
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
        const match = cleaned.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
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
        let cleaned = name.replace(/<[^>]*>/g, '');
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
                    const existingCartao = existingCartoes.find(c =>
                        c.nome.value.toLowerCase() === contaName.toLowerCase()
                    );

                    if (existingCartao) {
                        // Update used balance if needed
                        const diferenca = balance - existingCartao.saldoUtilizado.value;
                        if (diferenca !== 0) {
                            const diffDinheiro = Dinheiro.create(Math.abs(diferenca), 'EUR').getValue();
                            if (diferenca > 0) existingCartao.adicionarUtilizacao(diffDinheiro);
                            else existingCartao.reduzirUtilizacao(diffDinheiro);
                            await this.cartaoRepo.save(existingCartao);
                        }
                    } else {
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
                    const existingConta = existingContas.find(c =>
                        c.nome.value.toLowerCase() === contaName.toLowerCase()
                    );

                    if (existingConta) {
                        const diferenca = balance - existingConta.saldo.value;
                        if (diferenca !== 0) {
                            const diffDinheiro = Dinheiro.create(Math.abs(diferenca), 'EUR').getValue();
                            if (diferenca > 0) existingConta.adicionarSaldo(diffDinheiro);
                            else existingConta.subtrairSaldo(diffDinheiro);
                            await this.contaRepo.save(existingConta);
                        }
                    } else {
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

    public async importEntradas(csvContent: string, userId: string, periodo?: { inicio: Date; fim: Date }): Promise<Result<void>> {
        // Delegate to unified import method with 'entradas' type
        return this.importTransacoes(csvContent, userId, 'entradas', periodo);
    }

    public async importSaidas(csvContent: string, userId: string): Promise<Result<void>> {
        // Delegate to unified import method with 'saidas' type
        return this.importTransacoes(csvContent, userId, 'saidas');
    }

    /**
     * Unified method to import transactions (entradas or saidas)
     * Automatically detects origin and destination accounts based on transaction type
     */
    private async importTransacoes(
        csvContent: string,
        userId: string,
        fileType: 'entradas' | 'saidas',
        periodo?: { inicio: Date; fim: Date }
    ): Promise<Result<void>> {
        try {
            const rows = this.parseCSV(csvContent);
            if (rows.length < 2) return Result.fail<void>('Empty CSV');

            const existingCategorias = await this.categoriaRepo.findAll();
            const existingContas = await this.contaRepo.findAll(userId);
            const existingCartoes = await this.cartaoRepo.findAll(userId);
            const allTransacoes = await this.transacaoRepo.findAll(userId);

            const dataRows = rows.slice(1);

            for (const row of dataRows) {
                const nome = this.cleanName(row[0] || '');
                const categoriaStr = this.cleanName(row[1] || 'Sem Categoria');
                const contaStr = this.cleanName(row[2] || '');
                const dataStr = row[3] || '';

                // Different column positions for entradas vs saidas
                const reembolsoCol = fileType === 'entradas' ? (row[5] || '').toLowerCase() : '';
                const saiuStr = fileType === 'entradas' ? (row[6] || '').toLowerCase() : '';
                const valorStr = fileType === 'entradas' ? (row[7] || '') : (row[5] || '');

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

                // Find matching account or card by checking if the CSV string contains the entity name
                const conta = existingContas.find(c => {
                    const entityName = c.nome.value.toLowerCase();
                    const searchStr = extractedName.toLowerCase();
                    // Check both directions: entity name in CSV string OR CSV string in entity name
                    return searchStr.includes(entityName) || entityName.includes(searchStr);
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

                // Determine transaction type based on file type and other factors
                let tipo: 'Entrada' | 'Saída' | 'Crédito' | 'Reembolso';
                const isReembolsoCat = categoria!.nome.value.toLowerCase().includes('reembolso');
                const isReembolsoCol = reembolsoCol === 'yes' || reembolsoCol === 'sim';

                if (fileType === 'entradas') {
                    if (isReembolsoCol || isReembolsoCat) {
                        tipo = 'Reembolso';
                    } else if (isCard) {
                        tipo = 'Crédito';
                    } else {
                        tipo = 'Entrada';
                    }
                } else {
                    // saidas
                    if (isCard) {
                        tipo = 'Crédito';
                    } else {
                        tipo = 'Saída';
                    }
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

                // For Reembolso, we need to find the original Crédito/Saída transaction to get the cartao
                let contaForTransaction = conta;
                let cartaoForTransaction = cartao;

                if (tipo === 'Reembolso') {
                    // Search for matching Crédito or Saída transaction with similar name/category
                    const matchingTransacao = allTransacoes.find(t => {
                        // Look for transactions with similar description or same category
                        const sameCategory = t.categoria.id.toString() === categoria!.id.toString();
                        const similarDescription = t.descricao.value.toLowerCase().includes(nome.toLowerCase()) ||
                                                   nome.toLowerCase().includes(t.descricao.value.toLowerCase());

                        // Must be a Crédito or Saída type (not another Reembolso)
                        const isExpenseType = t.tipo.value === 'Crédito' || t.tipo.value === 'Saída';

                        return isExpenseType && (sameCategory || similarDescription);
                    });

                    if (matchingTransacao && matchingTransacao.cartaoCredito) {
                        // Found a matching card transaction, use that card
                        cartaoForTransaction = matchingTransacao.cartaoCredito;

                        // Get the payment account from the card
                        const contaPagamentoId = matchingTransacao.cartaoCredito.contaPagamentoId;
                        if (contaPagamentoId) {
                            const contaPagamento = existingContas.find(c => c.id.toString() === contaPagamentoId.toString());
                            if (contaPagamento) {
                                contaForTransaction = contaPagamento;
                            }
                        }
                    } else {
                        // Fallback: if no matching transaction found, skip this reembolso
                        this.logger.info(`Skipping reembolso without matching card transaction: ${nome}`);
                        continue;
                    }
                }

                const props = {
                    descricao: Descricao.create(nome).getValue(),
                    valor: Dinheiro.create(valor, 'EUR').getValue(),
                    data: Data.createFromParts(date.getDate(), date.getMonth() + 1, date.getFullYear(), true).getValue(),
                    tipo: Tipo.create(tipo).getValue(),
                    status: Status.create(status).getValue(),
                    categoria: categoria!,
                    conta: tipo === 'Reembolso' ? contaForTransaction : (isCard ? undefined : conta),
                    cartaoCredito: tipo === 'Reembolso' ? cartaoForTransaction : (isCard ? cartao : undefined)
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

    public async importDespesasMensais(csvContent: string, userId: string, contaOrigemId: string): Promise<Result<void>> {
        try {
            const rows = this.parseCSV(csvContent);
            if (rows.length < 2) return Result.fail<void>('Empty CSV');

            const existingCategorias = await this.categoriaRepo.findAll();
            const existingContas = await this.contaRepo.findAll(userId);
            const allTransacoes = await this.transacaoRepo.findAll(userId);

            // Find or create "Despesas Mensais" account (destination - where expenses are tracked)
            let contaDestino = existingContas.find(c => c.nome.value.toLowerCase() === 'despesas mensais');
            if (!contaDestino) {
                const nomeResult = Nome.create('Despesas Mensais');
                const iconResult = Icon.create('Despesas Mensais.jpg');
                const saldoResult = Dinheiro.create(0, 'EUR');

                if (nomeResult.isSuccess && iconResult.isSuccess && saldoResult.isSuccess) {
                    const contaResult = Conta.create({
                        userId: new UniqueEntityID(userId),
                        nome: nomeResult.getValue(),
                        icon: iconResult.getValue(),
                        saldo: saldoResult.getValue()
                    });

                    if (contaResult.isSuccess) {
                        contaDestino = await this.contaRepo.save(contaResult.getValue());
                        existingContas.push(contaDestino);
                    } else {
                        return Result.fail<void>('Failed to create Despesas Mensais account');
                    }
                }
            }

            // Find origin account (where the money comes from - e.g., bank account)
            const contaOrigem = existingContas.find(c => c.id.toString() === contaOrigemId);
            if (!contaOrigem) {
                return Result.fail<void>('Origin account not found');
            }

            // Find or create "Despesas Mensais" category
            let categoria = existingCategorias.find(c => c.nome.value.toLowerCase() === 'despesas mensais');
            if (!categoria) {
                const catResult = Categoria.create({
                    nome: Nome.create('Despesas Mensais').getValue(),
                    icon: Icon.create('📅').getValue()
                });
                if (catResult.isSuccess) {
                    categoria = await this.categoriaRepo.save(catResult.getValue());
                    existingCategorias.push(categoria);
                }
            }

            const dataRows = rows.slice(1);
            const now = new Date();

            for (const row of dataRows) {
                const despesaName = this.cleanName(row[0] || '');
                const valorStr = row[1] || '';

                if (!despesaName || !valorStr) continue;

                const valor = this.parseCurrency(valorStr);
                if (valor <= 0) continue;

                // Check for duplicates
                const duplicate = allTransacoes.find(t =>
                    t.descricao.value.toLowerCase() === despesaName.toLowerCase() &&
                    t.tipo.value === 'Despesa Mensal' &&
                    Math.abs(t.valor.value - valor) < 0.01
                );

                if (duplicate) {
                    this.logger.info(`Skipping duplicate monthly expense: ${despesaName}`);
                    continue;
                }

                // Despesa Mensal: Origin = bank account, Destination = Despesas Mensais tracking account
                const props = {
                    descricao: Descricao.create(despesaName).getValue(),
                    valor: Dinheiro.create(valor, 'EUR').getValue(),
                    data: Data.createFromParts(now.getDate(), now.getMonth() + 1, now.getFullYear(), true).getValue(),
                    tipo: Tipo.create('Despesa Mensal').getValue(),
                    status: Status.create('Concluído').getValue(),
                    categoria: categoria!,
                    conta: contaOrigem,           // Origin: where money comes from
                    contaDestino: contaDestino     // Destination: Despesas Mensais tracking
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
            this.logger.error('ImportDespesasMensais error: %o', e);
            return Result.fail('Error importing monthly expenses');
        }
    }
}