import { Router } from 'express';
import { login, logout, refreshToken, getProfile, updateProfile, mfaSetup, mfaVerifyAndEnable, mfaVerifyLogin, mfaDisable, changePassword, passwordReset } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/login', authLimiter, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/mfa/setup', authenticate, mfaSetup);
router.post('/mfa/verify-and-enable', authenticate, mfaVerifyAndEnable);
router.post('/mfa/verify', mfaVerifyLogin);
router.post('/mfa/disable', authenticate, mfaDisable);
router.post('/change-password', authenticate, changePassword);
router.post('/password/reset', passwordResetLimiter, passwordReset);

export default router;
