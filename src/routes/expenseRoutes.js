import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { createManualExpense, getAllExpenses, getExpensesByCategory } from '../controllers/expenseController.js';

const router = express.Router();

// by-category is aggregated only (category totals, no requester or approver
// names) and is what the dashboard chart uses, so it stays open to every role.
//
// The full ledger is admin/auditor only — matching the client's own
// `viewExpense` gate. That check was missing entirely until now: any member
// could pull every expense row straight from the API. The UI hid the page; the
// API did not.
router.get('/by-category', verifyToken, getExpensesByCategory);
router.get('/', verifyToken, authorizeRoles('admin', 'auditor'), getAllExpenses);
router.post('/', verifyToken, authorizeRoles('admin'), createManualExpense);

export default router;
