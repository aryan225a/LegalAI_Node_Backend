import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware.js';
const JWT_SECRET = () => {
    if (!process.env.JWT_SECRET)
        throw new Error('JWT_SECRET not set');
    return process.env.JWT_SECRET;
};
const JWT_REFRESH_SECRET = () => {
    if (!process.env.JWT_REFRESH_SECRET)
        throw new Error('JWT_REFRESH_SECRET not set');
    return process.env.JWT_REFRESH_SECRET;
};
export function generateCitizenTokens(citizenId) {
    const payload = { sub: citizenId, userType: 'CITIZEN' };
    const accessToken = jwt.sign(payload, JWT_SECRET(), {
        expiresIn: '24h',
    });
    const refreshToken = jwt.sign({ sub: citizenId, userType: 'CITIZEN' }, JWT_REFRESH_SECRET(), { expiresIn: '30d' });
    return { accessToken, refreshToken };
}
export function generateLawyerTokens(lawyerId, verificationStatus) {
    const payload = {
        sub: lawyerId,
        userType: 'LAWYER',
        twoFactorVerified: true,
        verificationStatus,
    };
    const accessToken = jwt.sign(payload, JWT_SECRET(), {
        expiresIn: '12h',
    });
    const refreshToken = jwt.sign({ sub: lawyerId, userType: 'LAWYER' }, JWT_REFRESH_SECRET(), { expiresIn: '7d' });
    return { accessToken, refreshToken };
}
export function generateFirmTokens(firmId, verificationStatus) {
    const payload = {
        sub: firmId,
        userType: 'FIRM_ADMIN',
        twoFactorVerified: true,
        verificationStatus,
    };
    const accessToken = jwt.sign(payload, JWT_SECRET(), {
        expiresIn: '4h',
    });
    const refreshToken = jwt.sign({ sub: firmId, userType: 'FIRM_ADMIN' }, JWT_REFRESH_SECRET(), { expiresIn: '1d' });
    return { accessToken, refreshToken };
}
export function generateTwoFaTempToken(userId, userType) {
    const payload = {
        sub: userId,
        userType,
        purpose: 'TWO_FA_PENDING',
    };
    return jwt.sign(payload, JWT_SECRET(), { expiresIn: '10m' });
}
export function verifyTwoFaTempToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET());
        if (decoded.purpose !== 'TWO_FA_PENDING') {
            throw new AppError('Invalid 2FA token', 401, 'INVALID_2FA_TOKEN');
        }
        return decoded;
    }
    catch (error) {
        if (error instanceof AppError)
            throw error;
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Verification session expired. Please login again.', 401, 'TWO_FA_TOKEN_EXPIRED');
        }
        throw new AppError('Invalid 2FA token', 401, 'INVALID_2FA_TOKEN');
    }
}
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET());
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Refresh token expired. Please login again.', 401, 'REFRESH_EXPIRED');
        }
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH');
    }
}
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET());
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expired. Please refresh.', 401, 'TOKEN_EXPIRED');
        }
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
}
//# sourceMappingURL=jwt.utils.js.map