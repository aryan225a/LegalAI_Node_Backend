import type { Request, Response, NextFunction } from 'express';
import type { LawyerAuthRequest } from '../../../middleware/auth.middleware.js';
declare class LawyerAuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
    loginStep1(req: Request, res: Response, next: NextFunction): Promise<void>;
    loginStep2(req: Request, res: Response, next: NextFunction): Promise<void>;
    googleFirebase(req: Request, res: Response, next: NextFunction): Promise<void>;
    refreshToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    logout(req: LawyerAuthRequest, res: Response, next: NextFunction): Promise<void>;
    requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMe(req: LawyerAuthRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: LawyerAuthController;
export default _default;
//# sourceMappingURL=lawyerauth.controller.d.ts.map