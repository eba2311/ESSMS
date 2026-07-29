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

async function fixAcademic() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const User = mongoose.models.User || mongoose.model('User', userSchema);

  const hash = await hashPassword('Admin123!');
  const existing = await User.findOne({ email: 'academic@school.edu.et' });

  if (existing) {
    await User.updateOne({ email: 'academic@school.edu.et' }, { 
      passwordHash: hash, 
      isActive: true, 
      forcePasswordChange: false,
      failedLoginAttempts: 0,
      accountLockedUntil: undefined
    });
    console.log('Academic user updated with correct password.');
  } else {
    await User.create({
      userId: 'ACA001',
      username: 'academic',
      firstName: 'Biruk',
      lastName: 'Abebe',
      email: 'academic@school.edu.et',
      passwordHash: hash,
      role: 'academic_head',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      forcePasswordChange: false,
    });
    console.log('Academic user created.');
  }

  await mongoose.disconnect();
}

fixAcademic().catch(console.error);
