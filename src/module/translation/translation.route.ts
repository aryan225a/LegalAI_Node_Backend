import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import translationController from './translation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import type { AuthRequest } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/translate', (req: Request, res: Response, next: NextFunction) =>
  translationController.translate(req as AuthRequest, res, next)
);
router.post('/detect-language', (req: Request, res: Response, next: NextFunction) =>
  translationController.detectLanguage(req as AuthRequest, res, next)
);

router.get('/history', (req: Request, res: Response, next: NextFunction) =>
  translationController.getUserTranslations(req as AuthRequest, res, next)
);

export default router;