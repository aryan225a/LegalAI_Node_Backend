import type { Request, Response, NextFunction } from 'express';
import type { FirmAuthRequest } from '../../../middleware/auth.middleware.js';
declare class FirmAuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
    loginStep1(req: Request, res: Response, next: NextFunction): Promise<void>;
    loginStep2(req: Request, res: Response, next: NextFunction): Promise<void>;
    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: FirmAuthRequest, res: Response, next: NextFunction): Promise<void>;
    requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMe(req: FirmAuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: FirmAuthController;
export default _default;
//# sourceMappingURL=firmauth.controller.d.ts.map