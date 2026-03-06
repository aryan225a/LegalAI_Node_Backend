import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../../middleware/auth.middleware.js';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import { authLimiter } from '../../../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, (req: Request, res: Response, next: NextFunction) => 
  authController.logout(req as AuthRequest, res, next)
);

router.post('/google/firebase', authLimiter, authController.googleFirebase);

router.get('/me', authenticate, (req: Request, res: Response, next: NextFunction) => 
  authController.getMe(req as AuthRequest, res, next)
);

export default router;
