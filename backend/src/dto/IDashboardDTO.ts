/**
 * DTO representing a summary of a single Banco with its totals
 */
export interface IBancoResumoDTO {
    id: string;
    nome: string;
    icon: string;
    saldoContas: number;    // Total real money in this bank
    saldoCartoes: number;   // Total "mealheiro" accumulated in cards
    totalBanco: number;     // contas + cartoes
}

/**
 * DTO representing the complete dashboard with global totals and per-bank breakdown
 */
export interface IDashboardDTO {
    saldoGlobal: number;        // Sum of all banks
    detalhePorBanco: IBancoResumoDTO[];
}

