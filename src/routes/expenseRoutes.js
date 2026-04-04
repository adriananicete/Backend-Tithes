import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createManualExpense, getAllExpenses } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', verifyToken, getAllExpenses);
router.post('/', verifyToken,  createManualExpense);

export default router;