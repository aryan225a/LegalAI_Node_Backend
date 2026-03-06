import { Router } from 'express';
import firmAuthController from './firmauth.controller.js';
import { authenticateFirm } from '../../../middleware/auth.middleware.js';
import { authLimiter } from '../../../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', firmAuthController.register);
router.post('/verify-email', firmAuthController.verifyEmail);

router.post('/login', authLimiter, firmAuthController.loginStep1);
router.post('/login/verify-2fa', authLimiter, firmAuthController.loginStep2);


router.post('/refresh', firmAuthController.refreshToken);
router.post('/logout', authenticateFirm, firmAuthController.logout);

router.post('/forgot-password', authLimiter, firmAuthController.requestPasswordReset);
router.post('/reset-password', firmAuthController.resetPassword);

router.get('/me', authenticateFirm, firmAuthController.getMe);

export default router;