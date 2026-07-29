/**
 * Quick admin user initialization script
 * Run: ts-node --transpile-only src/init-admin.ts
 */
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essms_dev';

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function initAdmin() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const User = mongoose.models.User || mongoose.model('User', userSchema);

  const existing = await User.findOne({ email: 'admin@school.edu.et' });
  if (existing) {
    console.log('Admin already exists. Updating password...');
    const hash = await hashPassword('Admin123!');
    await User.updateOne({ email: 'admin@school.edu.et' }, { passwordHash: hash, isActive: true, forcePasswordChange: false });
    console.log('Password updated to: Admin123!');
  } else {
    const hash = await hashPassword('Admin123!');
    await User.create({
      userId: 'ADM001',
      username: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@school.edu.et',
      passwordHash: hash,
      role: 'system_admin',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      forcePasswordChange: false,
    });
    console.log('✅ Admin user created:');
    console.log('   Email: admin@school.edu.et');
    console.log('   Password: Admin123!');
  }

  await mongoose.disconnect();
  console.log('Done!');
}

initAdmin().catch(console.error);
