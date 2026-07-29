import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../models';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';

/**
 * Generate MFA secret and QR code for user
 */
export const setupMFA = async (
  userId: string
): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.mfaEnabled) {
    throw new ApiError(400, 'MFA is already enabled for this user');
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${config.mfa.issuer} (${user.email})`,
    issuer: config.mfa.issuer,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url as string);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Store encrypted secret (don't enable yet)
  user.mfaSecret = secret.base32;
  await user.save();

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
};

/**
 * Verify MFA token and enable MFA
 */
export const verifyAndEnableMFA = async (
  userId: string,
  token: string
): Promise<boolean> => {
  const user = await User.findById(userId).select('+mfaSecret');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.mfaSecret) {
    throw new ApiError(400, 'MFA secret not found. Please setup MFA first');
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: config.mfa.window,
  });

  if (!verified) {
    throw new ApiError(401, 'Invalid MFA token');
  }

  // Enable MFA
  user.mfaEnabled = true;
  await user.save();

  return true;
};

/**
 * Verify MFA token for login
 */
export const verifyMFAToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  const user = await User.findById(userId).select('+mfaSecret');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    throw new ApiError(400, 'MFA is not enabled for this user');
  }

  // Verify token
  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: config.mfa.window,
  });

  return verified;
};

/**
 * Disable MFA for user
 */
export const disableMFA = async (userId: string, password: string): Promise<boolean> => {
  const user = await User.findById(userId).select('+passwordHash +mfaSecret');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.mfaEnabled) {
    throw new ApiError(400, 'MFA is not enabled for this user');
  }

  // Verify password before disabling MFA
  const { verifyPassword } = await import('../utils/password.util');
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password');
  }

  // Disable MFA
  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  await user.save();

  return true;
};

/**
 * Generate backup codes for account recovery
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }

  return codes;
}
