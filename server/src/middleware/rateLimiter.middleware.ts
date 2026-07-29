import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 minutes
  max: config.rateLimitMaxRequests, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: false,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset rate limiter
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});
