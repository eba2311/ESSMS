import mongoose from 'mongoose';

/**
 * Helper that checks if MongoDB is available.
 * For CI, set MONGODB_URI_TEST to an in-memory server or real test DB.
 * For Jest watch mode without a local MongoDB, tests that require a DB will be skipped.
 */
export const isDatabaseAvailable = async (): Promise<boolean> => {
  try {
    const uri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/essms_test';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    await mongoose.disconnect();
    return true;
  } catch {
    return false;
  }
};

export const createManyUsers = (count: number) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      userId: `USR${String(i + 1).padStart(4, '0')}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@test.com`,
      passwordHash: 'salt:dummyhash',
      role: i === 0 ? 'system_admin' : 'teacher',
      firstName: `User${i + 1}`,
      lastName: 'Test',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      forcePasswordChange: false,
    });
  }
  return users;
};
