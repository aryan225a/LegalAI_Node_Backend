import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';

interface RateLimitRequest extends Request {
  rateLimit?: {
    limit: number;
    current: number;
    remaining: number;
    resetTime?: Date;
  };
}

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: RateLimitRequest, res: Response) => {
    const retryAfter = req.rateLimit?.resetTime
      ? Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000)
      : 900;

    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    });
  },
});


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    });
  },
});


export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipFailedRequests: true,
  message: {
    success: false,
    message: 'Upload limit exceeded. Maximum 10 uploads per hour.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many uploads. Maximum 10 per hour.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    });
  },
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  skipFailedRequests: true,
  message: {
    success: false,
    message: 'Too many messages. Please slow down.',
    code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Sending messages too quickly. Please wait a moment.',
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
    });
  },
});


function formatUserKey(userId: string, limiterName: string) {
  return `ratelimit:user:${userId}:${limiterName}`;
}

function persistentUserLimiter(limiterName: string, max: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return next();
      }

      const key = formatUserKey(userId, limiterName);

      const current = await redis.incr(key);

      if (current === 1) {
      }

      if (current > max) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Rate limit exceeded for this session. You will be allowed again after logout.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      (req as any).rateLimit = { limit: max, current, remaining: Math.max(0, max - current) };
      return next();
    } catch (error) {
      console.error('Persistent rate limiter error:', error);
      return next();
    }
  };
}

export const persistentMessageLimiter = persistentUserLimiter('message', 20);
export const persistentUploadLimiter = persistentUserLimiter('upload', 10);
export const persistentApiLimiter = persistentUserLimiter('api', parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'));
