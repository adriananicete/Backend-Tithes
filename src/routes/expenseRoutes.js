import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createManualExpense, getAllExpenses, getExpensesByCategory } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/by-category', verifyToken, getExpensesByCategory);
router.get('/', verifyToken, getAllExpenses);
router.post('/', verifyToken,  createManualExpense);

export default router;