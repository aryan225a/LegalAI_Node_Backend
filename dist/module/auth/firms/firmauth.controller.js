import firmAuthService from './firmauth.service.js';
class FirmAuthController {
    async register(req, res, next) {
        try {
            const result = await firmAuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { firmId, otp } = req.body;
            const result = await firmAuthService.verifyEmail(firmId, otp);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async loginStep1(req, res, next) {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip;
            const result = await firmAuthService.loginStep1(email, password, ipAddress);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async loginStep2(req, res, next) {
        try {
            const { twoFactorToken, otp } = req.body;
            const ipAddress = req.ip;
            const result = await firmAuthService.loginStep2(twoFactorToken, otp, ipAddress);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await firmAuthService.refreshTokens(refreshToken);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            await firmAuthService.logout(req.firm.id, refreshToken);
            res.status(200).json({ success: true, message: 'Logged out successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            const result = await firmAuthService.requestPasswordReset(email);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword } = req.body;
            const result = await firmAuthService.resetPassword(email, otp, newPassword);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            res.status(200).json({ success: true, data: req.firm });
        }
        catch (error) {
            next(error);
        }
    }
}
export default new FirmAuthController();
//# sourceMappingURL=firmauth.controller.js.map