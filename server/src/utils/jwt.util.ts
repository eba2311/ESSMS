import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../types';

export interface TokenPayload {
  userId: string;
  id: string;
  role: UserRole;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate JWT access token
 * @param payload - Token payload containing user info
 * @returns JWT token string
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, config.jwtSecret, options);
};

/**
 * Generate JWT refresh token
 * @param payload - Token payload containing user info
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: config.jwtRefreshExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, config.jwtRefreshSecret, options);
};

/**
 * Verify and decode access token
 * @param token - JWT token string
 * @returns Decoded token payload
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, config.jwtSecret) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify and decode refresh token
 * @param token - JWT refresh token string
 * @returns Decoded token payload
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded token payload or null
 */
export const decodeToken = (token: string): DecodedToken | null => {
  return jwt.decode(token) as DecodedToken | null;
};
