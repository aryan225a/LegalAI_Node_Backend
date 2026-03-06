import type { Request, Response, NextFunction } from 'express';
import firmAuthService from './firmauth.service.js';
import type { FirmAuthRequest } from '../../../middleware/auth.middleware.js';

class FirmAuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await firmAuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { firmId, otp } = req.body;
      const result = await firmAuthService.verifyEmail(firmId, otp);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async loginStep1(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;
      const result = await firmAuthService.loginStep1(email, password, ipAddress);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async loginStep2(req: Request, res: Response, next: NextFunction) {
    try {
      const { twoFactorToken, otp } = req.body;
      const ipAddress = req.ip;
      const result = await firmAuthService.loginStep2(twoFactorToken, otp, ipAddress);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await firmAuthService.refreshTokens(refreshToken);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async logout(req: FirmAuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await firmAuthService.logout(req.firm!.id, refreshToken);
      res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (error) { next(error); }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await firmAuthService.requestPasswordReset(email);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await firmAuthService.resetPassword(email, otp, newPassword);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getMe(req: FirmAuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: req.firm });
    } catch (error) { next(error); }
  }
}

export default new FirmAuthController();