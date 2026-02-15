import { Router } from 'express';
import { Container } from 'typedi';
import multer from 'multer';
import { isAuth, authorize, Role } from '../middlewares/index.js';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import ImportController from '../../controllers/ImportController.js';

const route = Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

/**
 * @openapi
 * components:
 *   schemas:
 *     ImportResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Successfully imported: entradas, saídas, despesas mensais"
 *     ImportError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "At least one CSV file (entradas or saidas) is required"
 */
export default (app: Router) => {
    app.use('/import', route);

    const ctrl = Container.get(ImportController);

    /**
     * @openapi
     * /import/contas:
     *   post:
     *     tags:
     *       - Import
     *     summary: Import accounts from CSV
     *     description: |
     *       Imports accounts (Contas) from a Notion CSV export.
     *
     *       **CSV Headers:** `Conta,Despesas,Receitas,Todas as Despesas,Todas as Receitas,Total,Total Numérico,Valor Inicial`
     *
     *       Automatically detects if an account name contains "cartão" and creates a CartãoCredito instead of a Conta.
     *       Uses account name as icon (e.g., "Continente.jpg").
     *
     *       You can either:
     *       - Upload a CSV file (multipart/form-data)
     *       - Send CSV content as JSON string
     *
     *       Requires authentication. Admin only.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *                 description: CSV file to upload
     *               userId:
     *                 type: string
     *                 description: User domain ID who owns the accounts
     *                 example: "USR00000000001"
     *               bancoId:
     *                 type: string
     *                 description: Optional Banco domain ID to associate with the accounts
     *                 example: "BNC00000000001"
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *             properties:
     *               csvContent:
     *                 type: string
     *                 description: Raw CSV content as string
     *                 example: "Conta,Despesas,Receitas,Total\nBanco CTT,100,200,300"
     *               userId:
     *                 type: string
     *                 description: User domain ID who owns the accounts
     *                 example: "USR00000000001"
     *               bancoId:
     *                 type: string
     *                 description: Optional Banco domain ID to associate with the accounts
     *                 example: "BNC00000000001"
     *     responses:
     *       200:
     *         description: Accounts imported successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ImportResponse'
     *       400:
     *         description: Validation error or import failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ImportError'
     *       401:
     *         description: User not authenticated
     */
    route.post(
        '/contas',
        isAuth,
        authorize([Role.Admin]),
        upload.single('file'),
        (req, res, next) => ctrl.importContas(req as AuthenticatedRequest, res, next)
    );

    /**
     * @openapi
     * /import/transacoes:
     *   post:
     *     tags:
     *       - Import
     *     summary: Import transactions from CSV files
     *     description: |
     *       Unified endpoint to import transactions (Entradas and/or Saídas) from Notion CSV exports.
     *       Optionally accepts a third file for monthly expenses (Despesas Mensais).
     *
     *       **CSV Headers:**
     *       - **Entradas:** `Nome,Categoria,Conta,Data,Despesa na Conta,Reembolso,Saiu,Valor,...`
     *       - **Saídas:** `Nome,Categoria,Conta,Data,Despesa no Cartão,Valor,...`
     *       - **Despesas Mensais:** `Despesa,Valor`
     *
     *       **Features:**
     *       - Auto-detects if target is a Card (contains "Cartão") or Account
     *       - Creates categories if they don't exist
     *       - Unified logic for both entradas and saidas
     *       - Detects duplicates
     *
     *       **Transaction Status:**
     *       - **Entrada:** Always "Concluído"
     *       - **Saída:** Always "Concluído"
     *       - **Crédito:** "Concluído" by default, "Pendente" if within provided period
     *       - **Reembolso:** "Concluído" by default, "Pendente" if within provided period
     *       - **Despesa Mensal:** Always "Concluído"
     *
     *       **Period Handling:**
     *       If `periodoInicio` and `periodoFim` are provided, Crédito and Reembolso transactions
     *       with dates within that period will be marked as "Pendente" instead of "Concluído".
     *
     *       **Monthly Expenses (Despesas Mensais):**
     *       - Origin account (contaOrigemId): Where money comes from
     *       - Destination account: "Despesas Mensais" (created automatically)
     *
     *       You can upload 1, 2, or 3 files simultaneously, or send CSV content as JSON strings.
     *
     *       Requires authentication. Admin only.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *             properties:
     *               entradas:
     *                 type: string
     *                 format: binary
     *                 description: CSV file with income transactions (optional)
     *               saidas:
     *                 type: string
     *                 format: binary
     *                 description: CSV file with expense transactions (optional)
     *               despesasMensais:
     *                 type: string
     *                 format: binary
     *                 description: CSV file with monthly expenses (optional)
     *               userId:
     *                 type: string
     *                 description: User domain ID who owns the transactions
     *                 example: "USR00000000001"
     *               contaOrigemId:
     *                 type: string
     *                 description: Origin account ID for monthly expenses - where money comes from (required if despesasMensais provided)
     *                 example: "CNT00000000001"
     *               periodoInicio:
     *                 type: string
     *                 format: date
     *                 description: Period start date (optional) - Crédito/Reembolso within this period will be Pendente
     *                 example: "2026-01-01"
     *               periodoFim:
     *                 type: string
     *                 format: date
     *                 description: Period end date (optional) - Crédito/Reembolso within this period will be Pendente
     *                 example: "2026-01-31"
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *             properties:
     *               entradasCsvContent:
     *                 type: string
     *                 description: Raw CSV content for entradas as string (optional)
     *               saidasCsvContent:
     *                 type: string
     *                 description: Raw CSV content for saidas as string (optional)
     *               despesasMensaisCsvContent:
     *                 type: string
     *                 description: Raw CSV content for monthly expenses as string (optional)
     *               userId:
     *                 type: string
     *                 description: User domain ID who owns the transactions
     *                 example: "USR00000000001"
     *               contaOrigemId:
     *                 type: string
     *                 description: Origin account ID for monthly expenses (required if despesasMensaisCsvContent provided)
     *                 example: "CNT00000000001"
     *               periodoInicio:
     *                 type: string
     *                 format: date
     *                 description: Period start date (optional) - Crédito/Reembolso within this period will be Pendente
     *                 example: "2026-01-01"
     *               periodoFim:
     *                 type: string
     *                 format: date
     *                 description: Period end date (optional) - Crédito/Reembolso within this period will be Pendente
     *                 example: "2026-01-31"
     *     responses:
     *       200:
     *         description: Transactions imported successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ImportResponse'
     *       400:
     *         description: Validation error or import failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ImportError'
     *       401:
     *         description: User not authenticated
     */
    route.post(
        '/transacoes',
        isAuth,
        authorize([Role.Admin]),
        upload.fields([
            { name: 'entradas', maxCount: 1 },
            { name: 'saidas', maxCount: 1 },
            { name: 'despesasMensais', maxCount: 1 }
        ]),
        (req, res, next) => ctrl.importTransacoes(req as AuthenticatedRequest, res, next)
    );
};


