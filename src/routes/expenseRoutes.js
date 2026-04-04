import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createManualExpense, getAllExpenses } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/api/expenses', verifyToken, getAllExpenses);
router.post('/api/expenses', verifyToken,  createManualExpense);

export default router;