/**
 * Reset Admin Password Script
 * Run: node reset-admin-password.js
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essms_dev';

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function resetAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const admin = await users.findOne({ email: 'admin@school.edu.et' });

    if (admin) {
      const hash = await hashPassword('Admin123!');
      await users.updateOne(
        { email: 'admin@school.edu.et' },
        { $set: { passwordHash: hash, isActive: true, forcePasswordChange: false, failedLoginAttempts: 0 } }
      );
      console.log('Admin password reset to: Admin123!');
    } else {
      const hash = await hashPassword('Admin123!');
      await users.insertOne({
        userId: 'ADM001',
        username: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@school.edu.et',
        passwordHash: hash,
        role: 'system_admin',
        isActive: true,
        mfaEnabled: false,
        mfaSecret: null,
        failedLoginAttempts: 0,
        forcePasswordChange: false,
        lastLogin: null,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Admin user created.');
      console.log('Email: admin@school.edu.et');
      console.log('Password: Admin123!');
    }

    await mongoose.disconnect();
    console.log('Done! You can now login with admin / Admin123!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetAdmin();
