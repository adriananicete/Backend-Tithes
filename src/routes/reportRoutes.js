import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js'
import { getExpenseReport, getTithesReport } from '../controllers/reportController.js';

const router = express.Router();

router.get('/tithes', verifyToken, getTithesReport);
router.get('/expense', verifyToken, getExpenseReport);

export default router;