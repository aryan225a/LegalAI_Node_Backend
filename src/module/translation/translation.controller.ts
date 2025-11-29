import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import translationService from './translation.service.js';

class TranslationController {
  async translate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { text, sourceLang, targetLang } = req.body;

      const result = await translationService.translate(
        userId,
        text,
        sourceLang,
        targetLang
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async detectLanguage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required',
        });
      }

      const result = await translationService.detectLanguage(text);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserTranslations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const translations = await translationService.getUserTranslations(userId);

      res.status(200).json({
        success: true,
        data: translations,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TranslationController();