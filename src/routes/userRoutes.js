import express from 'express';
import { changePassword } from '../controllers/userController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.patch('/change-password',verifyToken, changePassword);

export default router;