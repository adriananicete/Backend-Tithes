import express from 'express';
import { userLogin, userLogout } from '../../controllers/auth/authController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

// Auth
router.post('/login', userLogin);
router.post('/logout',verifyToken, userLogout);

export default router;