import { Router } from 'express';
import lawyerAuthController from './lawyerauth.controller.js';
import { authenticateLawyer } from '../../../middleware/auth.middleware.js';
import { authLimiter } from '../../../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', lawyerAuthController.register);
router.post('/verify-email', lawyerAuthController.verifyEmail);

router.post('/login', authLimiter, lawyerAuthController.loginStep1);

router.post('/login/verify-2fa', authLimiter, lawyerAuthController.loginStep2);

router.post('/google/firebase', authLimiter, lawyerAuthController.googleFirebase);

router.post('/refresh', lawyerAuthController.refreshToken);
router.post('/logout', authenticateLawyer, lawyerAuthController.logout);

router.post('/forgot-password', authLimiter, lawyerAuthController.requestPasswordReset);
router.post('/reset-password', lawyerAuthController.resetPassword);

router.get('/me', authenticateLawyer, lawyerAuthController.getMe);

export default router;