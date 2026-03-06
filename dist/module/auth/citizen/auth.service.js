import bcrypt from 'bcryptjs';
import prisma from '../../../config/database.js';
import { AppError } from '../../../middleware/error.middleware.js';
import cacheService from '../../../services/cache.service.js';
import { generateCitizenTokens, verifyRefreshToken } from '../../../utils/jwt.utils.js';
class AuthService {
    async register(email, password, name) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                provider: 'LOCAL',
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
            },
        });
        const { accessToken, refreshToken } = generateCitizenTokens(user.id);
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user,
            accessToken,
            refreshToken,
        };
    }
    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user || !user.password) {
            throw new AppError('Invalid credentials', 401);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const { accessToken, refreshToken } = generateCitizenTokens(user.id);
        await this.storeRefreshToken(user.id, refreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.userType !== 'CITIZEN') {
            throw new AppError('Invalid refresh token for citizen account', 401);
        }
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                userId: decoded.sub,
                expiresAt: { gte: new Date() },
            },
        });
        if (!storedToken) {
            throw new AppError('Invalid refresh token', 401);
        }
        const { accessToken, refreshToken: newRefreshToken } = generateCitizenTokens(decoded.sub);
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });
        await this.storeRefreshToken(decoded.sub, newRefreshToken);
        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    async logout(userId, refreshToken) {
        await prisma.refreshToken.deleteMany({
            where: {
                userId,
                token: refreshToken,
            },
        });
        await cacheService.clearUserCache(userId);
        await cacheService.clearUserRateLimits(userId);
    }
    async storeRefreshToken(userId, token) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }
}
export default new AuthService();
//# sourceMappingURL=auth.service.js.map