import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { approveTithes, getAllTithes, rejectTithes, submitTithes, updateTithes } from '../controllers/tithesController.js';

const router = express.Router();

router.get('/', verifyToken, getAllTithes);
router.post('/', verifyToken, submitTithes);
router.patch('/:id', verifyToken, updateTithes);
router.patch('/:id/approve', verifyToken, approveTithes);
router.patch('/:id/reject', verifyToken, rejectTithes);

export default router;