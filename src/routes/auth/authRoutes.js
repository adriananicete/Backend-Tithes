import express from 'express';
import rateLimit from 'express-rate-limit';
import { userLogin, userLogout, refreshAccessToken } from '../../controllers/auth/authController.js';

const router = express.Router();

// Throttle login attempts to slow down brute-force / credential-stuffing
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
});

// Slightly looser limiter for token refresh (called automatically by clients)
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many refresh attempts. Try again later.' },
});

// Auth
router.post('/login', loginLimiter, userLogin);
router.post('/refresh', refreshLimiter, refreshAccessToken);
// Logout just clears cookies — must work even with an expired access token.
router.post('/logout', userLogout);

export default router;
