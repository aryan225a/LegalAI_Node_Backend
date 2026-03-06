import bcrypt from 'bcryptjs';
import prisma from '../../../config/database.js';
import { AppError } from '../../../middleware/error.middleware.js';
import { logger } from '../../../utils/logger.js';
import encryptionService from '../../../services/encryption.service.js';
import otpService from '../../../services/otp.service.js';
import notificationService from '../../../services/notification.service.js';
import cacheService from '../../../services/cache.service.js';
import { validateFirmRegistration, validatePasswordStrength } from '../../../utils/validator.js';
import { generateFirmTokens, generateTwoFaTempToken, verifyTwoFaTempToken, verifyRefreshToken, } from '../../../utils/jwt.utils.js';
class FirmAuthService {
    async register(input) {
        const { email, password, name, firmName, phone, registrationNumber, gstNumber, city, state, address, } = input;
        const validationErrors = validateFirmRegistration({
            email, password, name, firmName, phone,
            registrationNumber, gstNumber, city, state,
        });
        const existing = await prisma.firmUser.findUnique({ where: { email } });
        if (existing) {
            throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
        }
        const allFormatsPassed = validationErrors.length === 0;
        const verificationStatus = allFormatsPassed ? 'AUTO_VERIFIED' : 'FORMAT_FAILED';
        const hashedPassword = await bcrypt.hash(password, 12);
        const encryptedPhone = encryptionService.encrypt(phone.replace(/\s|-/g, ''));
        const encryptedRegistrationNumber = encryptionService.encrypt(registrationNumber.trim().toUpperCase());
        const encryptedGstNumber = gstNumber
            ? encryptionService.encrypt(gstNumber.trim().toUpperCase())
            : undefined;
        const firm = await prisma.$transaction(async (tx) => {
            const created = await tx.firmUser.create({
                data: {
                    email,
                    name,
                    firmName,
                    password: hashedPassword,
                    encryptedPhone,
                    encryptedRegistrationNumber,
                    encryptedGstNumber,
                    city,
                    state,
                    address,
                    emailVerified: false,
                    phoneVerified: false,
                    registrationFormatValid: allFormatsPassed,
                    verificationStatus,
                    verifiedAt: allFormatsPassed ? new Date() : null,
                    validationErrors: validationErrors.length > 0
                        ? validationErrors
                        : undefined,
                },
                select: {
                    id: true, email: true, name: true,
                    firmName: true, verificationStatus: true,
                    city: true, state: true,
                },
            });
            await tx.firmTwoFactorAuth.create({
                data: {
                    firmId: created.id,
                    method: 'EMAIL',
                    isEnabled: true,
                    isSetupComplete: true,
                    hashedBackupCodes: [],
                },
            });
            return created;
        });
        try {
            const otp = await otpService.generate(firm.id, 'firm', 'EMAIL_VERIFICATION');
            await notificationService.sendOtpEmail({
                to: email,
                otp,
                purpose: 'EMAIL_VERIFICATION',
                recipientName: `${name} (${firmName})`,
            });
        }
        catch (err) {
            logger.warn('OTP dispatch failed after firm registration', { firmId: firm.id, err });
        }
        logger.info('Firm registered', {
            firmId: firm.id,
            firmName,
            verificationStatus,
            formatErrors: validationErrors.length,
        });
        return {
            firm,
            verificationStatus,
            validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
            message: allFormatsPassed
                ? 'Firm account created. Check your email for the verification code.'
                : 'Registration submitted with validation errors — see validationErrors.',
        };
    }
    async verifyEmail(firmId, otp) {
        await otpService.verify(firmId, 'firm', 'EMAIL_VERIFICATION', otp);
        const firm = await prisma.firmUser.update({
            where: { id: firmId },
            data: { emailVerified: true },
            select: { id: true, email: true, firmName: true, verificationStatus: true },
        });
        logger.info('Firm email verified', { firmId });
        return firm;
    }
    async loginStep1(email, password, ipAddress) {
        const firm = await prisma.firmUser.findUnique({
            where: { email },
            select: {
                id: true, email: true, name: true, firmName: true,
                password: true, isLocked: true, lockReason: true,
                verificationStatus: true,
                failedLoginAttempts: true,
                knownIpAddresses: true,
            },
        });
        if (!firm || !firm.password) {
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        if (firm.isLocked) {
            throw new AppError(`Account is locked. Reason: ${firm.lockReason || 'Security hold'}`, 403, 'ACCOUNT_LOCKED');
        }
        if (firm.verificationStatus === 'FORMAT_FAILED') {
            throw new AppError('Account has registration validation errors. Please contact support.', 403, 'ACCOUNT_NOT_VERIFIED');
        }
        const isPasswordValid = await bcrypt.compare(password, firm.password);
        if (!isPasswordValid) {
            await this.handleFailedLogin(firm.id, firm.failedLoginAttempts);
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        await prisma.firmUser.update({
            where: { id: firm.id },
            data: { failedLoginAttempts: 0 },
        });
        const isNewIp = ipAddress && !firm.knownIpAddresses.includes(ipAddress);
        if (isNewIp) {
            logger.warn('Firm login from new IP address', {
                firmId: firm.id,
                ipAddress,
                knownIps: firm.knownIpAddresses,
            });
        }
        const otp = await otpService.generate(firm.id, 'firm', 'LOGIN_2FA');
        await notificationService.sendOtpEmail({
            to: firm.email,
            otp,
            purpose: 'LOGIN_2FA',
            recipientName: `${firm.name} (${firm.firmName})`,
        });
        const twoFactorToken = generateTwoFaTempToken(firm.id, 'FIRM_ADMIN');
        logger.info('Firm login step-1 complete', {
            firmId: firm.id,
            isNewIp,
        });
        return {
            requiresTwoFactor: true,
            twoFactorToken,
            isNewIp,
            message: `OTP sent to ${firm.email}. Valid for 10 minutes.`,
        };
    }
    async loginStep2(twoFactorToken, otp, ipAddress) {
        const tokenPayload = verifyTwoFaTempToken(twoFactorToken);
        const firmId = tokenPayload.sub;
        if (tokenPayload.userType !== 'FIRM_ADMIN') {
            throw new AppError('Invalid token type for firm login', 401, 'INVALID_TOKEN_TYPE');
        }
        await otpService.verify(firmId, 'firm', 'LOGIN_2FA', otp);
        const firm = await prisma.firmUser.findUnique({
            where: { id: firmId },
            select: {
                id: true, email: true, name: true, firmName: true,
                verificationStatus: true, city: true, state: true,
                knownIpAddresses: true,
            },
        });
        if (!firm) {
            throw new AppError('Firm account not found', 404, 'USER_NOT_FOUND');
        }
        let updatedIps = firm.knownIpAddresses;
        if (ipAddress && !updatedIps.includes(ipAddress)) {
            updatedIps = [...updatedIps, ipAddress].slice(-20); // Keep last 20 IPs
        }
        await prisma.firmUser.update({
            where: { id: firmId },
            data: {
                lastLoginAt: new Date(),
                knownIpAddresses: updatedIps,
            },
        });
        const { accessToken, refreshToken } = generateFirmTokens(firmId, firm.verificationStatus);
        await this.storeRefreshToken(firmId, refreshToken, ipAddress);
        logger.info('Firm login complete', { firmId });
        return {
            firm: {
                id: firm.id,
                email: firm.email,
                name: firm.name,
                firmName: firm.firmName,
                userType: 'FIRM_ADMIN',
                verificationStatus: firm.verificationStatus,
                city: firm.city,
                state: firm.state,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshTokens(refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.userType !== 'FIRM_ADMIN') {
            throw new AppError('Invalid refresh token for firm', 401, 'INVALID_REFRESH');
        }
        const storedToken = await prisma.firmRefreshToken.findFirst({
            where: {
                firmId: decoded.sub,
                token: refreshToken,
                expiresAt: { gte: new Date() },
            },
        });
        if (!storedToken) {
            throw new AppError('Refresh token not found or expired', 401, 'INVALID_REFRESH');
        }
        const firm = await prisma.firmUser.findUnique({
            where: { id: decoded.sub },
            select: { id: true, verificationStatus: true, isLocked: true },
        });
        if (!firm || firm.isLocked) {
            throw new AppError('Account is not accessible', 403, 'ACCOUNT_INACCESSIBLE');
        }
        await prisma.firmRefreshToken.delete({ where: { id: storedToken.id } });
        const { accessToken, refreshToken: newRefreshToken } = generateFirmTokens(firm.id, firm.verificationStatus);
        await this.storeRefreshToken(firm.id, newRefreshToken);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async logout(firmId, refreshToken) {
        await prisma.firmRefreshToken.deleteMany({
            where: { firmId, token: refreshToken },
        });
        await cacheService.clearUserCache(firmId);
        logger.info('Firm logged out', { firmId });
    }
    async requestPasswordReset(email) {
        const firm = await prisma.firmUser.findUnique({
            where: { email },
            select: { id: true, name: true, firmName: true, email: true, isLocked: true },
        });
        if (!firm || firm.isLocked) {
            return { message: 'If that email is registered, a reset code has been sent.' };
        }
        const otp = await otpService.generate(firm.id, 'firm', 'PASSWORD_RESET');
        await notificationService.sendOtpEmail({
            to: firm.email,
            otp,
            purpose: 'PASSWORD_RESET',
            recipientName: `${firm.name} (${firm.firmName})`,
        });
        return { message: 'If that email is registered, a reset code has been sent.' };
    }
    async resetPassword(email, otp, newPassword) {
        const firm = await prisma.firmUser.findUnique({
            where: { email },
            select: { id: true },
        });
        if (!firm) {
            throw new AppError('Invalid request', 400, 'INVALID_RESET');
        }
        await otpService.verify(firm.id, 'firm', 'PASSWORD_RESET', otp);
        const pwErr = validatePasswordStrength(newPassword, 12);
        if (pwErr)
            throw new AppError(pwErr.reason, 400, 'WEAK_PASSWORD');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.firmUser.update({
            where: { id: firm.id },
            data: {
                password: hashedPassword,
                failedLoginAttempts: 0,
                isLocked: false,
                lockedAt: null,
                lockReason: null,
            },
        });
        await prisma.firmRefreshToken.deleteMany({ where: { firmId: firm.id } });
        logger.info('Firm password reset', { firmId: firm.id });
        return { message: 'Password reset successfully.' };
    }
    async handleFailedLogin(firmId, currentAttempts) {
        const newAttempts = currentAttempts + 1;
        const shouldLock = newAttempts >= 5;
        await prisma.firmUser.update({
            where: { id: firmId },
            data: {
                failedLoginAttempts: newAttempts,
                ...(shouldLock && {
                    isLocked: true,
                    lockedAt: new Date(),
                    lockReason: 'Too many failed login attempts',
                }),
            },
        });
        if (shouldLock) {
            logger.warn('Firm account locked after 5 failed attempts', { firmId });
        }
    }
    async storeRefreshToken(firmId, token, ipAddress) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1);
        await prisma.firmRefreshToken.create({
            data: { firmId, token, expiresAt, ipAddress },
        });
    }
}
export const firmAuthService = new FirmAuthService();
export default firmAuthService;
//# sourceMappingURL=firmauth.service.js.map