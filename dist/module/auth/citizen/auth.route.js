import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import { authLimiter } from '../../../middleware/rateLimiter.middleware.js';
const router = Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.post('/google/firebase', authLimiter, authController.googleFirebase);
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
export default router;
//# sourceMappingURL=auth.route.js.map