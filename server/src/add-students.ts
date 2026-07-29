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

async function addStudents() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({}, { strict: false, timestamps: true }));
  const Section = mongoose.models.Section || mongoose.model('Section', new mongoose.Schema({}, { strict: false, timestamps: true }));
  
  const sections = await Section.find();
  if (sections.length === 0) {
    console.log('❌ No sections found! Please run the main seed script first.');
    process.exit(1);
  }

  const pwdStudent = await hashPassword('Student123!');

  const firstNames = ['Yonas', 'Fikirte', 'Zelalem', 'Mekdes', 'Ephrem', 'Lidia', 'Dawit', 'Mahlet', 'Robel', 'Senait', 'Natnael', 'Saron', 'Elias', 'Hanna', 'Yonatan'];
  const lastNames = ['Getachew', 'Tadesse', 'Bekele', 'Girma', 'Kassahun', 'Yilma', 'Tesfaye', 'Asrat', 'Tsegaye', 'Mulugeta', 'Ayalew', 'Worku', 'Tilahun', 'Desta', 'Belay'];
  
  const generatedStudents = [];
  const generatedUsers = [];

  for (let i = 0; i < 15; i++) {
    const studentId = `STU00${10 + i}`;
    const username = `student${10 + i}`;
    
    generatedUsers.push({
      userId: studentId,
      username,
      firstName: firstNames[i],
      lastName: lastNames[i],
      email: `${username}@school.edu.et`,
      passwordHash: pwdStudent,
      role: 'student',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      forcePasswordChange: false
    });
  }

  const users = await User.insertMany(generatedUsers);
  console.log(`✅ Created ${users.length} new student user accounts.`);

  const addressLocations = [
    { city: 'Addis Ababa', subcity: 'Bole', woreda: '01', houseNumber: '112A' },
    { city: 'Addis Ababa', subcity: 'Yeka', woreda: '05', houseNumber: '34B' },
    { city: 'Addis Ababa', subcity: 'Kirkos', woreda: '02', houseNumber: '89C' },
    { city: 'Addis Ababa', subcity: 'Lideta', woreda: '08', houseNumber: '210' },
    { city: 'Addis Ababa', subcity: 'Arada', woreda: '03', houseNumber: '405' },
  ];

  for (let i = 0; i < 15; i++) {
    // Pick random section
    const section = sections[Math.floor(Math.random() * sections.length)];
    const isNatural = section.stream === 'NATURAL_SCIENCE' || section.stream === 'Natural Science';
    const isSocial = section.stream === 'SOCIAL_SCIENCE' || section.stream === 'Social Science';
    const stream = section.grade >= 11 ? (isNatural ? 'Natural Science' : 'Social Science') : 'Common';
    
    generatedStudents.push({
      studentId: `STU00${10 + i}`,
      admissionNumber: `ADM-2024-${100 + i}`,
      userId: users[i]._id,
      firstName: firstNames[i],
      lastName: lastNames[i],
      dateOfBirth: new Date(2005 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      gender: i % 2 === 0 ? 'Male' : 'Female',
      nationality: 'Ethiopian',
      grade: section.grade,
      section: section._id,
      stream: stream,
      academicYear: '2024/2025',
      enrollmentDate: new Date('2024-09-01'),
      status: 'Active',
      address: addressLocations[Math.floor(Math.random() * addressLocations.length)],
      emergencyContact: {
        name: `${lastNames[i]} Contact`,
        relationship: i % 2 === 0 ? 'Father' : 'Mother',
        phone: `+251911${Math.floor(100000 + Math.random() * 900000)}`
      },
      medicalInfo: {
        bloodType: ['A+', 'O+', 'B+', 'AB+'][Math.floor(Math.random() * 4)],
        allergies: i % 5 === 0 ? ['Dust', 'Peanuts'] : [],
        chronicConditions: i % 7 === 0 ? ['Asthma'] : [],
        medications: []
      },
      previousSchool: i % 3 === 0 ? 'St. Joseph School' : 'Public School No. 4',
    });
  }

  const students = await Student.insertMany(generatedStudents);
  console.log(`✅ Inserted ${students.length} fully-detailed student profiles.`);
  
  await mongoose.disconnect();
  process.exit(0);
}

addStudents().catch(e => { console.error('❌ Failed to add students:', e); process.exit(1); });
