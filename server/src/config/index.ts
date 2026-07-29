import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5002', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/essms_dev',
  mongodbUriTest: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/essms_test',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '15', 10),
  maxFailedLoginAttempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '9999', 10),
  accountLockoutDurationMinutes: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES || '15', 10),
  passwordExpiryDays: parseInt(process.env.PASSWORD_EXPIRY_DAYS || '180', 10),
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },
  emailFrom: process.env.EMAIL_FROM || 'noreply@essms.edu.et',
  
  // SMS
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.SMS_ACCOUNT_SID || '',
    authToken: process.env.SMS_AUTH_TOKEN || '',
    phoneNumber: process.env.SMS_PHONE_NUMBER || '',
  },
  
  // File Upload
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  
  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Audit
  auditLogRetentionYears: parseInt(process.env.AUDIT_LOG_RETENTION_YEARS || '7', 10),
  
  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-32-char-key-prod!!',
  
  // MFA
  mfa: {
    issuer: process.env.MFA_ISSUER || 'ESSMS',
    window: parseInt(process.env.MFA_WINDOW || '2', 10),
  },
};
