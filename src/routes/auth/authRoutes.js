import express from 'express';
import rateLimit from 'express-rate-limit';
import { userLogin, userLogout } from '../../controllers/auth/authController.js';
import { verifyToken } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';

const router = express.Router();

// Throttle login attempts to slow down brute-force / credential-stuffing
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
});

// Auth
router.post('/login', loginLimiter, userLogin);
router.post('/logout',verifyToken, userLogout);

export default router;