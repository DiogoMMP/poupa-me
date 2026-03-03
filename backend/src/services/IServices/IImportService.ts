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
     * @param bancoId - Optional Banco domain ID to restrict which accounts/cards are used
     * @returns Result indicating success or error message
     */
    importEntradas(csvContent: string, userId: string, periodo?: { inicio: Date; fim: Date }, bancoId?: string): Promise<Result<void>>;

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
     * @param entradasVistas - Optional set of "Nome" values from imported Entradas to determine if Saídas should be marked as Pendente or Concluído
     * @param bancoId - Optional Banco domain ID to restrict which accounts/cards are used
     * @returns Result indicating success or error message
     */
    importSaidas(csvContent: string, userId: string, entradasVistas?: Set<string>, bancoId?: string): Promise<Result<void>>;

    /**
     * Imports both entradas and saídas together, sharing session state for correct status detection.
     * Always processes entradas first, then saídas with the collected entradasVistas.
     */
    importTransacoesCompleto(
        entradasCsv: string | undefined,
        saidasCsv: string | undefined,
        userId: string,
        periodo?: { inicio: Date; fim: Date },
        bancoId?: string
    ): Promise<Result<string[]>>;
}

