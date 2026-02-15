import type { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import type IImportController from './IControllers/IImportController.js';
import type IImportService from '../services/IServices/IImportService.js';

/**
 * Controller implementation for Import operations
 * Handles CSV file uploads and imports data from Notion exports
 */
@Service()
export default class ImportController implements IImportController {
    constructor(
        @Inject('ImportService') private importService: IImportService
    ) {}

    /**
     * Handles importing accounts (Contas) from CSV file
     * Expects CSV content in request body or file upload, along with userId and bancoId
     * @param req Express request object containing the CSV data, userId, and bancoId
     * @param res Express response object
     * @param next Express next function for error handling
     */
    public async importContas(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            // Get userId and bancoId from request body or form fields
            const userId = req.body.userId;
            const bancoId = req.body.bancoId;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // Get CSV content from body or file upload
            let csvContent: string;

            if (req.file) {
                // If file was uploaded via multipart/form-data
                csvContent = req.file.buffer.toString('utf-8');
            } else if (req.body.csvContent) {
                // If CSV content was sent directly in JSON body
                csvContent = req.body.csvContent;
            } else {
                return res.status(400).json({ error: 'CSV content or file is required' });
            }

            const result = await this.importService.importContas(csvContent, userId, bancoId);

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json({
                message: 'Contas imported successfully'
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Handles importing transactions (Entradas and/or Saídas) from CSV files
     * Optionally accepts a third file for monthly expenses (Despesas Mensais)
     * Expects CSV content in request body or file upload, along with userId
     * @param req Express request object containing the CSV data, userId, optional contaOrigemId, and optional period
     * @param res Express response object
     * @param next Express next function for error handling
     */
    public async importTransacoes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            // Get userId, optional contaOrigemId, and optional period from request body or form fields
            const userId = req.body.userId;
            const contaOrigemId = req.body.contaOrigemId; // Optional, for despesas mensais
            const periodoInicio = req.body.periodoInicio; // Optional, format: "YYYY-MM-DD"
            const periodoFim = req.body.periodoFim; // Optional, format: "YYYY-MM-DD"

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // Get CSV content from body or file upload
            let entradasCsvContent: string | undefined;
            let saidasCsvContent: string | undefined;
            let despesasMensaisCsvContent: string | undefined;

            // Check if files were uploaded (multer with fields)
            if (req.files && !Array.isArray(req.files)) {
                // Multiple files with different field names
                if (req.files['entradas'] && req.files['entradas'][0]) {
                    entradasCsvContent = req.files['entradas'][0].buffer.toString('utf-8');
                }
                if (req.files['saidas'] && req.files['saidas'][0]) {
                    saidasCsvContent = req.files['saidas'][0].buffer.toString('utf-8');
                }
                if (req.files['despesasMensais'] && req.files['despesasMensais'][0]) {
                    despesasMensaisCsvContent = req.files['despesasMensais'][0].buffer.toString('utf-8');
                }
            } else if (req.body.csvContent || req.body.entradasCsvContent || req.body.saidasCsvContent) {
                // If CSV content was sent directly in JSON body
                entradasCsvContent = req.body.entradasCsvContent || req.body.csvContent;
                saidasCsvContent = req.body.saidasCsvContent;
                despesasMensaisCsvContent = req.body.despesasMensaisCsvContent;
            }

            if (!entradasCsvContent && !saidasCsvContent) {
                return res.status(400).json({ error: 'At least one CSV file (entradas or saidas) is required' });
            }

            // Parse period dates if provided
            let periodo: { inicio: Date; fim: Date } | undefined;
            if (periodoInicio && periodoFim) {
                periodo = {
                    inicio: new Date(periodoInicio),
                    fim: new Date(periodoFim)
                };
            }

            const results: string[] = [];

            // Import entradas if provided
            if (entradasCsvContent) {
                const entradasResult = await this.importService.importEntradas(entradasCsvContent, userId, periodo);
                if (entradasResult.isFailure) {
                    return res.status(400).json({ error: `Entradas: ${entradasResult.error}` });
                }
                results.push('entradas');
            }

            // Import saidas if provided
            if (saidasCsvContent) {
                const saidasResult = await this.importService.importSaidas(saidasCsvContent, userId);
                if (saidasResult.isFailure) {
                    return res.status(400).json({ error: `Saídas: ${saidasResult.error}` });
                }
                results.push('saídas');
            }

            // Import despesas mensais if provided
            if (despesasMensaisCsvContent) {
                if (!contaOrigemId) {
                    return res.status(400).json({ error: 'contaOrigemId is required when importing despesas mensais' });
                }
                const despesasResult = await this.importService.importDespesasMensais(despesasMensaisCsvContent, userId, contaOrigemId);
                if (despesasResult.isFailure) {
                    return res.status(400).json({ error: `Despesas Mensais: ${despesasResult.error}` });
                }
                results.push('despesas mensais');
            }

            return res.status(200).json({
                message: `Successfully imported: ${results.join(', ')}`
            });
        } catch (e) {
            next(e);
        }
    }
}


