import type { Result } from '../../core/logic/Result.js';

/**
 * Service interface for importing CSV data from Notion exports.
 * Handles data cleanup and transformation from legacy system into domain entities.
 */
export default interface IImportService {
    /**
     * Imports accounts (Contas) from CSV content.
     * CSV Headers: Conta,Despesas,Receitas,Todas as Despesas,Todas as Receitas,Total,Total Numérico,Valor Inicial
     *
     * @param csvContent - Raw CSV file content as string
     * @param userId - User domain ID who owns the accounts
     * @param bancoId - Optional Banco domain ID to associate with the accounts
     * @returns Result indicating success or error message
     */
    importContas(csvContent: string, userId: string, bancoId?: string): Promise<Result<void>>;

    /**
     * Imports income transactions (Entradas) from CSV content.
     * CSV Headers: Nome,Categoria,Conta,Data,Despesa na Conta,Reembolso,Saiu,Valor,...
     *
     * Automatically detects if target is a Card or Account based on name.
     * Creates categories if they don't exist.
     * Handles status based on "Saiu" column.
     * If period is provided, Crédito and Reembolso transactions within that period are marked as Pendente.
     *
     * @param csvContent - Raw CSV file content as string
     * @param userId - User domain ID who owns the transactions
     * @param periodo - Optional period { inicio: Date, fim: Date } to mark Crédito/Reembolso as Pendente
     * @returns Result indicating success or error message
     */
    importEntradas(csvContent: string, userId: string, periodo?: { inicio: Date; fim: Date }): Promise<Result<void>>;

    /**
     * Imports expense transactions (Saídas) from CSV content.
     * CSV Headers: Nome,Categoria,Conta,Data,Despesa no Cartão,Valor,...
     *
     * Automatically detects if target is a Card or Account based on name.
     * Creates categories if they don't exist.
     * All expenses are marked as "Concluído".
     *
     * @param csvContent - Raw CSV file content as string
     * @param userId - User domain ID who owns the transactions
     * @returns Result indicating success or error message
     */
    importSaidas(csvContent: string, userId: string): Promise<Result<void>>;

    /**
     * Imports monthly expenses (Despesas Mensais) from CSV content.
     * CSV Headers: Despesa,Valor
     *
     * Creates transactions with type "Despesa Mensal" and sets the destination account to "Despesas Mensais".
     * All monthly expenses are marked as "Concluído".
     *
     * @param csvContent - Raw CSV file content as string
     * @param userId - User domain ID who owns the transactions
     * @param contaOrigemId - Origin account ID where the expense comes from (e.g., bank account)
     * @returns Result indicating success or error message
     */
    importDespesasMensais(csvContent: string, userId: string, contaOrigemId: string): Promise<Result<void>>;
}

