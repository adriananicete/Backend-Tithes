import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js'
import { exportTithesExcel, exportTithesPDF, getExpenseReport, getTithesReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/tithes', verifyToken, getTithesReport);
router.get('/expense', verifyToken, getExpenseReport);
router.get('/tithes/export/excel', verifyToken, exportTithesExcel);
router.get('/tithes/export/pdf', verifyToken, exportTithesPDF);

export default router;