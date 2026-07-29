import crypto from 'crypto';

/**
 * Hash a plain text password using built-in crypto (pbkdf2)
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if password matches, false otherwise
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const parts = hash.split(':');
      if (parts.length !== 2) return resolve(false);
      
      const [salt, key] = parts;
      const keyBuffer = Buffer.from(key, 'hex');
      
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) return resolve(false);
        resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
      });
    } catch {
      resolve(false);
    }
  });
};

/**
 * Validate password strength
 * @param password - Plain text password
 * @returns Object with validation result and message
 */
export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
};
