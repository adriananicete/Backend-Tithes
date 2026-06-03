import bcrypt from 'bcrypt';
import { User } from '../../models/User.js';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    setAuthCookies,
    clearAuthCookies,
} from '../../utils/authTokens.js';

export const userLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Find if user exist
    const findUser = await User.findOne({ email });
    if (!findUser) return res.status(400).json({error: 'User not Found'});

    // checks if the user is Active
    if (!findUser.isActive) return res.status(403).json({error: 'User Deactivated'});

    // checks the password
    const isMatch = await bcrypt.compare(password, findUser.password);
     if (!isMatch) return res.status(400).json({error: 'Invalid Credentials'});

    // Issue short-lived access + long-lived refresh tokens as httpOnly cookies.
    const accessToken = signAccessToken(findUser);
    const refreshToken = signRefreshToken(findUser);
    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({
        status: 'Login Successfull',
        data: {
            id: findUser._id,
            name: findUser.name,
            email: findUser.email,
            role: findUser.role
        },
        // Still returned for backward compatibility with header-based clients
        // during the cookie-auth transition. New clients ignore this.
        token: accessToken
    });
    } catch (error) {
        next(error);
    }

};

// Exchange a valid refresh cookie for a fresh access token (and a rotated
// refresh token). Returns 401 if the refresh cookie is missing/invalid so the
// client falls through to logout.
export const refreshAccessToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) return res.status(401).json({ error: 'No refresh token' });

        const decoded = verifyRefreshToken(token);

        // Ensure the user still exists and is active before re-issuing.
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            clearAuthCookies(res);
            return res.status(401).json({ error: 'User no longer active' });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        setAuthCookies(res, { accessToken, refreshToken });

        res.status(200).json({ status: 'Token refreshed', token: accessToken });
    } catch (error) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
};

export const userLogout = async (req, res, next) => {
    clearAuthCookies(res);
    res.status(200).json({
        status: 'Success',
        data: {
            message: 'User Logged out!'
        }
    })
};
