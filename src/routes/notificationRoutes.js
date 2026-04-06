import express from 'express';
import { getNotifications, markAllAsRead, markAsRead } from '../controllers/notificationController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);

export default router;