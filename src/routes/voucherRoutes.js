import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { createVoucher, getAllVouchers } from '../controllers/voucherController.js';

const router = express.Router();

router.get('/', verifyToken, getAllVouchers);
router.post('/', verifyToken, createVoucher);

export default router;

