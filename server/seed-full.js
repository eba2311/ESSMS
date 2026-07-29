/**
 * Complete database seeder for ESSMS
 * Run: node seed-full.js
 * 
 * Seeds: 8+ teachers, 140+ students (20 per section), full assessments,
 *        attendance, rankings, timetables, fees, library, etc.
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

const GRADES = [9, 10, 11, 12];
const STREAMS = ['Common', 'Natural Science', 'Social Science'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FIRST_NAMES_M = [
  'Abebe', 'Alemu', 'Chala', 'Dawit', 'Elias', 'Fekadu', 'Getachew', 'Henok',
  'Isaac', 'Jemal', 'Kebede', 'Lemma', 'Mekonnen', 'Negash', 'Obsa', 'Petros',
  'Samuel', 'Tadesse', 'Umer', 'Wondimu', 'Yonas', 'Zerihun', 'Amare', 'Biruk',
  'Melaku', 'Temesgen', 'Worku', 'Tekle', 'Gebre', 'Tesfaye', 'Amanuel', 'Biniyam',
  'Ermias', 'Fikru', 'Girma', 'Habtamu', 'Kassahun', 'Mulugeta', 'Nuru', 'Solomon',
];

const FIRST_NAMES_F = [
  'Birtukan', 'Shewit', 'Hanna', 'Meron', 'Selam', 'Tigist', 'Aster', 'Frehiwot',
  'Genet', 'Hiwot', 'Kidist', 'Lemlem', 'Mekdes', 'Nigisti', 'Roman', 'Saba',
  'Tsion', 'Winta', 'Yeabsira', 'Birhane', 'Desta', 'Eden', 'Ferehiwot', 'Hirut',
  'Mahlet', 'Rahel', 'Saron', 'Tirunesh', 'Yeshi', 'Zufan', 'Alemitu', 'Beza',
  'Elsa', 'Gelila', 'Mihret', 'Ruth', 'Samrawit', 'Tsige', 'Weyni', 'Zeritu',
];

const LAST_NAMES = [
  'Kebede', 'Lemma', 'Dessalegn', 'Alemayehu', 'Hagos', 'Assefa', 'Gebre', 'Wondimu',
  'Tesfaye', 'Haile', 'Abebe', 'Mamo', 'Tilahun', 'Demeke', 'Ayele', 'Girma',
  'Mekonnen', 'Shiferaw', 'Wolde', 'Berhe', 'Teklu', 'Fekadu', 'Alemu', 'Desta',
  'Gebeyehu', 'Hailu', 'Kassaye', 'Melaku', 'Negash', 'Worku', 'Zeleke', 'Bekele',
  'Eshetu', 'Fikadu', 'Getahun', 'Mengistu', 'Tolosa', 'Yimer', 'Bogale', 'Endale',
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateMark(totalMarks) {
  const base = totalMarks * 0.35 + Math.random() * totalMarks * 0.6;
  const marksObtained = Math.round(base * 10) / 10;
  const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100;
  let letterGrade = 'F', gradePoint = 0;
  if (percentage >= 90) { letterGrade = 'A+'; gradePoint = 4.0; }
  else if (percentage >= 85) { letterGrade = 'A'; gradePoint = 4.0; }
  else if (percentage >= 80) { letterGrade = 'A-'; gradePoint = 3.75; }
  else if (percentage >= 75) { letterGrade = 'B+'; gradePoint = 3.5; }
  else if (percentage >= 70) { letterGrade = 'B'; gradePoint = 3.0; }
  else if (percentage >= 65) { letterGrade = 'B-'; gradePoint = 2.75; }
  else if (percentage >= 60) { letterGrade = 'C+'; gradePoint = 2.5; }
  else if (percentage >= 50) { letterGrade = 'C'; gradePoint = 2.0; }
  else if (percentage >= 45) { letterGrade = 'D'; gradePoint = 1.0; }
  return { marksObtained, percentage, letterGrade, gradePoint };
}

function getSectionSubjectIds(section, allSubjects) {
  if (section.grade <= 10) {
    // Grades 9-10 take all subjects
    return allSubjects.map(s => s._id);
  }
  if (section.stream === 'Natural Science') {
    return allSubjects
      .filter(s => s.streams.length === 0 || s.streams.includes('Natural Science'))
      .map(s => s._id);
  }
  // Social Science
  return allSubjects
    .filter(s => s.streams.length === 0 || s.streams.includes('Social Science'))
    .map(s => s._id);
}

function getSubjectIdsForSection(section, allSubjects) {
  return getSectionSubjectIds(section, allSubjects);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.collection(col.name).deleteMany({});
  }
  console.log('🗑️  Cleared all existing data\n');

  const [pwdAdmin, pwdTeacher, pwdStudent, pwdParent] = await Promise.all([
    hashPassword('Admin123!'), hashPassword('Teacher123!'),
    hashPassword('Student123!'), hashPassword('Parent123!'),
  ]);

  // ══════════════════════════════════════════════
  // 1. USERS
  // ══════════════════════════════════════════════
  const adminUsers = [
    { userId: 'ADM001', username: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@school.edu.et', passwordHash: pwdAdmin, role: 'system_admin' },
    { userId: 'DIR001', username: 'director', firstName: 'Tigist', lastName: 'Haile', email: 'director@school.edu.et', passwordHash: pwdAdmin, role: 'school_director' },
    { userId: 'ACA001', username: 'academic', firstName: 'Biruk', lastName: 'Abebe', email: 'academic@school.edu.et', passwordHash: pwdAdmin, role: 'academic_head' },
    { userId: 'REG001', username: 'registrar', firstName: 'Hanna', lastName: 'Lemma', email: 'registrar@school.edu.et', passwordHash: pwdAdmin, role: 'registrar' },
    { userId: 'FIN001', username: 'finance', firstName: 'Meron', lastName: 'Tesfaye', email: 'finance@school.edu.et', passwordHash: pwdAdmin, role: 'finance_officer' },
    { userId: 'KCO001', username: 'counselor', firstName: 'Selam', lastName: 'Ayele', email: 'counselor@school.edu.et', passwordHash: pwdAdmin, role: 'counselor' },
    { userId: 'LIB001', username: 'librarian', firstName: 'Dawit', lastName: 'Girma', email: 'librarian@school.edu.et', passwordHash: pwdAdmin, role: 'librarian' },
  ];

  const teacherMeta = [
    { userId: 'TCH001', username: 'teacher1', firstName: 'John', lastName: 'Doe', email: 'teacher@school.edu.et', passwordHash: pwdTeacher, role: 'teacher' },
    { userId: 'TCH002', username: 'teacher2', firstName: 'Sara', lastName: 'Wondimu', email: 'teacher2@school.edu.et', passwordHash: pwdTeacher, role: 'teacher' },
    { userId: 'TCH003', username: 'teacher3', firstName: 'Tadesse', lastName: 'Alemu', email: 'teacher3@school.edu.et', passwordHash: pwdTeacher, role: 'homeroom_teacher' },
    { userId: 'TCH004', username: 'teacher4', firstName: 'Mekdes', lastName: 'Gebre', email: 'teacher4@school.edu.et', passwordHash: pwdTeacher, role: 'teacher' },
    { userId: 'TCH005', username: 'teacher5', firstName: 'Tekle', lastName: 'Hailu', email: 'teacher5@school.edu.et', passwordHash: pwdTeacher, role: 'homeroom_teacher' },
    { userId: 'TCH006', username: 'teacher6', firstName: 'Ruth', lastName: 'Mekonnen', email: 'teacher6@school.edu.et', passwordHash: pwdTeacher, role: 'teacher' },
    { userId: 'TCH007', username: 'teacher7', firstName: 'Gebre', lastName: 'Kassahun', email: 'teacher7@school.edu.et', passwordHash: pwdTeacher, role: 'teacher' },
    { userId: 'TCH008', username: 'teacher8', firstName: 'Tsion', lastName: 'Wolde', email: 'teacher8@school.edu.et', passwordHash: pwdTeacher, role: 'homeroom_teacher' },
    { userId: 'TCH009', username: 'teacher9', firstName: 'Biruk', lastName: 'Eshetu', email: 'teacher9@school.edu.et', passwordHash: pwdTeacher, role: 'teacher' },
    { userId: 'TCH010', username: 'teacher10', firstName: 'Eden', lastName: 'Tesfaye', email: 'teacher10@school.edu.et', passwordHash: pwdTeacher, role: 'homeroom_teacher' },
    { userId: 'TCH011', username: 'teacher11', firstName: 'Yonas', lastName: 'Mengistu', email: 'teacher11@school.edu.et', passwordHash: pwdTeacher, role: 'homeroom_teacher' },
  ];
  const allUsersData = [...adminUsers, ...teacherMeta];

  // Generate student users (20 per section × 7 sections = 140)
  const parentUsersData = [];
  for (let i = 1; i <= 8; i++) {
    parentUsersData.push({
      userId: `PRN${String(i).padStart(3, '0')}`,
      username: `parent${i}`,
      firstName: pickRandom(FIRST_NAMES_M),
      lastName: pickRandom(LAST_NAMES),
      email: `parent${i}@school.edu.et`,
      passwordHash: pwdParent,
      role: 'parent',
    });
  }

  const SECTION_CONFIG = [
    { name: 'A', grade: 9, stream: 'Common' },
    { name: 'B', grade: 9, stream: 'Common' },
    { name: 'A', grade: 10, stream: 'Common' },
    { name: 'A', grade: 11, stream: 'Natural Science' },
    { name: 'A', grade: 11, stream: 'Social Science' },
    { name: 'A', grade: 12, stream: 'Natural Science' },
    { name: 'A', grade: 12, stream: 'Social Science' },
  ];

  const studentUsersData = [];
  let stuIdx = 1;
  for (let si = 0; si < SECTION_CONFIG.length; si++) {
    for (let j = 1; j <= 20; j++) {
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)]
        : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const idStr = `STU${String(stuIdx).padStart(3, '0')}`;
      studentUsersData.push({
        userId: idStr,
        username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        firstName, lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu.et`,
        passwordHash: pwdStudent,
        role: 'student',
        _stuIdx: stuIdx,
        _sectionIdx: si,
        _gender: isMale ? 'Male' : 'Female',
      });
      stuIdx++;
    }
  }

  const allUsers = [...allUsersData, ...parentUsersData, ...studentUsersData.map(u => {
    const { _stuIdx, _sectionIdx, _gender, ...rest } = u;
    return rest;
  })];
  const insertedUsers = await db.collection('users').insertMany(allUsers.map(u => ({
    ...u, isActive: true, mfaEnabled: false, mfaSecret: null,
    failedLoginAttempts: 0, forcePasswordChange: false,
    lastLogin: null, passwordChangedAt: new Date(),
    createdAt: new Date(), updatedAt: new Date(),
  })));
  const userIdMap = {};
  allUsers.forEach((u, i) => { userIdMap[u.userId] = insertedUsers.insertedIds[i]; });
  console.log(`✅ Created ${allUsers.length} users (${studentUsersData.length} students, ${teacherMeta.length} teachers, ${parentUsersData.length} parents, ${adminUsers.length} staff)`);

  // ══════════════════════════════════════════════
  // 2. SECTIONS
  // ══════════════════════════════════════════════
  const sectionResult = await db.collection('sections').insertMany(SECTION_CONFIG.map(s => ({
    ...s, homeroomTeacher: null, status: 'Active',
    academicYear: '2024/2025',
    createdAt: new Date(), updatedAt: new Date(),
  })));
  const sections = SECTION_CONFIG.map((s, i) => ({ ...s, _id: sectionResult.insertedIds[i] }));
  console.log(`✅ Created ${sections.length} sections`);

  // ══════════════════════════════════════════════
  // 3. SUBJECTS
  // ══════════════════════════════════════════════
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH', shortName: 'Math', subjectType: 'Compulsory', grades: [9,10,11,12], streams: [], weeklyPeriods: 5 },
    { name: 'English', code: 'ENG', shortName: 'Eng', subjectType: 'Compulsory', grades: [9,10,11,12], streams: [], weeklyPeriods: 4 },
    { name: 'Amharic', code: 'AMH', shortName: 'Amh', subjectType: 'Compulsory', grades: [9,10,11,12], streams: [], weeklyPeriods: 3 },
    { name: 'Biology', code: 'BIO', shortName: 'Bio', subjectType: 'Compulsory', grades: [9,10,11,12], streams: ['Natural Science'], weeklyPeriods: 3 },
    { name: 'Chemistry', code: 'CHEM', shortName: 'Chem', subjectType: 'Compulsory', grades: [9,10,11,12], streams: ['Natural Science'], weeklyPeriods: 3 },
    { name: 'Physics', code: 'PHYS', shortName: 'Phys', subjectType: 'Compulsory', grades: [9,10,11,12], streams: ['Natural Science'], weeklyPeriods: 3 },
    { name: 'History', code: 'HIST', shortName: 'Hist', subjectType: 'Compulsory', grades: [9,10,11,12], streams: ['Social Science'], weeklyPeriods: 3 },
    { name: 'Geography', code: 'GEOG', shortName: 'Geog', subjectType: 'Compulsory', grades: [9,10,11,12], streams: ['Social Science'], weeklyPeriods: 3 },
    { name: 'ICT', code: 'ICT', shortName: 'ICT', subjectType: 'Compulsory', grades: [9,10,11,12], streams: [], weeklyPeriods: 2 },
    { name: 'Physical Education', code: 'PE', shortName: 'PE', subjectType: 'Compulsory', grades: [9,10,11,12], streams: [], weeklyPeriods: 2 },
    { name: 'Civics & Ethical Education', code: 'CIV', shortName: 'Civ', subjectType: 'Compulsory', grades: [9,10,11,12], streams: [], weeklyPeriods: 2 },
  ];
  const subjectResult = await db.collection('subjects').insertMany(subjectsData.map(s => ({
    ...s, isActive: true, createdAt: new Date(), updatedAt: new Date(),
  })));
  const subjects = subjectsData.map((s, i) => ({ ...s, _id: subjectResult.insertedIds[i] }));
  console.log(`✅ Created ${subjects.length} subjects`);

  // ══════════════════════════════════════════════
  // 4. CLASSROOMS
  // ══════════════════════════════════════════════
  const classroomsData = [
    { roomNumber: '101', building: 'Main', floor: 1, capacity: 40, type: 'Regular', facilities: ['Projector', 'Whiteboard'] },
    { roomNumber: '102', building: 'Main', floor: 1, capacity: 40, type: 'Regular', facilities: ['Whiteboard'] },
    { roomNumber: '103', building: 'Main', floor: 1, capacity: 35, type: 'Laboratory', facilities: ['Microscopes', 'Sinks'] },
    { roomNumber: '201', building: 'Main', floor: 2, capacity: 40, type: 'Regular', facilities: ['Projector', 'Whiteboard'] },
    { roomNumber: '202', building: 'Main', floor: 2, capacity: 30, type: 'Computer Lab', facilities: ['Computers', 'Projector'] },
    { roomNumber: '203', building: 'Main', floor: 2, capacity: 40, type: 'Regular', facilities: ['Whiteboard'] },
    { roomNumber: '204', building: 'Main', floor: 2, capacity: 35, type: 'Regular', facilities: ['Projector'] },
    { roomNumber: '301', building: 'Science', floor: 1, capacity: 35, type: 'Laboratory', facilities: ['Chemistry Lab', 'Safety Equipment'] },
    { roomNumber: '302', building: 'Science', floor: 1, capacity: 35, type: 'Laboratory', facilities: ['Physics Lab'] },
    { roomNumber: '303', building: 'Science', floor: 1, capacity: 30, type: 'Computer Lab', facilities: ['Computers', 'Projector'] },
  ];
  await db.collection('classrooms').insertMany(classroomsData.map(c => ({
    ...c, status: 'Available', createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${classroomsData.length} classrooms`);

  // ══════════════════════════════════════════════
  // 5. TEACHERS (with subject specializations)
  // ══════════════════════════════════════════════
  const teacherDetails = [
    { teacherId: 'TCH001', firstName: 'John', lastName: 'Doe', employmentDate: new Date('2015-09-01'), qualifications: [{ degree: 'B.Ed', field: 'Mathematics', institution: 'AAU', year: 2015 }], subjects: [0, 0], specializations: ['Mathematics'] },
    { teacherId: 'TCH002', firstName: 'Sara', lastName: 'Wondimu', employmentDate: new Date('2018-09-01'), qualifications: [{ degree: 'M.Ed', field: 'English', institution: 'AAU', year: 2016 }], subjects: [1, 1], specializations: ['English'] },
    { teacherId: 'TCH003', firstName: 'Tadesse', lastName: 'Alemu', employmentDate: new Date('2017-09-01'), qualifications: [{ degree: 'B.Sc', field: 'Biology', institution: 'Jimma University', year: 2014 }], subjects: [3, 3], specializations: ['Biology'] },
    { teacherId: 'TCH004', firstName: 'Mekdes', lastName: 'Gebre', employmentDate: new Date('2019-09-01'), qualifications: [{ degree: 'M.Sc', field: 'Chemistry', institution: 'AAU', year: 2017 }], subjects: [4, 4], specializations: ['Chemistry'] },
    { teacherId: 'TCH005', firstName: 'Tekle', lastName: 'Hailu', employmentDate: new Date('2016-09-01'), qualifications: [{ degree: 'B.Ed', field: 'Physics', institution: 'Bahir Dar University', year: 2014 }], subjects: [5, 5], specializations: ['Physics'] },
    { teacherId: 'TCH006', firstName: 'Ruth', lastName: 'Mekonnen', employmentDate: new Date('2020-09-01'), qualifications: [{ degree: 'M.A', field: 'History', institution: 'AAU', year: 2018 }], subjects: [6, 6], specializations: ['History', 'Geography'] },
    { teacherId: 'TCH007', firstName: 'Gebre', lastName: 'Kassahun', employmentDate: new Date('2018-09-01'), qualifications: [{ degree: 'B.Ed', field: 'Geography', institution: 'Mekelle University', year: 2016 }], subjects: [7, 7], specializations: ['Geography'] },
    { teacherId: 'TCH008', firstName: 'Tsion', lastName: 'Wolde', employmentDate: new Date('2019-09-01'), qualifications: [{ degree: 'B.Ed', field: 'ICT', institution: 'AAU', year: 2017 }], subjects: [8, 8], specializations: ['ICT'] },
    { teacherId: 'TCH009', firstName: 'Biruk', lastName: 'Eshetu', employmentDate: new Date('2020-09-01'), qualifications: [{ degree: 'B.Ed', field: 'Amharic', institution: 'Jimma University', year: 2018 }], subjects: [2, 2], specializations: ['Amharic'] },
    { teacherId: 'TCH010', firstName: 'Eden', lastName: 'Tesfaye', employmentDate: new Date('2021-09-01'), qualifications: [{ degree: 'B.Ed', field: 'Physical Education', institution: 'AAU', year: 2019 }], subjects: [9, 9], specializations: ['Physical Education'] },
    { teacherId: 'TCH011', firstName: 'Yonas', lastName: 'Mengistu', employmentDate: new Date('2017-09-01'), qualifications: [{ degree: 'M.Ed', field: 'Civics', institution: 'AAU', year: 2015 }], subjects: [10, 10], specializations: ['Civics'] },
  ];

  const teachersData = teacherDetails.map(td => ({
    teacherId: td.teacherId,
    userId: userIdMap[td.teacherId],
    firstName: td.firstName,
    lastName: td.lastName,
    email: teacherMeta.find(u => u.userId === td.teacherId).email,
    employmentDate: td.employmentDate,
    employmentType: 'Full-time',
    status: 'Active',
    qualifications: td.qualifications,
    subjects: td.subjects.map(si => subjects[si]._id),
    specializations: td.specializations,
  }));
  const teacherResult = await db.collection('teachers').insertMany(teachersData.map(t => ({
    ...t, createdAt: new Date(), updatedAt: new Date(),
  })));
  const teachers = teachersData.map((t, i) => ({ ...t, _id: teacherResult.insertedIds[i] }));
  console.log(`✅ Created ${teachers.length} teachers`);

  // ══════════════════════════════════════════════
  // 5b. Assign homeroom teachers to sections
  // ══════════════════════════════════════════════
  const homeroomMapping = [
    { sectionIdx: 0, teacherId: 'TCH003' }, // 9A → Tadesse
    { sectionIdx: 1, teacherId: 'TCH005' }, // 9B → Tekle
    { sectionIdx: 2, teacherId: 'TCH008' }, // 10A → Tsion
    { sectionIdx: 3, teacherId: 'TCH010' }, // 11Nat → Eden
    { sectionIdx: 4, teacherId: 'TCH011' }, // 11Soc → Yonas
    { sectionIdx: 5, teacherId: 'TCH003' }, // 12Nat → Tadesse
    { sectionIdx: 6, teacherId: 'TCH005' }, // 12Soc → Tekle
  ];

  for (const hm of homeroomMapping) {
    const teacher = teachers.find(t => t.teacherId === hm.teacherId);
    if (teacher) {
      await db.collection('sections').updateOne(
        { _id: sections[hm.sectionIdx]._id },
        { $set: { homeroomTeacher: teacher._id } }
      );
    }
  }
  console.log(`✅ Assigned homeroom teachers to all sections`);

  // ══════════════════════════════════════════════
  // 6. STUDENTS (20 per section × 7 sections = 140)
  // ══════════════════════════════════════════════
  const studentsData = [];
  const studentSectionMap = {};
  stuIdx = 1;
  for (let si = 0; si < sections.length; si++) {
    const sectionStudents = studentUsersData.filter(u => u._sectionIdx === si);
    for (const su of sectionStudents) {
      const birthYear = 2024 - sections[si].grade - 6 + Math.floor(Math.random() * 2);
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const gender = su._gender;
      const firstName = su.firstName;
      const lastName = su.lastName;
      studentsData.push({
        studentId: su.userId,
        admissionNumber: `ADM-${2024 - sections[si].grade + 9}-${String(stuIdx).padStart(3, '0')}`,
        firstName, lastName,
        dateOfBirth: new Date(birthYear, birthMonth - 1, birthDay),
        gender, nationality: 'Ethiopian',
        grade: sections[si].grade,
        section: sections[si]._id,
        stream: sections[si].stream,
        enrollmentDate: new Date(`2024-09-01`),
        status: 'Active',
        academicYear: '2024/2025',
        userId: userIdMap[su.userId],
        address: { city: 'Addis Ababa', subcity: pickRandom(['Bole', 'Kirkos', 'Yeka', 'Arada', 'Lideta', 'Gulele', 'Kolfe', 'Nifas Silk']), woreda: String(Math.floor(Math.random() * 15) + 1).padStart(2, '0') },
        emergencyContact: { name: pickRandom(FIRST_NAMES_M) + ' ' + pickRandom(LAST_NAMES), relationship: pickRandom(['Father', 'Mother', 'Guardian']), phone: `+25191${Math.floor(10000000 + Math.random() * 90000000)}` },
        guardians: [],
      });
      studentSectionMap[su.userId] = studentsData.length - 1;
      stuIdx++;
    }
  }

  const studentResult = await db.collection('students').insertMany(studentsData.map(s => ({
    ...s, statusHistory: [{ status: 'Active', changedAt: new Date(), changedBy: userIdMap['ADM001'], reason: 'Initial enrollment' }],
    createdAt: new Date(), updatedAt: new Date(),
  })));
  const students = studentsData.map((s, i) => ({ ...s, _id: studentResult.insertedIds[i] }));
  console.log(`✅ Created ${students.length} students (20 per section)`);

  // ══════════════════════════════════════════════
  // 7. GUARDIANS (link parents to students)
  // ══════════════════════════════════════════════
  const guardiansData = [];
  for (let pi = 0; pi < parentUsersData.length; pi++) {
    const parentUserId = parentUsersData[pi].userId;
    // Each parent gets ~1-2 children assigned
    const childCount = 1 + Math.floor(Math.random() * 2);
    const assignedStudents = [];
    for (let c = 0; c < childCount; c++) {
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      if (!assignedStudents.find(as => String(as) === String(randomStudent._id))) {
        assignedStudents.push(randomStudent._id);
        // Update student's guardians list
        const idx = students.findIndex(s => String(s._id) === String(randomStudent._id));
        if (idx >= 0) {
          if (!students[idx].guardians) students[idx].guardians = [];
          students[idx].guardians.push(userIdMap[parentUserId]);
        }
      }
    }
    guardiansData.push({
      userId: userIdMap[parentUserId],
      firstName: parentUsersData[pi].firstName,
      lastName: parentUsersData[pi].lastName,
      email: parentUsersData[pi].email,
      phone: `+25191${Math.floor(10000000 + Math.random() * 90000000)}`,
      relationship: pi % 2 === 0 ? 'Father' : 'Mother',
      occupation: pickRandom(['Teacher', 'Nurse', 'Engineer', 'Accountant', 'Doctor', 'Business Owner', 'Civil Servant']),
      students: assignedStudents,
    });
  }
  await db.collection('guardians').insertMany(guardiansData.map(g => ({
    ...g, createdAt: new Date(), updatedAt: new Date(),
  })));

  // Update students with guardian links
  for (const student of students) {
    if (student.guardians && student.guardians.length > 0) {
      await db.collection('students').updateOne(
        { _id: student._id },
        { $set: { guardians: student.guardians } }
      );
    }
  }
  console.log(`✅ Created ${guardiansData.length} guardians with linked students`);

  // ══════════════════════════════════════════════
  // 8. BOOKS
  // ══════════════════════════════════════════════
  const booksData = [
    { isbn: '978-99944-2-543-7', title: 'Mathematics for Grade 9', author: 'MoE Ethiopia', publisher: 'EMPDE', publishedYear: 2020, category: 'Textbook', quantity: 50, available: 45 },
    { isbn: '978-99944-2-544-4', title: 'English for Grade 9', author: 'MoE Ethiopia', publisher: 'EMPDE', publishedYear: 2020, category: 'Textbook', quantity: 50, available: 42 },
    { isbn: '978-99944-2-545-1', title: 'Biology for Grade 10', author: 'MoE Ethiopia', publisher: 'EMPDE', publishedYear: 2020, category: 'Textbook', quantity: 40, available: 38 },
    { isbn: '978-99944-2-546-8', title: 'Chemistry for Grade 11', author: 'MoE Ethiopia', publisher: 'EMPDE', publishedYear: 2021, category: 'Textbook', quantity: 35, available: 33 },
    { isbn: '978-99944-2-547-5', title: 'Physics for Grade 12', author: 'MoE Ethiopia', publisher: 'EMPDE', publishedYear: 2021, category: 'Textbook', quantity: 30, available: 28 },
    { isbn: '978-0435-12345-6', title: 'Introduction to Algorithms', author: 'Thomas Cormen', publisher: 'MIT Press', publishedYear: 2009, category: 'Reference', quantity: 5, available: 3 },
    { isbn: '978-0435-12345-7', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', publishedYear: 1925, category: 'Literature', quantity: 10, available: 8 },
    { isbn: '978-0435-12345-8', title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'J.B. Lippincott', publishedYear: 1960, category: 'Literature', quantity: 8, available: 6 },
    { isbn: '978-99944-2-548-2', title: 'History of Ethiopia', author: 'Bahru Zewde', publisher: 'AAU Press', publishedYear: 2015, category: 'Reference', quantity: 6, available: 5 },
    { isbn: '978-99944-2-549-9', title: 'Geography for Grade 11', author: 'MoE Ethiopia', publisher: 'EMPDE', publishedYear: 2021, category: 'Textbook', quantity: 35, available: 35 },
  ];
  await db.collection('books').insertMany(booksData.map(b => ({
    ...b, location: 'Library Section A', status: 'Available', createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${booksData.length} books`);

  // ══════════════════════════════════════════════
  // 9. SETTINGS
  // ══════════════════════════════════════════════
  await db.collection('settings').updateOne({}, {
    $set: {
      schoolName: 'Ethiopian Secondary School', schoolAddress: 'Addis Ababa, Ethiopia',
      schoolPhone: '+251 11 123 4567', schoolEmail: 'info@essms.edu.et',
      academicYear: '2024/2025', term: '1', gradingSystem: 'Percentage',
      maxStudentsPerSection: 40, sessionTimeout: 60,
      updatedAt: new Date(),
    },
  }, { upsert: true });
  console.log(`✅ Created settings`);

  // ══════════════════════════════════════════════
  // 10. TEACHER ASSIGNMENTS (comprehensive coverage)
  // ══════════════════════════════════════════════
  const taData = [];
  // Subject index → teacher mapping
  const subjectTeacherMap = {
    0: 'TCH001', // Math → John
    1: 'TCH002', // English → Sara
    2: 'TCH009', // Amharic → Biruk
    3: 'TCH003', // Biology → Tadesse
    4: 'TCH004', // Chemistry → Mekdes
    5: 'TCH005', // Physics → Tekle
    6: 'TCH006', // History → Ruth
    7: 'TCH007', // Geography → Gebre
    8: 'TCH008', // ICT → Tsion
    9: 'TCH010', // PE → Eden
    10: 'TCH011', // Civics → Yonas
  };

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const sectionSubjectIds = getSectionSubjectIds(section, subjects);
    for (const subjId of sectionSubjectIds) {
      const subjIdx = subjects.findIndex(s => String(s._id) === String(subjId));
      const teacherId = subjectTeacherMap[subjIdx];
      const teacher = teachers.find(t => t.teacherId === teacherId);
      if (teacher) {
        taData.push({
          teacher: teacher._id,
          section: section._id,
          subject: subjId,
        });
      }
    }
  }
  await db.collection('teacherassignments').insertMany(taData.map(a => ({
    ...a, academicYear: '2024/2025', isActive: true, createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${taData.length} teacher assignments`);

  // ══════════════════════════════════════════════
  // 11. SUBJECT ASSIGNMENTS (grade-level curriculum)
  // ══════════════════════════════════════════════
  const saData = [];
  for (const subject of subjects) {
    for (const grade of subject.grades) {
      saData.push({ subject: subject._id, gradeLevel: grade, academicYear: '2024/2025' });
    }
  }
  await db.collection('subjectassignments').insertMany(saData.map(s => ({
    ...s, createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${saData.length} subject-grade assignments`);

  // ══════════════════════════════════════════════
  // 12. SCHEDULES + TIMETABLES (for all sections)
  // ══════════════════════════════════════════════
  const scheduleData = [];
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const sectionSubjectIds = getSectionSubjectIds(section, subjects);
    let period = 0;
    for (let di = 0; di < DAYS.length && period < 8; di++) {
      const day = DAYS[di];
      for (let p = 0; p < 2 && period < sectionSubjectIds.length; p++) {
        const subjId = sectionSubjectIds[period % sectionSubjectIds.length];
        const room = classroomsData[period % classroomsData.length].roomNumber;
        const startH = 8 + Math.floor(period / 2);
        const startM = (period % 2) * 45;
        const endH = startH + Math.floor((startM + 45) / 60);
        const endM = (startM + 45) % 60;
        scheduleData.push({
          subject: subjId,
          section: section._id,
          dayOfWeek: day,
          startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          room,
          academicYear: '2024/2025',
          semester: 1,
          createdAt: new Date(), updatedAt: new Date(),
        });
        period++;
      }
    }
  }
  await db.collection('subjectschedules').insertMany(scheduleData);
  console.log(`✅ Created ${scheduleData.length} schedule slots`);

  // Timetables for each section
  for (let si = 0; si < sections.length; si++) {
    const sectionSchedules = scheduleData.filter(s => String(s.section) === String(sections[si]._id));
    const timetableSlots = sectionSchedules.map((s, idx) => ({
      dayOfWeek: s.dayOfWeek, periodNumber: idx + 1,
      startTime: s.startTime, endTime: s.endTime,
    }));
    await db.collection('timetables').insertOne({
      section: sections[si]._id, academicYear: '2024/2025',
      effectiveFrom: new Date('2024-09-01'), status: 'Published',
      schedule: timetableSlots,
      createdAt: new Date(), updatedAt: new Date(),
    });
  }
  console.log(`✅ Created timetables for all ${sections.length} sections`);

  // ══════════════════════════════════════════════
  // 13. FEE STRUCTURES
  // ══════════════════════════════════════════════
  const feeData = [
    { grade: 9, components: [{ name: 'Tuition', amount: 5000 }, { name: 'Registration', amount: 500 }, { name: 'Books', amount: 1500 }] },
    { grade: 10, components: [{ name: 'Tuition', amount: 5500 }, { name: 'Registration', amount: 500 }, { name: 'Books', amount: 1500 }] },
    { grade: 11, components: [{ name: 'Tuition', amount: 6000 }, { name: 'Registration', amount: 500 }, { name: 'Lab Fee', amount: 1000 }] },
    { grade: 12, components: [{ name: 'Tuition', amount: 6500 }, { name: 'Registration', amount: 500 }, { name: 'Lab Fee', amount: 1000 }] },
  ];
  await db.collection('feestructures').insertMany(feeData.map(f => ({
    ...f, academicYear: '2024/2025', isActive: true, createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${feeData.length} fee structures`);

  // ══════════════════════════════════════════════
  // 14. PAYMENTS (for some students)
  // ══════════════════════════════════════════════
  const paymentsData = [];
  for (let i = 0; i < Math.min(students.length, 40); i++) {
    const student = students[i];
    const totalFee = feeData.find(f => f.grade === student.grade).components.reduce((sum, c) => sum + c.amount, 0);
    const paidAmount = Math.floor(totalFee * (0.5 + Math.random() * 0.5));
    paymentsData.push({
      student: student._id, academicYear: '2024/2025',
      amount: paidAmount,
      paymentMethod: pickRandom(['Cash', 'Bank Transfer', 'Cheque']),
      date: new Date(2024, 8 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
      receivedBy: userIdMap['FIN001'],
      description: `${pickRandom(['Tuition', 'Tuition - Term 1', 'Registration', 'Full payment', 'Partial payment'])}`,
      status: 'Completed',
      receiptNumber: `RCP-2024-${String(i + 1).padStart(4, '0')}`,
      createdAt: new Date(), updatedAt: new Date(),
    });
  }
  await db.collection('payments').insertMany(paymentsData);
  console.log(`✅ Created ${paymentsData.length} payments`);

  // ══════════════════════════════════════════════
  // 15. ASSESSMENTS + MARKS (for ALL sections)
  // ══════════════════════════════════════════════
  const today = new Date();
  const assessmentsData = [];
  let assessIdx = 1;
  const assessmentTypes = ['Quiz', 'Test', 'Mid Exam', 'Final Exam', 'Assignment'];
  const statuses = ['Published', 'Published', 'Published', 'Approved', 'Graded'];

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const sectionSubjectIds = getSectionSubjectIds(section, subjects);
    for (const subjId of sectionSubjectIds) {
      const subj = subjects.find(s => String(s._id) === String(subjId));
      const type = pickRandom(assessmentTypes);
      const totalMarks = type === 'Quiz' ? 20 : type === 'Test' ? 50 : type === 'Mid Exam' ? 100 : type === 'Final Exam' ? 100 : 30;
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      assessmentsData.push({
        assessmentId: `ASS${today.getFullYear()}${String(assessIdx).padStart(4, '0')}`,
        subject: subjId,
        section: section._id,
        // Find which teacher teaches this subject to this section
        teacher: (() => {
          const ta = taData.find(a => String(a.section) === String(section._id) && String(a.subject) === String(subjId));
          return ta ? ta.teacher : teachers[0]._id;
        })(),
        type,
        title: `${subj.name} ${type} ${assessIdx}`,
        totalMarks,
        date: new Date(today.getTime() - daysAgo * 86400000),
        academicYear: '2024/2025',
        term: '1',
        status: pickRandom(statuses),
        createdAt: new Date(), updatedAt: new Date(),
      });
      assessIdx++;
      // Create 2-3 assessments per section subject
      if (Math.random() > 0.5) break;
    }
  }

  const assessmentResult = await db.collection('assessments').insertMany(assessmentsData);
  const assessments = assessmentsData.map((a, i) => ({ ...a, _id: assessmentResult.insertedIds[i] }));
  console.log(`✅ Created ${assessments.length} assessments across all sections`);

  // Generate marks for each assessment
  const marksData = [];
  for (const assessment of assessments) {
    const sectionStudents = students.filter(s => String(s.section) === String(assessment.section));
    for (const student of sectionStudents) {
      const { marksObtained, percentage, letterGrade, gradePoint } = generateMark(assessment.totalMarks);
      marksData.push({
        assessment: assessment._id,
        student: student._id,
        marksObtained, percentage, letterGrade, gradePoint,
        enteredBy: userIdMap[teacherDetails[0].teacherId],
        enteredAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  await db.collection('assessmentmarks').insertMany(marksData);
  console.log(`✅ Created ${marksData.length} assessment marks (all students)`);

  // ══════════════════════════════════════════════
  // 16. RANKINGS (calculate for all students)
  // ══════════════════════════════════════════════
  const rankingsData = [];
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const sectionStudents = students.filter(s => String(s.section) === String(section._id));
    const studentAverages = [];

    for (const student of sectionStudents) {
      const studentMarks = marksData.filter(
        m => {
          const assessment = assessments.find(a => String(a._id) === String(m.assessment));
          return String(m.student) === String(student._id) && assessment && String(assessment.section) === String(section._id);
        }
      );
      const avgPct = studentMarks.length > 0
        ? Math.round(studentMarks.reduce((sum, m) => sum + m.percentage, 0) / studentMarks.length * 100) / 100
        : 0;
      const totalGp = studentMarks.reduce((sum, m) => sum + m.gradePoint, 0);
      const gpa = studentMarks.length > 0 ? Math.round(totalGp / studentMarks.length * 100) / 100 : 0;
      studentAverages.push({ student, avgPct, gpa, marksCount: studentMarks.length });
    }

    studentAverages.sort((a, b) => b.avgPct - a.avgPct);

    // Same section students for rank comparison
    for (let rank = 0; rank < studentAverages.length; rank++) {
      const sa = studentAverages[rank];
      const sectionRank = rank + 1;
      // Grade rank
      const gradeStudents = studentAverages.filter(sa2 => sa2.student.grade === section.grade);
      const gradeRank = gradeStudents.findIndex(sa2 => sa2.student.studentId === sa.student.studentId) + 1;
      // School rank - just global position
      const schoolRank = rank + 1;

      let meritCategory = 'REGULAR';
      if (sa.avgPct >= 90) meritCategory = 'ACADEMIC_EXCELLENCE';
      else if (sa.avgPct >= 85) meritCategory = 'HONOR_STUDENT';

      rankingsData.push({
        student: sa.student._id,
        academicYear: '2024/2025',
        term: '1',
        overallAverage: sa.avgPct,
        gpa: sa.gpa,
        sectionRank,
        gradeRank,
        schoolRank,
        totalStudentsInSection: studentAverages.length,
        totalStudentsInGrade: gradeStudents.length,
        totalStudentsInSchool: students.length,
        meritCategory,
        calculatedAt: new Date(),
        createdAt: new Date(), updatedAt: new Date(),
      });
    }
  }
  await db.collection('rankings').insertMany(rankingsData);
  console.log(`✅ Created ${rankingsData.length} ranking records`);

  // ══════════════════════════════════════════════
  // 17. ATTENDANCE (30 days for ALL students)
  // ══════════════════════════════════════════════
  const attendanceRecords = [];
  const statusWeights = ['Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Excused'];
  const lateReasons = ['Traffic delay', 'Woke up late', 'Long distance from home', 'Public transport issue', 'Family errand'];
  const lateArrivalTimes = ['08:15', '08:20', '08:30', '08:45', '09:00'];

  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const d = new Date(today.getTime() - dayOffset * 86400000);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const student of students) {
      const status = statusWeights[Math.floor(Math.random() * statusWeights.length)];
      const record = {
        student: student._id, section: student.section,
        date: d, status,
        markedBy: userIdMap['TCH001'],
        createdAt: new Date(), updatedAt: new Date(),
      };
      if (status === 'Late') {
        record.arrivalTime = lateArrivalTimes[Math.floor(Math.random() * lateArrivalTimes.length)];
        record.lateReason = lateReasons[Math.floor(Math.random() * lateReasons.length)];
      }
      if (status === 'Absent' || status === 'Excused') {
        record.remarks = status === 'Excused' ? 'Medical appointment' : 'No show';
      }
      attendanceRecords.push(record);
    }
  }
  await db.collection('attendances').insertMany(attendanceRecords);
  console.log(`✅ Created ${attendanceRecords.length} attendance records (all students, 30 days)`);

  // ── Teacher Attendance ──
  const teacherStatuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Present', 'Present', 'On Leave'];
  const teacherCheckIn = ['07:45', '07:50', '07:55', '08:00', '08:05', '08:10'];
  const teacherCheckOut = ['15:00', '15:15', '15:30', '15:45', '16:00'];
  for (const teacher of teachers) {
    const attendanceEntries = [];
    for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
      const d = new Date(today.getTime() - dayOffset * 86400000);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const status = teacherStatuses[Math.floor(Math.random() * teacherStatuses.length)];
      attendanceEntries.push({
        date: d, status,
        checkIn: teacherCheckIn[Math.floor(Math.random() * teacherCheckIn.length)],
        checkOut: teacherCheckOut[Math.floor(Math.random() * teacherCheckOut.length)],
        notes: status === 'On Leave' ? 'Annual leave' : status === 'Late' ? 'Arrived late due to traffic' : '',
      });
    }
    await db.collection('teachers').updateOne(
      { _id: teacher._id },
      { $push: { attendance: { $each: attendanceEntries } } }
    );
  }
  console.log(`✅ Created teacher attendance (${teachers.length} teachers, 30 days)`);

  // ── Attendance Correction Requests ──
  const insertedAttendance = await db.collection('attendances').find({ status: 'Absent' }).limit(5).toArray();
  if (insertedAttendance.length > 0) {
    const correctionRecords = insertedAttendance.map((rec, i) => ({
      attendance: rec._id, student: rec.student, section: rec.section,
      date: rec.date, originalStatus: 'Absent',
      requestedStatus: ['Present', 'Excused', 'Late', 'Present', 'Excused'][i],
      reason: ['Student was actually present', 'Had a doctor\'s appointment', 'Arrived late but marked absent', 'Mistaken identity', 'Family emergency'][i],
      requestedBy: userIdMap[['STU001', 'STU002', 'STU003', 'STU004', 'STU005'][i]],
      status: i < 3 ? 'Pending' : 'Approved',
      reviewedBy: i >= 3 ? userIdMap['ACA001'] : null,
      reviewNotes: i >= 3 ? 'Corrected upon verification with class teacher' : null,
      createdAt: new Date(), updatedAt: new Date(),
    }));
    await db.collection('attendancecorrections').insertMany(correctionRecords);
    console.log(`✅ Created ${correctionRecords.length} attendance correction requests`);
  }

  // ══════════════════════════════════════════════
  // 18. BORROWINGS
  // ══════════════════════════════════════════════
  const allBooks = await db.collection('books').find({}).toArray();
  const borrowingsData = [];
  for (let i = 0; i < Math.min(students.length, 20); i++) {
    const student = students[i];
    const book = allBooks[i % allBooks.length];
    const daysAgo = 10 + Math.floor(Math.random() * 30);
    const dueIn = Math.floor(Math.random() * 10) - 5; // negative means overdue
    borrowingsData.push({
      book: book._id, borrower: student._id, borrowerType: 'Student',
      issueDate: new Date(today.getTime() - daysAgo * 86400000),
      dueDate: new Date(today.getTime() + dueIn * 86400000),
      issuedBy: userIdMap['LIB001'],
      status: dueIn < 0 ? 'Overdue' : Math.random() > 0.3 ? 'Borrowed' : 'Returned',
      finePerDay: 5,
      ...(dueIn < 0 || status === 'Borrowed' ? {} : { returnDate: new Date(today.getTime() - Math.floor(Math.random() * 5) * 86400000) }),
      createdAt: new Date(), updatedAt: new Date(),
    });
  }
  await db.collection('borrowings').insertMany(borrowingsData.map(b => ({
    ...b, fine: b.status === 'Overdue' ? Math.floor(Math.random() * 50) : 0,
  })));
  console.log(`✅ Created ${borrowingsData.length} borrowing records`);

  // ══════════════════════════════════════════════
  // 19. ANNOUNCEMENTS
  // ══════════════════════════════════════════════
  const announcementsData = [
    { title: 'Welcome to the New Academic Year', content: 'We are excited to welcome all students and staff to the 2024/2025 academic year. Classes begin on Monday, September 1st. All students must report to their assigned sections by 8:00 AM.', publishedBy: userIdMap['ADM001'], audience: ['all'], status: 'Published', publishDate: new Date('2024-08-25'), priority: 'High' },
    { title: 'Midterm Examination Schedule', content: 'Midterm exams will be held from October 15-25. Please check the examination timetable. All students must ensure they have paid their fees before exams.', publishedBy: userIdMap['ACA001'], audience: ['students', 'teachers'], status: 'Published', publishDate: new Date('2024-10-01'), priority: 'High' },
    { title: 'Staff Meeting Reminder', content: 'All teachers are required to attend the monthly staff meeting on Friday at 3:00 PM in the staff room. Attendance is mandatory.', publishedBy: userIdMap['ADM001'], audience: ['teachers'], status: 'Published', publishDate: new Date('2024-09-15'), priority: 'Normal' },
    { title: 'Library Week Celebration', content: 'The school library will be celebrating Library Week from November 10-15. Activities include book fairs, reading competitions, and author visits.', publishedBy: userIdMap['LIB001'], audience: ['all'], status: 'Published', publishDate: new Date('2024-11-01'), priority: 'Normal' },
    { title: 'Parent-Teacher Conference', content: 'The first term parent-teacher conference will be held on December 5, 2024. Parents are encouraged to attend and discuss their children\'s progress.', publishedBy: userIdMap['DIR001'], audience: ['parents', 'teachers'], status: 'Published', publishDate: new Date('2024-11-15'), priority: 'High' },
    { title: 'Sports Day Announcement', content: 'Annual Sports Day will be held on December 1, 2024. Students are encouraged to participate in various athletic events.', publishedBy: userIdMap['KCO001'], audience: ['all'], status: 'Published', publishDate: new Date('2024-11-10'), priority: 'Normal' },
  ];
  await db.collection('announcements').insertMany(announcementsData.map(a => ({
    ...a, createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${announcementsData.length} announcements`);

  // ══════════════════════════════════════════════
  // 20. EVENTS
  // ══════════════════════════════════════════════
  const eventsData = [
    { title: 'First Day of School', eventType: 'Academic', startDate: new Date('2024-09-01'), endDate: new Date('2024-09-01'), description: 'Opening day for the 2024/2025 academic year', location: 'School Campus', status: 'Completed', color: '#1B4F8A' },
    { title: 'Midterm Examinations', eventType: 'Examination', startDate: new Date('2024-10-15'), endDate: new Date('2024-10-25'), description: 'Midterm exams for all grades 9-12', status: 'Upcoming', color: '#B5251A' },
    { title: 'Sports Day', eventType: 'Ceremony', startDate: new Date('2024-12-01'), endDate: new Date('2024-12-01'), description: 'Annual sports competition with athletics and team sports', location: 'School Sports Field', status: 'Upcoming', color: '#0F766E' },
    { title: 'End of Term 1 Break', eventType: 'Holiday', startDate: new Date('2025-01-15'), endDate: new Date('2025-02-01'), description: 'End of Term 1 break - students return February 2', status: 'Upcoming', color: '#7C3AED' },
    { title: 'Parent-Teacher Conference', eventType: 'Meeting', startDate: new Date('2024-12-05'), endDate: new Date('2024-12-05'), description: 'First term parent-teacher conference', location: 'School Hall', status: 'Upcoming', color: '#C9920A' },
    { title: 'Library Week', eventType: 'Cultural', startDate: new Date('2024-11-10'), endDate: new Date('2024-11-15'), description: 'Annual library week with reading competitions', location: 'Library', status: 'Upcoming', color: '#2D7D3A' },
    { title: 'National Flag Day', eventType: 'Holiday', startDate: new Date('2024-10-05'), endDate: new Date('2024-10-05'), description: 'Public holiday - Flag Day', status: 'Upcoming', color: '#1B4F8A' },
    { title: 'Ethiopian Christmas', eventType: 'Holiday', startDate: new Date('2025-01-07'), endDate: new Date('2025-01-07'), description: 'Genna - Ethiopian Christmas holiday', status: 'Upcoming', color: '#0F766E' },
  ];
  await db.collection('events').insertMany(eventsData.map(e => ({
    ...e, createdBy: userIdMap['ADM001'], createdAt: new Date(), updatedAt: new Date(),
  })));
  console.log(`✅ Created ${eventsData.length} events`);

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  Users:       ${allUsers.length} total (${studentUsersData.length} students, ${teachers.length} teachers, ${parentUsersData.length} parents, ${adminUsers.length} staff)`);
  console.log(`  Sections:    ${sections.length} (20 students each)`);
  console.log(`  Students:    ${students.length} across all sections`);
  console.log(`  Teachers:    ${teachers.length} with homeroom assignments`);
  console.log(`  Subjects:    ${subjects.length}`);
  console.log(`  Subjects Schedules: ${scheduleData.length} slots`);
  console.log(`  Timetables:  ${sections.length} timetables created`);
  console.log(`  Assessments: ${assessments.length} with ${marksData.length} marks`);
  console.log(`  Rankings:    ${rankingsData.length} records calculated`);
  console.log(`  Attendance:  ${attendanceRecords.length} records (30 days)`);
  console.log(`  Payments:    ${paymentsData.length} records`);
  console.log(`  Books:       ${booksData.length}, Borrowings: ${borrowingsData.length}`);
  console.log(`  Guardians:   ${guardiansData.length}`);
  console.log(`  Announcements: ${announcementsData.length}`);
  console.log(`  Events:      ${eventsData.length}\n`);

  console.log('🔑 Demo Accounts:');
  console.log('  Admin:     admin@school.edu.et       / Admin123!');
  console.log('  Director:  director@school.edu.et    / Admin123!');
  console.log('  Teacher:   teacher@school.edu.et     / Teacher123!');
  console.log('  Student:   student@school.edu.et     / Student123!');
  console.log('            (any student can log in as firstname.lastname@school.edu.et / Student123!)');
  console.log('  Parent:    parent@school.edu.et      / Parent123!\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); });
