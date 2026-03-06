import type { Request, Response, NextFunction } from 'express';
import authService from './auth.service.js';
import firebaseAuthService from '../../../services/firebase-auth.service.js';
import type { AuthRequest } from '../../../middleware/auth.middleware.js';
import prisma from '../../../config/database.js';
import { AppError } from '../../../middleware/error.middleware.js';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const result = await authService.register(email, password, name);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user!.id;

      await authService.logout(userId, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleFirebase(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;

      if (!idToken || typeof idToken !== 'string') {
        throw new AppError('idToken is required', 400, 'MISSING_ID_TOKEN');
      }

      const result = await firebaseAuthService.citizenGoogleLogin(idToken);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

}

export default new AuthController();