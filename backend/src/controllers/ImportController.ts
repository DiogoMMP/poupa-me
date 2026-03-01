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
     * Handles importing transactions (Entradas and/or Saídas) from CSV files.
     * Expects CSV content in request body or file upload, along with userId.
     */
    public async importTransacoes(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = req.body.userId;
            const periodoInicio = req.body.periodoInicio;
            const periodoFim = req.body.periodoFim;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            let entradasCsvContent: string | undefined;
            let saidasCsvContent: string | undefined;

            if (req.files && !Array.isArray(req.files)) {
                if (req.files['entradas'] && req.files['entradas'][0]) {
                    entradasCsvContent = req.files['entradas'][0].buffer.toString('utf-8');
                }
                if (req.files['saidas'] && req.files['saidas'][0]) {
                    saidasCsvContent = req.files['saidas'][0].buffer.toString('utf-8');
                }
            } else if (req.body.csvContent || req.body.entradasCsvContent || req.body.saidasCsvContent) {
                entradasCsvContent = req.body.entradasCsvContent || req.body.csvContent;
                saidasCsvContent = req.body.saidasCsvContent;
            }

            if (!entradasCsvContent && !saidasCsvContent) {
                return res.status(400).json({ error: 'At least one CSV file (entradas or saidas) is required' });
            }

            let periodo: { inicio: Date; fim: Date } | undefined;
            if (periodoInicio && periodoFim) {
                periodo = { inicio: new Date(periodoInicio), fim: new Date(periodoFim) };
            }

            const result = await this.importService.importTransacoesCompleto(
                entradasCsvContent,
                saidasCsvContent,
                userId,
                periodo
            );

            if (result.isFailure) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(200).json({
                message: `Successfully imported: ${result.getValue().join(', ')}`
            });
        } catch (e) {
            next(e);
        }
    }
}


