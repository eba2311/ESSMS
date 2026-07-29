/**
 * ESSMS - Fix Admin Login
 * Resets the admin password to Admin123! directly in MongoDB
 * Run: node fix-login.js
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

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

async function fixLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const passwordHash = await hashPassword('Admin123!');

    // Fix ALL staff accounts at once
    const accounts = [
      { email: 'admin@school.edu.et',      password: 'Admin123!',   hash: passwordHash },
    ];

    // Re-hash for each account separately (they need unique salts)
    const updates = [
      { email: 'admin@school.edu.et' },
      { email: 'director@school.edu.et' },
      { email: 'academic@school.edu.et' },
      { email: 'registrar@school.edu.et' },
      { email: 'finance@school.edu.et' },
      { email: 'counselor@school.edu.et' },
      { email: 'librarian@school.edu.et' },
    ];

    let fixed = 0;
    for (const acct of updates) {
      const h = await hashPassword('Admin123!');
      const result = await users.updateOne(
        { email: acct.email },
        {
          $set: {
            passwordHash: h,
            isActive: true,
            failedLoginAttempts: 0,
            accountLockedUntil: null,
            forcePasswordChange: false,
          },
        }
      );
      if (result.matchedCount > 0) {
        console.log(`  ✅ Fixed: ${acct.email}`);
        fixed++;
      } else {
        console.log(`  ⚠️  Not found: ${acct.email}`);
      }
    }

    // Also fix teachers
    const teacherHash = await hashPassword('Teacher123!');
    const teacherResult = await users.updateMany(
      { role: 'teacher' },
      {
        $set: {
          passwordHash: teacherHash,
          isActive: true,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          forcePasswordChange: false,
        },
      }
    );
    console.log(`  ✅ Fixed ${teacherResult.modifiedCount} teacher accounts → Teacher123!`);

    // Fix student accounts
    const studentHash = await hashPassword('Student123!');
    const studentResult = await users.updateMany(
      { role: 'student' },
      {
        $set: {
          passwordHash: studentHash,
          isActive: true,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
          forcePasswordChange: false,
        },
      }
    );
    console.log(`  ✅ Fixed ${studentResult.modifiedCount} student accounts → Student123!`);

    console.log(`\n✅ Done! Fixed ${fixed} staff + teachers + students`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('You can now login with:');
    console.log('  Admin:   admin@school.edu.et  / Admin123!');
    console.log('  Teacher: teacher@school.edu.et / Teacher123!');
    console.log('  Student: (any student email)   / Student123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('MongoDB is not running! Start it first:');
      console.error('  net start MongoDB');
    }
    process.exit(1);
  }
}

fixLogin();
