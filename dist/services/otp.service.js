import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import redis from '../config/redis.js';
import { AppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';
const OTP_DIGITS = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 3;
const OTP_HOURLY_LIMIT = 5;
const BCRYPT_ROUNDS = 10;
class OtpService {
    async generate(userId, userType, purpose, ipAddress, userAgent) {
        await this.enforceHourlyLimit(userId, userType);
        await this.invalidateExisting(userId, userType, purpose);
        const rawOtp = this.generateRawOtp();
        if (process.env.NODE_ENV !== 'production') {
            logger.info(`[DEV] OTP for ${userId} (${purpose}): ${rawOtp}`);
        }
        const hashedOtp = await bcrypt.hash(rawOtp, BCRYPT_ROUNDS);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        if (userType === 'lawyer') {
            await prisma.otpRecord.create({
                data: {
                    lawyerId: userId,
                    hashedOtp,
                    purpose,
                    maxAttempts: OTP_MAX_ATTEMPTS,
                    expiresAt,
                    ipAddress,
                    userAgent,
                },
            });
        }
        else {
            await prisma.firmOtpRecord.create({
                data: {
                    firmId: userId,
                    hashedOtp,
                    purpose,
                    maxAttempts: OTP_MAX_ATTEMPTS,
                    expiresAt,
                    ipAddress,
                    userAgent,
                },
            });
        }
        await this.incrementHourlyCount(userId, userType);
        logger.info('OTP generated', { userId, userType, purpose });
        return rawOtp;
    }
    async verify(userId, userType, purpose, submittedOtp) {
        const record = await this.findActiveRecord(userId, userType, purpose);
        if (!record) {
            throw new AppError('No valid OTP found. Please request a new one.', 400, 'OTP_NOT_FOUND');
        }
        if (new Date() > record.expiresAt) {
            await this.killRecord(record.id, userType);
            throw new AppError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
        }
        if (record.attempts >= record.maxAttempts) {
            await this.killRecord(record.id, userType);
            throw new AppError('Too many incorrect attempts. Please request a new OTP.', 400, 'OTP_MAX_ATTEMPTS');
        }
        await this.incrementAttempts(record.id, userType);
        const isValid = await bcrypt.compare(submittedOtp, record.hashedOtp);
        if (!isValid) {
            const remainingAttempts = record.maxAttempts - record.attempts - 1;
            if (remainingAttempts <= 0) {
                await this.killRecord(record.id, userType);
                throw new AppError('Invalid OTP. No attempts remaining. Please request a new one.', 400, 'OTP_INVALID_FINAL');
            }
            throw new AppError(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`, 400, 'OTP_INVALID');
        }
        await this.markUsed(record.id, userType);
        logger.info('OTP verified successfully', { userId, userType, purpose });
    }
    generateRawOtp() {
        const otp = randomInt(0, 999999);
        return otp.toString().padStart(OTP_DIGITS, '0');
    }
    async enforceHourlyLimit(userId, userType) {
        const key = `otp:hourly:${userType}:${userId}`;
        const current = await redis.get(key);
        const count = current ? parseInt(current) : 0;
        if (count >= OTP_HOURLY_LIMIT) {
            throw new AppError('Too many OTP requests. Please try again in an hour.', 429, 'OTP_RATE_LIMIT');
        }
    }
    async incrementHourlyCount(userId, userType) {
        const key = `otp:hourly:${userType}:${userId}`;
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, 3600);
        }
    }
    async invalidateExisting(userId, userType, purpose) {
        const now = new Date();
        if (userType === 'lawyer') {
            await prisma.otpRecord.updateMany({
                where: {
                    lawyerId: userId,
                    purpose,
                    usedAt: null,
                    invalidatedAt: null,
                    expiresAt: { gte: now },
                },
                data: { invalidatedAt: now },
            });
        }
        else {
            await prisma.firmOtpRecord.updateMany({
                where: {
                    firmId: userId,
                    purpose,
                    usedAt: null,
                    invalidatedAt: null,
                    expiresAt: { gte: now },
                },
                data: { invalidatedAt: now },
            });
        }
    }
    async findActiveRecord(userId, userType, purpose) {
        const now = new Date();
        if (userType === 'lawyer') {
            return prisma.otpRecord.findFirst({
                where: {
                    lawyerId: userId,
                    purpose,
                    usedAt: null,
                    invalidatedAt: null,
                    expiresAt: { gte: now },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            return prisma.firmOtpRecord.findFirst({
                where: {
                    firmId: userId,
                    purpose,
                    usedAt: null,
                    invalidatedAt: null,
                    expiresAt: { gte: now },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
    }
    async incrementAttempts(recordId, userType) {
        if (userType === 'lawyer') {
            await prisma.otpRecord.update({
                where: { id: recordId },
                data: { attempts: { increment: 1 } },
            });
        }
        else {
            await prisma.firmOtpRecord.update({
                where: { id: recordId },
                data: { attempts: { increment: 1 } },
            });
        }
    }
    async markUsed(recordId, userType) {
        if (userType === 'lawyer') {
            await prisma.otpRecord.update({
                where: { id: recordId },
                data: { usedAt: new Date() },
            });
        }
        else {
            await prisma.firmOtpRecord.update({
                where: { id: recordId },
                data: { usedAt: new Date() },
            });
        }
    }
    async killRecord(recordId, userType) {
        if (userType === 'lawyer') {
            await prisma.otpRecord.update({
                where: { id: recordId },
                data: { invalidatedAt: new Date() },
            });
        }
        else {
            await prisma.firmOtpRecord.update({
                where: { id: recordId },
                data: { invalidatedAt: new Date() },
            });
        }
    }
}
export const otpService = new OtpService();
export default otpService;
//# sourceMappingURL=otp.service.js.map