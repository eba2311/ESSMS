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

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGrade(mark: number): string {
  if (mark >= 90) return 'A+';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B';
  if (mark >= 60) return 'C';
  if (mark >= 50) return 'D';
  return 'F';
}

function calcLetterGrade(pct: number): { letter: string; gradePoint: number } {
  if (pct >= 90) return { letter: 'A', gradePoint: 4.0 };
  if (pct >= 80) return { letter: 'B', gradePoint: 3.0 };
  if (pct >= 70) return { letter: 'C', gradePoint: 2.0 };
  if (pct >= 60) return { letter: 'D', gradePoint: 1.0 };
  return { letter: 'F', gradePoint: 0 };
}

function getResultStatus(avg: number): string {
  if (avg >= 90) return 'Excellent';
  if (avg >= 80) return 'Very Good';
  if (avg >= 70) return 'Good';
  if (avg >= 50) return 'Pass';
  return 'Fail';
}

const ETHIOPIAN_FIRST_NAMES_MALE = [
  'Abebe', 'Alemu', 'Chala', 'Dawit', 'Ephrem', 'Fikru', 'Getachew', 'Henok',
  'Isayas', 'Jemberu', 'Kibrom', 'Lulseged', 'Mekonnen', 'Nebiyu', 'Omer', 'Berhanu',
  'Tamiru', 'Yonas', 'Zerihun', 'Abel', 'Bereket', 'Daniel', 'Elias', 'Fisseha',
  'Girma', 'Habtamu', 'Indrias', 'Kebede', 'Lemi', 'Mulugeta', 'Nigus', 'Rahel',
  'Solomon', 'Tekle', 'Yosef', 'Zewde', 'Aschalew', 'Baye', 'Dagim', 'Endalkachew',
];

const ETHIOPIAN_FIRST_NAMES_FEMALE = [
  'Birtukan', 'Shewit', 'Hanna', 'Selam', 'Aster', 'Meron', 'Tigist', 'Fatima',
  'Rahel', 'Mekdes', 'Haben', 'Lidya', 'Mahlet', 'Nuhamin', 'Sara', 'Tigist',
  'Betelhem', 'Desta', 'Eden', 'Frehiwot', 'Genet', 'Hiwot', 'Jawar', 'Kidist',
  'Loza', 'Meskerem', 'Nardos', 'Rebecca', 'Samira', 'Taye', 'Woinshet', 'Yeshi',
  'Abigail', 'Brhanu', 'Catherine', 'Dagmawi', 'Eleni', 'Foziya', 'Genade',
];

const LAST_NAMES = [
  'Kebede', 'Lemma', 'Alemayehu', 'Dessalegn', 'Hagos', 'Assefa', 'Girma', 'Tadesse',
  'Wondimu', 'Mekonnen', 'Haile', 'Abebe', 'Tesfaye', 'Ayele', 'Gebre', 'Demeke',
  'Beyene', 'Worku', 'Amare', 'Fekadu', 'Tilahun', 'Mamo', 'Negash', 'Woldemariam',
  'Yilma', 'Dawit', 'Gebremedhin', 'Berhane', 'Haileselassie', 'Teshome',
  'Abera', 'Bekele', 'Chollo', 'Dadi', 'Endale', 'Fantahun', 'Gezahegn', 'Habte',
];

const CITIES = ['Addis Ababa', 'Bahir Dar', 'Hawassa', 'Dire Dawa', 'Mekelle', 'Adama', 'Jimma'];
const SUBCITIES = ['Bole', 'Kirkos', 'Yeka', 'Lideta', 'Arada', 'Gulele', 'Nifas Silk', 'Akaki'];
const WOREDA = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];

const TEACHER_FIRST_NAMES = [
  'John', 'Sara', 'Tadesse', 'Aster', 'Mulugeta', 'Hanna', 'Dawit', 'Selam',
  'Yonas', 'Fatima', 'Bekele', 'Genet', 'Mesfin', 'Tigist', 'Abel', 'Lidya',
  'Nigus', 'Mahlet', 'Girma', 'Eleni',
];
const TEACHER_LAST_NAMES = [
  'Doe', 'Wondimu', 'Alemu', 'Mekonnen', 'Gebre', 'Lemma', 'Haile', 'Ayele',
  'Tesfaye', 'Berhane', 'Worku', 'Amare', 'Tilahun', 'Girma', 'Dawit',
  'Kibrom', 'Negash', 'Fekadu', 'Beyene', 'Gebremedhin',
];

const SUBJECTS_TEACHING = [
  'Mathematics', 'English', 'Amharic', 'Biology', 'Chemistry',
  'Physics', 'History', 'Geography', 'ICT', 'Physical Education', 'Civics',
];

export async function runFullSeed(log: (msg: string) => void = console.log) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const baseYear = currentMonth >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const currentAY = `${baseYear}/${baseYear + 1}`;

  const S = new mongoose.Schema({}, { strict: false, timestamps: true });
  const User = mongoose.models.User || mongoose.model('User', S);
  const Student = mongoose.models.Student || mongoose.model('Student', S);
  const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', S);
  const Section = mongoose.models.Section || mongoose.model('Section', S);
  const Subject = mongoose.models.Subject || mongoose.model('Subject', S);
  const Classroom = mongoose.models.Classroom || mongoose.model('Classroom', S);
  const Guardian = mongoose.models.Guardian || mongoose.model('Guardian', S);
  const Book = mongoose.models.Book || mongoose.model('Book', S);
  const Settings = mongoose.models.Settings || mongoose.model('Settings', S);
  const TeacherAssignment = mongoose.models.TeacherAssignment || mongoose.model('TeacherAssignment', S);
  const SubjectAssignment = mongoose.models.SubjectAssignment || mongoose.model('SubjectAssignment', S);
  const SubjectSchedule = mongoose.models.SubjectSchedule || mongoose.model('SubjectSchedule', S);
  const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', S);
  const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', S);
  const AssessmentMark = mongoose.models.AssessmentMark || mongoose.model('AssessmentMark', S);
  const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', S);
  const SemesterResult = mongoose.models.SemesterResult || mongoose.model('SemesterResult', S);
  const AnnualResult = mongoose.models.AnnualResult || mongoose.model('AnnualResult', S);
  const FeeStructure = mongoose.models.FeeStructure || mongoose.model('FeeStructure', S);
  const Payment = mongoose.models.Payment || mongoose.model('Payment', S);
  const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', S);
  const Event = mongoose.models.Event || mongoose.model('Event', S);
  const Borrowing = mongoose.models.Borrowing || mongoose.model('Borrowing', S);

  const collections = [
    User, Student, Teacher, Section, Subject, Classroom, Guardian, Book,
    TeacherAssignment, SubjectAssignment, SubjectSchedule, Timetable,
    Assessment, AssessmentMark, Attendance, SemesterResult, AnnualResult,
    FeeStructure, Payment, Announcement, Event, Borrowing,
  ];
  const extraModels = [
    'GradeScale', 'AcademicTerm', 'Transport', 'Inventory', 'Message',
    'Notification', 'CounselingSession', 'BehavioralReport', 'HealthRecord',
    'AttendanceCorrection', 'Alumni', 'TransferLog', 'SubjectResource',
    'SubjectMaterial', 'Ranking', 'Settings',
  ];
  for (const modelName of extraModels) {
    try {
      const M = mongoose.models[modelName] || mongoose.model(modelName, S);
      collections.push(M);
    } catch { /* model not registered yet, will be on first use */ }
  }
  await Promise.all(collections.map(c => c.deleteMany({})));
  log('Cleared all data');

  const [pwdAdmin, pwdTeacher, pwdStudent, pwdParent] = await Promise.all([
    hashPassword('Admin123!'), hashPassword('Teacher123!'),
    hashPassword('Student123!'), hashPassword('Parent123!'),
  ]);

  // ═══════════════════════════════════════
  // 1. ADMIN / STAFF USERS (10)
  // ═══════════════════════════════════════
  const adminUsersData = [
    { userId: 'ADM001', username: 'admin', firstName: 'Admin', lastName: 'User', email: 'admin@school.edu.et', passwordHash: pwdAdmin, role: 'system_admin' },
    { userId: 'DIR001', username: 'director', firstName: 'Tigist', lastName: 'Haile', email: 'director@school.edu.et', passwordHash: pwdAdmin, role: 'school_director' },
    { userId: 'ACA001', username: 'academic', firstName: 'Biruk', lastName: 'Abebe', email: 'academic@school.edu.et', passwordHash: pwdAdmin, role: 'academic_head' },
    { userId: 'REG001', username: 'registrar', firstName: 'Hanna', lastName: 'Lemma', email: 'registrar@school.edu.et', passwordHash: pwdAdmin, role: 'registrar' },
    { userId: 'FIN001', username: 'finance', firstName: 'Meron', lastName: 'Tesfaye', email: 'finance@school.edu.et', passwordHash: pwdAdmin, role: 'finance_officer' },
    { userId: 'KCO001', username: 'counselor', firstName: 'Selam', lastName: 'Ayele', email: 'counselor@school.edu.et', passwordHash: pwdAdmin, role: 'counselor' },
    { userId: 'LIB001', username: 'librarian', firstName: 'Dawit', lastName: 'Girma', email: 'librarian@school.edu.et', passwordHash: pwdAdmin, role: 'librarian' },
  ];
  const adminUsers = await User.insertMany(adminUsersData.map(u => ({
    ...u, isActive: true, mfaEnabled: false, failedLoginAttempts: 0, forcePasswordChange: false,
  }))) as any[];
  log(`Created ${adminUsers.length} admin/staff users`);

  // ═══════════════════════════════════════
  // 2. SECTIONS (10)
  // ═══════════════════════════════════════
  const sectionsData = [
    { name: 'A', grade: 9, stream: 'Common', capacity: 50, academicYear: currentAY },
    { name: 'B', grade: 9, stream: 'Common', capacity: 50, academicYear: currentAY },
    { name: 'A', grade: 10, stream: 'Common', capacity: 50, academicYear: currentAY },
    { name: 'B', grade: 10, stream: 'Common', capacity: 50, academicYear: currentAY },
    { name: 'A', grade: 11, stream: 'Natural Science', capacity: 40, academicYear: currentAY },
    { name: 'B', grade: 11, stream: 'Social Science', capacity: 40, academicYear: currentAY },
    { name: 'C', grade: 11, stream: 'Common', capacity: 40, academicYear: currentAY },
    { name: 'A', grade: 12, stream: 'Natural Science', capacity: 40, academicYear: currentAY },
    { name: 'B', grade: 12, stream: 'Social Science', capacity: 40, academicYear: currentAY },
    { name: 'C', grade: 12, stream: 'Common', capacity: 40, academicYear: currentAY },
  ];
  const sections = await Section.insertMany(sectionsData) as any[];
  log(`Created ${sections.length} sections`);

  // ═══════════════════════════════════════
  // 3. SUBJECTS (11)
  // ═══════════════════════════════════════
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH', shortName: 'Math', subjectType: 'Compulsory', grades: [9, 10], streams: [], weeklyPeriods: 5, academicYear: currentAY, isCore: true },
    { name: 'English', code: 'ENG', shortName: 'Eng', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: [], weeklyPeriods: 4, academicYear: currentAY, isCore: true },
    { name: 'Amharic', code: 'AMH', shortName: 'Amh', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: [], weeklyPeriods: 3, academicYear: currentAY, isCore: true },
    { name: 'Biology', code: 'BIO', shortName: 'Bio', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: ['Natural Science'], weeklyPeriods: 3, academicYear: currentAY, isCore: true },
    { name: 'Chemistry', code: 'CHEM', shortName: 'Chem', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: ['Natural Science'], weeklyPeriods: 3, academicYear: currentAY, isCore: true },
    { name: 'Physics', code: 'PHYS', shortName: 'Phys', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: ['Natural Science'], weeklyPeriods: 3, academicYear: currentAY, isCore: true },
    { name: 'History', code: 'HIST', shortName: 'Hist', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: ['Social Science'], weeklyPeriods: 3, academicYear: currentAY, isCore: true },
    { name: 'Geography', code: 'GEOG', shortName: 'Geog', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: ['Social Science'], weeklyPeriods: 3, academicYear: currentAY, isCore: true },
    { name: 'ICT', code: 'ICT', shortName: 'ICT', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: [], weeklyPeriods: 2, academicYear: currentAY, isCore: true },
    { name: 'Physical Education', code: 'PE', shortName: 'PE', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: [], weeklyPeriods: 2, academicYear: currentAY, isCore: false },
    { name: 'Civics', code: 'CIV', shortName: 'Civ', subjectType: 'Compulsory', grades: [9, 10, 11, 12], streams: [], weeklyPeriods: 2, academicYear: currentAY, isCore: true },
  ];
  const subjects = await Subject.insertMany(subjectsData) as any[];
  log(`Created ${subjects.length} subjects`);

  // ═══════════════════════════════════════
  // 4. CLASSROOMS (10)
  // ═══════════════════════════════════════
  const classroomsData = [
    { roomNumber: '101', building: 'Main', floor: 1, capacity: 50, type: 'Regular', status: 'Available', facilities: ['Projector', 'Whiteboard'] },
    { roomNumber: '102', building: 'Main', floor: 1, capacity: 50, type: 'Regular', status: 'Available', facilities: ['Whiteboard'] },
    { roomNumber: '201', building: 'Main', floor: 2, capacity: 50, type: 'Regular', status: 'Available', facilities: ['Projector', 'Whiteboard'] },
    { roomNumber: '202', building: 'Main', floor: 2, capacity: 50, type: 'Regular', status: 'Available', facilities: ['Whiteboard'] },
    { roomNumber: '301', building: 'Science', floor: 1, capacity: 40, type: 'Laboratory', status: 'Available', facilities: ['Chemistry Lab', 'Safety Equipment'] },
    { roomNumber: '302', building: 'Science', floor: 1, capacity: 40, type: 'Laboratory', status: 'Available', facilities: ['Physics Lab'] },
    { roomNumber: '303', building: 'Science', floor: 2, capacity: 40, type: 'Laboratory', status: 'Available', facilities: ['Biology Lab', 'Microscopes'] },
    { roomNumber: '401', building: 'Main', floor: 3, capacity: 40, type: 'Regular', status: 'Available', facilities: ['Projector'] },
    { roomNumber: '402', building: 'Main', floor: 3, capacity: 40, type: 'Regular', status: 'Available', facilities: ['Whiteboard'] },
    { roomNumber: '501', building: 'Tech', floor: 1, capacity: 35, type: 'Computer Lab', status: 'Available', facilities: ['Computers', 'Projector', 'Internet'] },
  ];
  await Classroom.insertMany(classroomsData);

  // ═══════════════════════════════════════
  // 5. TEACHER USERS + TEACHER RECORDS (20)
  // ═══════════════════════════════════════
  const teacherUsersData = [];
  const teachersData = [];
  for (let i = 0; i < 20; i++) {
    const fn = TEACHER_FIRST_NAMES[i];
    const ln = TEACHER_LAST_NAMES[i];
    const gender = ['John', 'Dawit', 'Tadesse', 'Yonas', 'Mulugeta', 'Bekele', 'Nigus', 'Abel', 'Girma', 'Mesfin'].includes(fn) ? 'Male' : 'Female';
    const exp = rand(3, 25);
    const empYear = baseYear - exp;
    teacherUsersData.push({
      userId: `TCH${String(i + 1).padStart(3, '0')}`,
      username: `teacher${i + 1}`,
      firstName: fn,
      lastName: ln,
      email: `teacher${i + 1}@school.edu.et`,
      passwordHash: pwdTeacher,
      role: 'teacher',
      isActive: true,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      forcePasswordChange: false,
      phone: `+2519${rand(10000000, 99999999)}`,
    });
    teachersData.push({
      teacherId: `TCH${String(i + 1).padStart(3, '0')}`,
      firstName: fn,
      lastName: ln,
      gender,
      dateOfBirth: new Date(`${1970 + rand(0, 20)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`),
      nationality: 'Ethiopian',
      phoneNumber: `+2519${rand(10000000, 99999999)}`,
      email: `teacher${i + 1}@school.edu.et`,
      employmentDate: new Date(`${empYear}-09-01`),
      employmentType: 'Full-time',
      position: i < 2 ? 'Department Head' : 'Subject Teacher',
      status: 'Active',
      yearsOfExperience: exp,
      qualifications: [{
        degree: pick(['B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'BA', 'MA']),
        field: SUBJECTS_TEACHING[i % SUBJECTS_TEACHING.length],
        institution: pick(['AAU', 'Addis Ababa University', 'Jimma University', 'Bahir Dar University', 'Hawassa University', 'Adama Science University']),
        year: empYear,
      }],
      specialization: SUBJECTS_TEACHING[i % SUBJECTS_TEACHING.length],
    });
  }
  const teacherUsers = await User.insertMany(teacherUsersData) as any[];
  log(`Created ${teacherUsers.length} teacher users`);

  // Link userId to teacher records BEFORE inserting (model requires userId)
  for (const t of teachersData) {
    const u = teacherUsers.find((tu: any) => tu.userId === t.teacherId);
    if (u) t.userId = u._id;
  }
  const teacherDocs = await Teacher.insertMany(teachersData) as any[];
  log(`Created ${teacherDocs.length} teacher records`);

  // Save userId for any previously existing records
  for (const t of teacherDocs) {
    const u = teacherUsers.find((tu: any) => tu.userId === t.teacherId);
    if (u && !t.userId) {
      t.userId = u._id;
      await t.save();
    }
  }

  // ═══════════════════════════════════════
  // 6. STUDENT USERS + STUDENT RECORDS (200)
  // ═══════════════════════════════════════
  const studentUsersData = [];
  const studentsData = [];
  const guardianUsersData = [];
  const guardiansData = [];

  let studentIdx = 0;
  for (const section of sections) {
    for (let j = 0; j < 20; j++) {
      studentIdx++;
      const gender = j % 2 === 0 ? 'Male' : 'Female';
      const firstName = gender === 'Male'
        ? ETHIOPIAN_FIRST_NAMES_MALE[rand(0, ETHIOPIAN_FIRST_NAMES_MALE.length - 1)]
        : ETHIOPIAN_FIRST_NAMES_FEMALE[rand(0, ETHIOPIAN_FIRST_NAMES_FEMALE.length - 1)];
      const lastName = LAST_NAMES[rand(0, LAST_NAMES.length - 1)];
      const sid = `STU${String(studentIdx).padStart(3, '0')}`;
      const birthYear = baseYear - section.grade - rand(14, 16);

      studentUsersData.push({
        userId: sid,
        username: `student${studentIdx}`,
        firstName,
        lastName,
        email: `student${studentIdx}@school.edu.et`,
        passwordHash: pwdStudent,
        role: 'student',
        isActive: true,
        mfaEnabled: false,
        failedLoginAttempts: 0,
        forcePasswordChange: false,
      });

      const stream = section.stream === 'Natural Science' ? 'Natural Science'
        : section.stream === 'Social Science' ? 'Social Science' : 'Common';

      studentsData.push({
        studentId: sid,
        admissionNumber: `ADM-${String(baseYear).slice(-2)}-${String(studentIdx).padStart(3, '0')}`,
        firstName,
        lastName,
        dateOfBirth: new Date(`${birthYear}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`),
        gender,
        nationality: 'Ethiopian',
        grade: section.grade,
        section: section._id,
        stream,
        enrollmentDate: new Date(`${baseYear - (section.grade - 9)}-09-01`),
        status: 'Active',
        academicYear: currentAY,
        address: {
          city: pick(CITIES),
          subcity: pick(SUBCITIES),
          woreda: pick(WOREDA),
          houseNumber: String(rand(1, 500)),
        },
        emergencyContact: {
          name: `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`,
          relationship: pick(['Father', 'Mother', 'Uncle', 'Aunt']),
          phone: `+2519${rand(10000000, 99999999)}`,
        },
        medicalInfo: {
          bloodType: pick(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
          allergies: rand(1, 10) > 7 ? [pick(['Dust', 'Pollen', 'Peanuts'])] : [],
        },
      });

      // Create guardian every 2 students (100 guardians for 200 students)
      if (j % 2 === 0) {
        const gid = `PRN${String(studentIdx).padStart(3, '0')}`;
        const parentGender = rand(0, 1) === 0 ? 'Male' : 'Female';
        const parentFirst = parentGender === 'Male'
          ? ETHIOPIAN_FIRST_NAMES_MALE[rand(0, ETHIOPIAN_FIRST_NAMES_MALE.length - 1)]
          : ETHIOPIAN_FIRST_NAMES_FEMALE[rand(0, ETHIOPIAN_FIRST_NAMES_FEMALE.length - 1)];
        const parentLast = pick(LAST_NAMES);

        guardianUsersData.push({
          userId: gid,
          username: `parent${studentIdx}`,
          firstName: parentFirst,
          lastName: parentLast,
          email: `parent${studentIdx}@school.edu.et`,
          passwordHash: pwdParent,
          role: 'parent',
          isActive: true,
          mfaEnabled: false,
          failedLoginAttempts: 0,
          forcePasswordChange: false,
        });
        guardiansData.push({
          firstName: parentFirst,
          lastName: parentLast,
          phone: `+2519${rand(10000000, 99999999)}`,
          email: `parent${studentIdx}@school.edu.et`,
          relationship: pick(['Father', 'Mother']),
          occupation: pick(['Teacher', 'Farmer', 'Trader', 'Doctor', 'Engineer', 'Government Employee', 'Housewife', 'Driver']),
          address: {
            city: pick(CITIES),
            subcity: pick(SUBCITIES),
            woreda: pick(WOREDA),
          },
          students: [], // will fill after students are created
        });
      }
    }
  }

  const studentUsers = await User.insertMany(studentUsersData) as any[];
  log(`Created ${studentUsers.length} student users`);

  // Link userId to student records
  for (const s of studentsData) {
    const u = studentUsers.find((su: any) => su.userId === s.studentId);
    if (u) s.userId = u._id;
  }
  const studentDocs = await Student.insertMany(studentsData) as any[];
  log(`Created ${studentDocs.length} student records`);

  // Link guardians to students
  const guardianUsers = await User.insertMany(guardianUsersData) as any[];
  for (let i = 0; i < guardiansData.length; i++) {
    const studentStart = i * 2;
    guardiansData[i].students = [studentDocs[studentStart]._id];
    if (studentDocs[studentStart + 1]) {
      guardiansData[i].students.push(studentDocs[studentStart + 1]._id);
    }
  }
  const guardianDocs = await Guardian.insertMany(guardiansData) as any[];
  log(`Created ${guardianDocs.length} guardians`);

  // ═══════════════════════════════════════
  // 7. TEACHER ASSIGNMENTS — every section×subject covered
  // ═══════════════════════════════════════
  // Build a map of which subjects each section needs
  const sectionSubjectNeeds: { section: any; subject: any; subjectIdx: number }[] = [];
  for (const sec of sections) {
    for (let si = 0; si < subjects.length; si++) {
      const sub = subjects[si];
      const grades = sub.grades || [];
      if (!grades.includes(sec.grade)) continue;
      const streams = sub.streams || [];
      if (streams.length > 0 && !streams.includes(sec.stream)) continue;
      sectionSubjectNeeds.push({ section: sec, subject: sub, subjectIdx: si });
    }
  }

  // Assign each teacher to subjects they specialize in (round-robin by subject)
  // Each teacher gets ~3-5 sections per subject they teach
  const teacherSubjectSections: Record<number, { section: any; subject: any; subjectIdx: number }[]> = {};
  for (let i = 0; i < teacherDocs.length; i++) {
    teacherSubjectSections[i] = [];
  }

  // Group needs by subject index
  const needsBySubject: Record<number, { section: any; subject: any; subjectIdx: number }[]> = {};
  for (const need of sectionSubjectNeeds) {
    if (!needsBySubject[need.subjectIdx]) needsBySubject[need.subjectIdx] = [];
    needsBySubject[need.subjectIdx].push(need);
  }

  // For each subject, assign teachers in round-robin
  const subjectTeacherAssignment: Record<string, any> = {}; // key: sectionId_subjectId => teacherDoc
  for (const [subjIdxStr, needs] of Object.entries(needsBySubject)) {
    const subjIdx = Number(subjIdxStr);
    // Find teachers who can teach this subject (match by specialization or index range)
    const eligibleTeachers = teacherDocs.filter((_: any, i: number) => {
      const tSubjIdx = i % subjects.length;
      // Math(0), English(1), Amharic(2): any teacher can teach
      // Bio(3), Chem(4), Phys(5): science teachers
      // Hist(6), Geog(7): humanities teachers
      // ICT(8), PE(9), Civics(10): any
      if (subjIdx <= 2) return true;
      if (subjIdx <= 5) return tSubjIdx <= 5; // science-capable
      if (subjIdx <= 7) return tSubjIdx >= 3; // humanities-capable
      return true;
    });
    if (eligibleTeachers.length === 0) eligibleTeachers.push(...teacherDocs);

    for (let ni = 0; ni < needs.length; ni++) {
      const teacher = eligibleTeachers[ni % eligibleTeachers.length];
      const teacherIdx = teacherDocs.findIndex((t: any) => t._id.toString() === teacher._id.toString());
      const need = needs[ni];
      const key = `${need.section._id.toString()}_${need.subject._id.toString()}`;
      subjectTeacherAssignment[key] = teacher;
      teacherSubjectSections[teacherIdx >= 0 ? teacherIdx : 0].push(need);
    }
  }

  // Build TeacherAssignment documents (deduped)
  const teacherAssignmentsSet = new Set<string>();
  const teacherAssignmentsData: any[] = [];
  for (let i = 0; i < teacherDocs.length; i++) {
    for (const need of teacherSubjectSections[i]) {
      const key = `${teacherDocs[i]._id.toString()}_${need.section._id.toString()}_${need.subject._id.toString()}`;
      if (teacherAssignmentsSet.has(key)) continue;
      teacherAssignmentsSet.add(key);
      teacherAssignmentsData.push({
        teacher: teacherDocs[i]._id,
        section: need.section._id,
        subject: need.subject._id,
        academicYear: currentAY,
        periodsPerWeek: need.subject.weeklyPeriods || 3,
        isActive: true,
      });
    }
  }
  const teacherAssignments = await TeacherAssignment.insertMany(teacherAssignmentsData) as any[];
  log(`Created ${teacherAssignments.length} teacher assignments (all section×subject covered)`);

  // ═══════════════════════════════════════
  // 8. SUBJECT ASSIGNMENTS (curriculum per grade) — now with teacher linked
  // ═══════════════════════════════════════
  const subjectAssignmentsData: any[] = [];
  for (const sec of sections) {
    const g = sec.grade;
    for (const sub of subjects) {
      const grades = sub.grades || [];
      if (!grades.includes(g)) continue;
      const streams = sub.streams || [];
      if (streams.length > 0 && !streams.includes(sec.stream)) continue;
      const key = `${sec._id.toString()}_${sub._id.toString()}`;
      const teacher = subjectTeacherAssignment[key];
      subjectAssignmentsData.push({
        subject: sub._id,
        gradeLevel: g,
        section: sec._id,
        teacher: teacher?._id,
        academicYear: currentAY,
        status: 'Active',
      });
    }
  }
  await SubjectAssignment.insertMany(subjectAssignmentsData);
  log(`Created ${subjectAssignmentsData.length} subject assignments`);

  // ═══════════════════════════════════════
  // 9. SUBJECT SCHEDULES + TIMETABLES
  // ═══════════════════════════════════════
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    { start: '08:00', end: '08:45' },
    { start: '08:50', end: '09:35' },
    { start: '09:40', end: '10:25' },
    { start: '10:40', end: '11:25' },
    { start: '11:30', end: '12:15' },
    { start: '14:00', end: '14:45' },
  ];
  const scheduleData: any[] = [];
  const timetableData: any[] = [];

  for (const sec of sections) {
    const secSubjects = subjects.filter(s => {
      const grades = s.grades || [];
      if (!grades.includes(sec.grade)) return false;
      const streams = s.streams || [];
      if (streams.length > 0 && !streams.includes(sec.stream)) return false;
      return true;
    });
    const scheduleEntries: any[] = [];
    let periodIdx = 0;
    for (const sub of secSubjects) {
      const key = `${sec._id.toString()}_${sub._id.toString()}`;
      const teacherDoc = subjectTeacherAssignment[key];
      const teacherRef = teacherDoc?._id || teacherDocs[0]._id;
      const dayIdx = periodIdx % days.length;
      const perIdx = Math.floor(periodIdx / days.length) % periods.length;
      scheduleData.push({
        subject: sub._id,
        section: sec._id,
        teacher: teacherRef,
        dayOfWeek: days[dayIdx],
        startTime: periods[perIdx].start,
        endTime: periods[perIdx].end,
        academicYear: currentAY,
        semester: 1,
      });
      scheduleEntries.push({
        dayOfWeek: days[dayIdx],
        periodNumber: perIdx + 1,
        startTime: periods[perIdx].start,
        endTime: periods[perIdx].end,
        subject: sub._id,
        teacher: teacherRef,
      });
      periodIdx++;
    }
    timetableData.push({
      section: sec._id,
      academicYear: currentAY,
      effectiveFrom: new Date(`${baseYear}-09-01`),
      schedule: scheduleEntries,
      isActive: true,
    });
  }
  await SubjectSchedule.insertMany(scheduleData);
  await Timetable.insertMany(timetableData);
  log(`Created ${scheduleData.length} schedule slots, ${timetableData.length} timetables`);

  // ═══════════════════════════════════════
  // 10. FEE STRUCTURES
  // ═══════════════════════════════════════
  const feeData = [
    { academicYear: currentAY, grade: 9, components: [{ name: 'Tuition', amount: 5000 }, { name: 'Registration', amount: 500 }, { name: 'Books', amount: 1500 }], isActive: true },
    { academicYear: currentAY, grade: 10, components: [{ name: 'Tuition', amount: 5500 }, { name: 'Registration', amount: 500 }, { name: 'Books', amount: 1500 }], isActive: true },
    { academicYear: currentAY, grade: 11, components: [{ name: 'Tuition', amount: 6000 }, { name: 'Registration', amount: 500 }, { name: 'Lab Fee', amount: 1000 }], isActive: true },
    { academicYear: currentAY, grade: 12, components: [{ name: 'Tuition', amount: 6500 }, { name: 'Registration', amount: 500 }, { name: 'Lab Fee', amount: 1000 }], isActive: true },
  ];
  await FeeStructure.insertMany(feeData);
  log(`Created ${feeData.length} fee structures`);

  // ═══════════════════════════════════════
  // 11. PAYMENTS (for ~50% of students)
  // ═══════════════════════════════════════
  const financeUser = adminUsers.find((u: any) => u.userId === 'FIN001');
  const paymentsData: any[] = [];
  for (let i = 0; i < studentDocs.length; i += 2) {
    const s = studentDocs[i];
    const fee = feeData.find(f => f.grade === s.grade);
    const total = fee ? fee.components.reduce((sum: number, c: any) => sum + c.amount, 0) : 7000;
    const paid = rand(0, 2) === 0 ? total : Math.round(total * rand(30, 90) / 100);
    paymentsData.push({
      student: s._id,
      academicYear: currentAY,
      amount: paid,
      currency: 'ETB',
      paymentMethod: pick(['Cash', 'Bank Transfer', 'Mobile Money']),
      date: new Date(`${baseYear}-${String(rand(9, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`),
      receivedBy: financeUser?._id,
      remarks: 'Tuition payment',
    });
  }
  await Payment.insertMany(paymentsData);
  log(`Created ${paymentsData.length} payments`);

  // ═══════════════════════════════════════
  // 12. ASSESSMENTS + MARKS (Semester 1 & 2)
  // ═══════════════════════════════════════
  const assessmentTypes = ['Assignment', 'Quiz', 'Mid Exam', 'Final Exam'];
  const assessmentsData: any[] = [];

  let assessIdCounter = 0;
  for (const sec of sections) {
    const secSubjects = subjects.filter(s => {
      const grades = s.grades || [];
      if (!grades.includes(sec.grade)) return false;
      const streams = s.streams || [];
      if (streams.length > 0 && !streams.includes(sec.stream)) return false;
      return true;
    });
    for (const sub of secSubjects) {
      const key = `${sec._id.toString()}_${sub._id.toString()}`;
      const teacher = subjectTeacherAssignment[key] || teacherDocs[0]._id;
      for (const term of ['1', '2']) {
        for (const type of assessmentTypes) {
          assessIdCounter++;
          assessmentsData.push({
            assessmentId: `ASS${baseYear}${String(assessIdCounter).padStart(4, '0')}`,
            subject: sub._id,
            section: sec._id,
            teacher: teacher._id,
            type,
            title: `${sub.name} ${type} - Sem ${term}`,
            totalMarks: type === 'Quiz' ? rand(15, 30) : type === 'Assignment' ? rand(20, 40) : 100,
            date: new Date(`${term === '1' ? baseYear : baseYear + 1}-${String(rand(9, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`),
            academicYear: currentAY,
            term,
            status: 'Published',
            publishedBy: adminUsers[0]._id,
            publishedAt: new Date(),
          });
        }
      }
    }
  }

  // Batch insert assessments in chunks of 500
  const assessmentDocs: any[] = [];
  for (let i = 0; i < assessmentsData.length; i += 500) {
    const chunk = assessmentsData.slice(i, i + 500);
    const docs = await Assessment.insertMany(chunk) as any[];
    assessmentDocs.push(...docs);
  }
  log(`Created ${assessmentDocs.length} assessments`);

  // Create marks for all students
  const marksData: any[] = [];
  for (const assessment of assessmentDocs) {
    const secId = assessment.section.toString();
    const secStudents = studentDocs.filter((s: any) => s.section.toString() === secId);
    const totalMarks = assessment.totalMarks || 100;
    const enteredById = adminUsers[0]._id;
    for (const student of secStudents) {
      const base = rand(25, 85);
      const mark = Math.min(totalMarks, Math.max(0, base + rand(-15, 15)));
      const pct = parseFloat(((mark / totalMarks) * 100).toFixed(2));
      const { letter, gradePoint } = calcLetterGrade(pct);
      marksData.push({
        assessment: assessment._id,
        student: student._id,
        marksObtained: mark,
        percentage: pct,
        letterGrade: letter,
        gradePoint,
        enteredBy: enteredById,
        enteredAt: new Date(),
      });
    }
  }

  const assessmentMarkDocs: any[] = [];
  for (let i = 0; i < marksData.length; i += 1000) {
    const chunk = marksData.slice(i, i + 1000);
    const docs = await AssessmentMark.insertMany(chunk) as any[];
    assessmentMarkDocs.push(...docs);
  }
  log(`Created ${assessmentMarkDocs.length} assessment marks`);

  // ═══════════════════════════════════════
  // 13. SEMESTER RESULTS + ANNUAL RESULTS
  // ═══════════════════════════════════════
  const semesterResultsData: any[] = [];
  const annualResultsData: any[] = [];

  for (const sec of sections) {
    const secStudents = studentDocs.filter((s: any) => s.section.toString() === sec._id.toString());
    const secSubjects = subjects.filter(s => {
      const grades = s.grades || [];
      if (!grades.includes(sec.grade)) return false;
      const streams = s.streams || [];
      if (streams.length > 0 && !streams.includes(sec.stream)) return false;
      return true;
    });

    for (const student of secStudents) {
      let sem1Total = 0;
      let sem1Count = 0;
      let sem2Total = 0;
      let sem2Count = 0;

      for (const sub of secSubjects) {
        for (const term of ['1', '2'] as const) {
          const base = rand(30, 85);
          const mark = Math.min(100, Math.max(0, base + rand(-10, 15)));
          semesterResultsData.push({
            student: student._id,
            semester: term,
            subject: sub._id,
            mark,
            grade: getGrade(mark),
            academicYear: currentAY,
          });
          if (term === '1') { sem1Total += mark; sem1Count++; }
          else { sem2Total += mark; sem2Count++; }
        }
      }

      const sem1Avg = sem1Count > 0 ? parseFloat((sem1Total / sem1Count).toFixed(2)) : 0;
      const sem2Avg = sem2Count > 0 ? parseFloat((sem2Total / sem2Count).toFixed(2)) : 0;
      const annualAvg = parseFloat(((sem1Avg + sem2Avg) / 2).toFixed(2));
      const attendance = rand(75, 100);

      annualResultsData.push({
        student: student._id,
        academicYear: currentAY,
        semester1Total: sem1Total,
        semester1Average: sem1Avg,
        semester1Result: getResultStatus(sem1Avg),
        semester2Total: sem2Total,
        semester2Average: sem2Avg,
        semester2Result: getResultStatus(sem2Avg),
        annualAverage: annualAvg,
        finalResult: getResultStatus(annualAvg),
        promotionStatus: annualAvg >= 50 ? 'Promoted' : 'Repeat',
        attendance,
        conduct: pick(['Excellent', 'Very Good', 'Good', 'Satisfactory']),
      });
    }
  }

  // Batch insert semester results
  for (let i = 0; i < semesterResultsData.length; i += 1000) {
    const chunk = semesterResultsData.slice(i, i + 1000);
    await SemesterResult.insertMany(chunk);
  }
  log(`Created ${semesterResultsData.length} semester results`);

  await AnnualResult.insertMany(annualResultsData);
  log(`Created ${annualResultsData.length} annual results`);

  // ═══════════════════════════════════════
  // 14b. RANKINGS
  // ═══════════════════════════════════════
  const Ranking = mongoose.models.Ranking || mongoose.model('Ranking', S);
  const rankingsData: any[] = [];

  for (const term of ['1', '2'] as const) {
    for (const sec of sections) {
      const secStudents = studentDocs.filter((s: any) => s.section.toString() === sec._id.toString());
      const secAvgMap: { student: any; avg: number }[] = [];

      for (const student of secStudents) {
        const termResults = semesterResultsData.filter(
          (r: any) => r.student.toString() === student._id.toString() && r.semester === term
        );
        const avg = termResults.length > 0
          ? termResults.reduce((sum: number, r: any) => sum + r.mark, 0) / termResults.length
          : 0;
        secAvgMap.push({ student, avg: parseFloat(avg.toFixed(2)) });
      }

      secAvgMap.sort((a, b) => b.avg - a.avg);
      const total = secAvgMap.length;

      for (let rank = 0; rank < secAvgMap.length; rank++) {
        const { student, avg } = secAvgMap[rank];
        const gpa = avg >= 90 ? 4.0 : avg >= 80 ? 3.5 : avg >= 70 ? 3.0 : avg >= 60 ? 2.5 : avg >= 50 ? 2.0 : avg >= 40 ? 1.0 : 0;
        rankingsData.push({
          student: student._id,
          academicYear: currentAY,
          term,
          overallAverage: avg,
          gpa,
          sectionRank: rank + 1,
          totalStudentsInSection: total,
          subjectAverages: [],
          calculatedAt: new Date(),
        });
      }
    }
  }

  for (let i = 0; i < rankingsData.length; i += 1000) {
    await Ranking.insertMany(rankingsData.slice(i, i + 1000));
  }
  log(`Created ${rankingsData.length} rankings`);

  // ═══════════════════════════════════════
  // 14. ATTENDANCE (40 school days for all sections)
  // ═══════════════════════════════════════
  const attendanceData: any[] = [];
  const schoolDays: Date[] = [];
  let d = new Date(`${baseYear}-09-02`);
  while (schoolDays.length < 40) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      schoolDays.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  for (const sec of sections) {
    const secStudents = studentDocs.filter((s: any) => s.section.toString() === sec._id.toString());
    for (const schoolDay of schoolDays) {
      for (const student of secStudents) {
        const r = Math.random();
        const status = r < 0.82 ? 'Present' : r < 0.90 ? 'Late' : r < 0.96 ? 'Absent' : 'Excused';
        attendanceData.push({
          student: student._id,
          section: sec._id,
          date: schoolDay,
          status,
          markedBy: adminUsers[0]._id,
        });
      }
    }
  }

  // Batch insert attendance
  for (let i = 0; i < attendanceData.length; i += 2000) {
    const chunk = attendanceData.slice(i, i + 2000);
    await Attendance.insertMany(chunk);
  }
  log(`Created ${attendanceData.length} attendance records`);

  // ═══════════════════════════════════════
  // 15. BOOKS
  // ═══════════════════════════════════════
  const booksData = [
    { isbn: '978-99944-2-543-7', title: 'Mathematics for Grade 9', author: 'MoE Ethiopia', publisher: 'EMPDE', publicationYear: 2020, category: 'Textbook', quantity: 200, availableCopies: 180, location: 'Library Shelf A1' },
    { isbn: '978-99944-2-544-4', title: 'English for Grade 9', author: 'MoE Ethiopia', publisher: 'EMPDE', publicationYear: 2020, category: 'Textbook', quantity: 200, availableCopies: 175, location: 'Library Shelf A2' },
    { isbn: '978-99944-2-545-1', title: 'Biology for Grade 10', author: 'MoE Ethiopia', publisher: 'EMPDE', publicationYear: 2020, category: 'Textbook', quantity: 150, availableCopies: 140, location: 'Library Shelf B1' },
    { isbn: '978-99944-2-546-8', title: 'Chemistry for Grade 11', author: 'MoE Ethiopia', publisher: 'EMPDE', publicationYear: 2021, category: 'Textbook', quantity: 120, availableCopies: 115, location: 'Library Shelf B2' },
    { isbn: '978-99944-2-547-5', title: 'Physics for Grade 11', author: 'MoE Ethiopia', publisher: 'EMPDE', publicationYear: 2021, category: 'Textbook', quantity: 120, availableCopies: 110, location: 'Library Shelf B3' },
    { isbn: '978-0435-12345-6', title: 'Introduction to Algorithms', author: 'Thomas Cormen', publisher: 'MIT Press', publicationYear: 2009, category: 'Reference', quantity: 10, availableCopies: 7, location: 'Library Shelf C1' },
    { isbn: '978-0435-12345-7', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', publicationYear: 1925, category: 'Literature', quantity: 15, availableCopies: 12, location: 'Library Shelf D1' },
    { isbn: '978-0435-12345-8', title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'J.B. Lippincott', publicationYear: 1960, category: 'Literature', quantity: 12, availableCopies: 10, location: 'Library Shelf D2' },
    { isbn: '978-0435-12345-9', title: 'A History of Modern Ethiopia', author: 'Bahru Zewde', publisher: 'James Currey', publicationYear: 2001, category: 'History', quantity: 8, availableCopies: 7, location: 'Library Shelf E1' },
    { isbn: '978-0435-12346-0', title: 'Geography of Ethiopia', author: 'MoE Ethiopia', publisher: 'EMPDE', publicationYear: 2019, category: 'Textbook', quantity: 100, availableCopies: 90, location: 'Library Shelf A3' },
  ];
  await Book.insertMany(booksData);
  log(`Created ${booksData.length} books`);

  // ═══════════════════════════════════════
  // 16. BORROWINGS
  // ═══════════════════════════════════════
  const today = new Date();
  const allBooks = await Book.find() as any[];
  const librarianUser = adminUsers.find((u: any) => u.userId === 'LIB001');
  const borrowingsData: any[] = [];
  for (let i = 0; i < 30; i++) {
    const book = allBooks[rand(0, allBooks.length - 1)];
    const student = studentDocs[rand(0, studentDocs.length - 1)];
    const issueDate = new Date(today.getTime() - rand(5, 60) * 86400000);
    const dueDate = new Date(issueDate.getTime() + 14 * 86400000);
    const isReturned = Math.random() > 0.4;
    borrowingsData.push({
      book: book._id,
      borrower: student._id,
      borrowerType: 'Student',
      issueDate,
      dueDate,
      returnDate: isReturned ? new Date(dueDate.getTime() - rand(0, 5) * 86400000) : undefined,
      status: isReturned ? 'Returned' : dueDate < today ? 'Overdue' : 'Borrowed',
      issuedBy: librarianUser?._id,
    });
  }
  await Borrowing.insertMany(borrowingsData);
  log(`Created ${borrowingsData.length} borrowings`);

  // ═══════════════════════════════════════
  // 17. SETTINGS
  // ═══════════════════════════════════════
  await Settings.updateOne({}, {
    schoolName: 'Ethiopian Secondary School',
    schoolAddress: 'Bole Road, Addis Ababa, Ethiopia',
    schoolPhone: '+251 11 123 4567',
    schoolEmail: 'info@essms.edu.et',
    schoolWebsite: 'www.essms.edu.et',
    academicYear: currentAY,
    term: 1,
    semester: '1',
    gradingSystem: 'Percentage',
    maxStudentsPerSection: 50,
    enableAutomaticPromotion: false,
    enableParentPortal: true,
    enableSmsNotifications: false,
    enableEmailNotifications: true,
    enableTeacherAttendance: true,
    enableGuardianInvite: true,
    enableOnlineRegistration: false,
    sessionTimeout: 60,
    passMinLength: 8,
    lockoutAttempts: 5,
  }, { upsert: true });
  log('Created settings');

  // ═══════════════════════════════════════
  // 18. ANNOUNCEMENTS
  // ═══════════════════════════════════════
  const adminUser = adminUsers.find((u: any) => u.userId === 'ADM001');
  const announcementsData = [
    { title: 'Welcome to the New Academic Year', content: `We are excited to welcome all students and staff to the ${currentAY} academic year. Classes begin on Monday, September 1st.`, publishedBy: adminUser?._id, targetAudience: ['All'], status: 'Published', publishDate: new Date(`${baseYear}-08-25`), priority: 'High', category: 'Academic' },
    { title: 'Midterm Examination Schedule', content: 'Midterm exams will be held from October 15-25. Please check the examination timetable on the notice board.', publishedBy: adminUsers.find((u: any) => u.userId === 'ACA001')?._id, targetAudience: ['Students', 'Teachers'], status: 'Published', publishDate: new Date(`${baseYear}-10-01`), priority: 'High', category: 'Academic' },
    { title: 'Staff Meeting Reminder', content: 'All teachers are required to attend the monthly staff meeting on Friday at 3:00 PM in the staff room.', publishedBy: adminUser?._id, targetAudience: ['Teachers'], status: 'Published', publishDate: new Date(`${baseYear}-09-15`), priority: 'Medium', category: 'Administrative' },
    { title: 'Parent-Teacher Conference', content: 'Parent-teacher conferences will be held on December 10-11. All parents are encouraged to attend.', publishedBy: adminUser?._id, targetAudience: ['Parents', 'Teachers'], status: 'Published', publishDate: new Date(`${baseYear}-11-20`), priority: 'Medium', category: 'Academic' },
    { title: 'Annual Sports Day', content: 'Annual sports day will be held on December 1. All students are encouraged to participate in various events.', publishedBy: adminUser?._id, targetAudience: ['All'], status: 'Published', publishDate: new Date(`${baseYear}-11-15`), priority: 'Low', category: 'Events' },
  ];
  await Announcement.insertMany(announcementsData);
  log(`Created ${announcementsData.length} announcements`);

  // ═══════════════════════════════════════
  // 19. EVENTS
  // ═══════════════════════════════════════
  const eventsData = [
    { title: 'First Day of School', eventType: 'Academic', startDate: new Date(`${baseYear}-09-01`), description: `Opening day for the ${currentAY} academic year`, location: 'School Campus' },
    { title: 'Midterm Examinations', eventType: 'Examination', startDate: new Date(`${baseYear}-10-15`), endDate: new Date(`${baseYear}-10-25`), description: 'Midterm exams for all grades' },
    { title: 'Ethiopian Sports Day', eventType: 'Ceremony', startDate: new Date(`${baseYear}-12-01`), description: 'Annual sports competition', location: 'School Sports Field' },
    { title: 'End of Term 1', eventType: 'Holiday', startDate: new Date(`${baseYear + 1}-01-15`), endDate: new Date(`${baseYear + 1}-02-01`), description: 'End of Term 1 break' },
    { title: 'Final Examinations', eventType: 'Examination', startDate: new Date(`${baseYear + 1}-04-20`), endDate: new Date(`${baseYear + 1}-05-05`), description: 'Final exams for all grades' },
    { title: 'Graduation Ceremony', eventType: 'Ceremony', startDate: new Date(`${baseYear + 1}-07-15`), description: 'Grade 12 graduation ceremony', location: 'School Auditorium' },
  ];
  await Event.insertMany(eventsData);
  log(`Created ${eventsData.length} events`);

  // ═══════════════════════════════════════
  // 20. GRADE SCALE
  // ═══════════════════════════════════════
  const GradeScale = mongoose.models.GradeScale || mongoose.model('GradeScale', S);
  const gradeScaleData = {
    name: 'Standard Ethiopian Grading Scale',
    academicYear: currentAY,
    isActive: true,
    passThreshold: 50,
    createdBy: adminUsers[0]._id,
    typeWeights: [
      { type: 'Assignment', weight: 10 },
      { type: 'Quiz', weight: 10 },
      { type: 'Class Work', weight: 10 },
      { type: 'Project', weight: 10 },
      { type: 'Mid Exam', weight: 25 },
      { type: 'Final Exam', weight: 35 },
    ],
    gradeThresholds: [
      { letter: 'A+', minPercent: 90, gradePoint: 4.0 },
      { letter: 'A', minPercent: 80, gradePoint: 3.75 },
      { letter: 'B+', minPercent: 75, gradePoint: 3.5 },
      { letter: 'B', minPercent: 70, gradePoint: 3.0 },
      { letter: 'C+', minPercent: 65, gradePoint: 2.5 },
      { letter: 'C', minPercent: 60, gradePoint: 2.0 },
      { letter: 'D', minPercent: 50, gradePoint: 1.0 },
      { letter: 'F', minPercent: 0, gradePoint: 0 },
    ],
  };
  await GradeScale.create(gradeScaleData);
  log('Created grade scale');

  // ═══════════════════════════════════════
  // 21. ACADEMIC TERMS
  // ═══════════════════════════════════════
  const AcademicTerm = mongoose.models.AcademicTerm || mongoose.model('AcademicTerm', S);
  const academicTermsData = [
    { academicYear: currentAY, term: '1', name: `First Term ${currentAY}`, startDate: new Date(`${baseYear}-09-01`), endDate: new Date(`${baseYear}-12-20`), isActive: true, isCurrent: true },
    { academicYear: currentAY, term: '2', name: `Second Term ${currentAY}`, startDate: new Date(`${baseYear + 1}-01-10`), endDate: new Date(`${baseYear + 1}-04-10`), isActive: true, isCurrent: false },
  ];
  await AcademicTerm.insertMany(academicTermsData);
  log(`Created ${academicTermsData.length} academic terms`);

  // ═══════════════════════════════════════
  // 22. TRANSPORT (BUSES)
  // ═══════════════════════════════════════
  const Transport = mongoose.models.Transport || mongoose.model('Transport', S);
  const transportData = [
    { plateNumber: 'AA-12345', busNumber: 'BUS-001', capacity: 45, driverName: 'Abebe Kebede', driverPhone: '+251911223344', driverLicense: 'ETH-DL-001', routeName: 'Bole - School', routeStops: ['Bole', 'Megenagna', 'Piassa', 'School'], fee: 500, status: 'Active' },
    { plateNumber: 'AA-23456', busNumber: 'BUS-002', capacity: 40, driverName: 'Tadesse Lemma', driverPhone: '+251922334455', driverLicense: 'ETH-DL-002', routeName: 'Merkato - School', routeStops: ['Merkato', 'Piazza', 'Arada', 'School'], fee: 450, status: 'Active' },
    { plateNumber: 'AA-34567', busNumber: 'BUS-003', capacity: 50, driverName: 'Dawit Alemu', driverPhone: '+251933445566', driverLicense: 'ETH-DL-003', routeName: 'Kality - School', routeStops: ['Kality', 'Akaki', 'Bole', 'School'], fee: 550, status: 'Active' },
    { plateNumber: 'AA-45678', busNumber: 'BUS-004', capacity: 35, driverName: 'Yonas Gebre', driverPhone: '+251944556677', driverLicense: 'ETH-DL-004', routeName: 'Ayat - School', routeStops: ['Ayat', 'Yeka', 'Megenagna', 'School'], fee: 500, status: 'Maintenance' },
  ];
  await Transport.insertMany(transportData);
  log(`Created ${transportData.length} transport vehicles`);

  // ═══════════════════════════════════════
  // 23. INVENTORY
  // ═══════════════════════════════════════
  const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', S);
  const inventoryData = [
    { itemCode: 'INV-001', name: 'Student Desks', category: 'Furniture', quantity: 250, availableQuantity: 230, unit: 'pieces', condition: 'Good', location: 'Store Room A', purchasePrice: 3500, supplier: 'Addis Furniture PLC' },
    { itemCode: 'INV-002', name: 'Student Chairs', category: 'Furniture', quantity: 250, availableQuantity: 225, unit: 'pieces', condition: 'Good', location: 'Store Room A', purchasePrice: 2000, supplier: 'Addis Furniture PLC' },
    { itemCode: 'INV-003', name: 'Teacher Desks', category: 'Furniture', quantity: 25, availableQuantity: 24, unit: 'pieces', condition: 'New', location: 'Staff Room', purchasePrice: 8000, supplier: 'Addis Furniture PLC' },
    { itemCode: 'INV-004', name: 'Whiteboards', category: 'Furniture', quantity: 15, availableQuantity: 14, unit: 'pieces', condition: 'Good', location: 'Various Classrooms', purchasePrice: 5000, supplier: 'Ethiopian Stationery' },
    { itemCode: 'INV-005', name: 'Projectors', category: 'Electronics', quantity: 10, availableQuantity: 8, unit: 'pieces', condition: 'Good', location: 'Tech Room', purchasePrice: 45000, supplier: 'Ethio Tech Solutions' },
    { itemCode: 'INV-006', name: 'Desktop Computers', category: 'Electronics', quantity: 35, availableQuantity: 32, unit: 'pieces', condition: 'Good', location: 'Computer Lab', purchasePrice: 35000, supplier: 'Ethio Tech Solutions' },
    { itemCode: 'INV-007', name: 'Printers', category: 'Electronics', quantity: 5, availableQuantity: 4, unit: 'pieces', condition: 'Good', location: 'Admin Office', purchasePrice: 25000, supplier: 'Ethio Tech Solutions' },
    { itemCode: 'INV-008', name: 'Sound System', category: 'Electronics', quantity: 2, availableQuantity: 2, unit: 'sets', condition: 'New', location: 'Auditorium', purchasePrice: 120000, supplier: 'Addis Audio' },
    { itemCode: 'INV-009', name: 'Basketball Hoops', category: 'Sports', quantity: 4, availableQuantity: 4, unit: 'pieces', condition: 'Good', location: 'Sports Field', purchasePrice: 15000, supplier: 'Sports Ethiopia' },
    { itemCode: 'INV-010', name: 'Footballs', category: 'Sports', quantity: 20, availableQuantity: 18, unit: 'pieces', condition: 'Good', location: 'Sports Store', purchasePrice: 1500, supplier: 'Sports Ethiopia' },
    { itemCode: 'INV-011', name: 'Volleyball Sets', category: 'Sports', quantity: 3, availableQuantity: 3, unit: 'sets', condition: 'New', location: 'Sports Store', purchasePrice: 8000, supplier: 'Sports Ethiopia' },
    { itemCode: 'INV-012', name: 'Microscopes', category: 'Laboratory', quantity: 30, availableQuantity: 28, unit: 'pieces', condition: 'Good', location: 'Biology Lab', purchasePrice: 12000, supplier: 'Lab Supplies ETH' },
    { itemCode: 'INV-013', name: 'Chemistry Glassware Sets', category: 'Laboratory', quantity: 30, availableQuantity: 27, unit: 'sets', condition: 'Good', location: 'Chemistry Lab', purchasePrice: 5000, supplier: 'Lab Supplies ETH' },
    { itemCode: 'INV-014', name: 'Physics Lab Equipment', category: 'Laboratory', quantity: 20, availableQuantity: 18, unit: 'sets', condition: 'Good', location: 'Physics Lab', purchasePrice: 15000, supplier: 'Lab Supplies ETH' },
    { itemCode: 'INV-015', name: 'Library Books Shelf Units', category: 'Library', quantity: 20, availableQuantity: 20, unit: 'pieces', condition: 'New', location: 'Library', purchasePrice: 6000, supplier: 'Addis Furniture PLC' },
    { itemCode: 'INV-016', name: 'Office Chairs', category: 'Office', quantity: 15, availableQuantity: 14, unit: 'pieces', condition: 'Good', location: 'Admin Office', purchasePrice: 7000, supplier: 'Addis Furniture PLC' },
    { itemCode: 'INV-017', name: 'Filing Cabinets', category: 'Office', quantity: 10, availableQuantity: 10, unit: 'pieces', condition: 'New', location: 'Admin Office', purchasePrice: 12000, supplier: 'Addis Furniture PLC' },
    { itemCode: 'INV-018', name: 'First Aid Kits', category: 'Other', quantity: 10, availableQuantity: 9, unit: 'kits', condition: 'Good', location: 'Nurse Office', purchasePrice: 2500, supplier: 'Pharma Plus' },
    { itemCode: 'INV-019', name: 'Fire Extinguishers', category: 'Other', quantity: 15, availableQuantity: 15, unit: 'pieces', condition: 'New', location: 'Various Locations', purchasePrice: 3000, supplier: 'Safety First Ethiopia' },
    { itemCode: 'INV-020', name: 'CCTV Cameras', category: 'Electronics', quantity: 20, availableQuantity: 18, unit: 'pieces', condition: 'Good', location: 'Various Locations', purchasePrice: 8000, supplier: 'Ethio Tech Solutions' },
  ];
  await Inventory.insertMany(inventoryData);
  log(`Created ${inventoryData.length} inventory items`);

  // ═══════════════════════════════════════
  // 24. MESSAGES
  // ═══════════════════════════════════════
  const Message = mongoose.models.Message || mongoose.model('Message', S);
  const teacher1 = teacherUsers[0];
  const teacher2 = teacherUsers[1];
  const student1User = studentUsers[0];
  const parent1User = guardianUsers[0];
  const counselorUser = adminUsers.find((u: any) => u.userId === 'KCO001');
  const directorUser = adminUsers.find((u: any) => u.userId === 'DIR001');
  const messagesData = [
    { sender: adminUser._id, recipients: [teacher1._id, teacher2._id], subject: 'Staff Meeting Agenda', body: 'Dear Teachers, Please review the attached agenda for our upcoming staff meeting on Friday. Topics include midterm exam preparation and curriculum review.', priority: 'High', isRead: true, readAt: new Date() },
    { sender: adminUser._id, recipients: [student1User._id], subject: 'Welcome Message', body: 'Welcome to the new academic year! We look forward to a productive semester. Please check the announcement board for important dates.', priority: 'Medium', isRead: false },
    { sender: teacher1._id, recipients: [adminUser._id], subject: 'Leave Request', body: 'Dear Admin, I would like to request a leave of absence on October 15th for personal reasons. My classes can be covered by Mr. Tadesse.', priority: 'Medium', isRead: true, readAt: new Date() },
    { sender: parent1User._id, recipients: [counselorUser._id], subject: 'Student Performance Concern', body: 'Dear Counselor, I am concerned about my child\'s recent academic performance. Could we schedule a meeting to discuss improvement strategies?', priority: 'High', isRead: false },
    { sender: directorUser._id, recipients: [teacher1._id, teacher2._id, ...teacherUsers.slice(2, 10).map((t: any) => t._id)], subject: 'Academic Calendar Update', body: 'Dear Staff, Please note that the final examination schedule has been updated. The new dates are available on the school portal.', priority: 'High', isRead: true, readAt: new Date() },
    { sender: teacher1._id, recipients: [student1User._id, studentUsers[1]._id, studentUsers[2]._id], subject: 'Assignment Reminder', body: 'Dear Students, This is a reminder that your Mathematics assignment is due this Friday. Please submit on time.', priority: 'Medium', isRead: false },
    { sender: counselorUser._id, recipients: [parent1User._id], subject: 'Conference Follow-up', body: 'Dear Parent, Thank you for attending the parent-teacher conference. Here is a summary of the improvement plan we discussed.', priority: 'Medium', isRead: false },
    { sender: adminUser._id, recipients: [...teacherUsers.slice(0, 5).map((t: any) => t._id)], subject: 'Exam Security Protocol', body: 'All teachers are reminded to follow the strict exam security protocol during the upcoming final examinations. Question papers must be collected after each session.', priority: 'Critical', isRead: false },
  ];
  await Message.insertMany(messagesData);
  log(`Created ${messagesData.length} messages`);

  // ═══════════════════════════════════════
  // 25. NOTIFICATIONS
  // ═══════════════════════════════════════
  const Notification = mongoose.models.Notification || mongoose.model('Notification', S);
  const notificationData = [
    { recipient: adminUser._id, createdBy: adminUser._id, type: 'System', title: 'System Backup Complete', message: 'Daily database backup completed successfully.', priority: 'Low', isRead: true, channels: ['In-App'] },
    { recipient: teacher1._id, createdBy: adminUser._id, type: 'Academic', title: 'New Assessment Added', message: 'A new Mathematics Quiz has been added for Grade 10 Section A.', priority: 'Medium', isRead: false, channels: ['In-App'] },
    { recipient: student1User._id, createdBy: teacher1._id, type: 'Academic', title: 'Grade Published', message: 'Your mid-term exam results for Mathematics have been published.', priority: 'High', isRead: false, channels: ['In-App', 'Email'] },
    { recipient: parent1User._id, createdBy: counselorUser._id, type: 'Attendance', title: 'Attendance Alert', message: 'Your child was marked absent on October 10th. Please contact the school if this is an error.', priority: 'High', isRead: false, channels: ['In-App', 'SMS'] },
    { recipient: student1User._id, createdBy: adminUser._id, type: 'Financial', title: 'Fee Payment Reminder', message: 'Your tuition fee payment is due on November 30th. Please ensure timely payment.', priority: 'Medium', isRead: false, channels: ['In-App'] },
    { recipient: teacher1._id, createdBy: directorUser._id, type: 'Announcement', title: 'Professional Development Workshop', message: 'A mandatory professional development workshop will be held on Saturday, October 20th.', priority: 'Medium', isRead: true, readAt: new Date(), channels: ['In-App', 'Email'] },
    { recipient: adminUser._id, createdBy: adminUser._id, type: 'System', title: 'User Registration Spike', message: '15 new student accounts were registered today. Please review.', priority: 'Low', isRead: true, channels: ['In-App'] },
    { recipient: studentUsers[1]._id, createdBy: teacher1._id, type: 'Disciplinary', title: 'Behavioral Warning', message: 'A behavioral report has been filed regarding your conduct in class. Please see your counselor.', priority: 'Critical', isRead: false, channels: ['In-App'] },
  ];
  await Notification.insertMany(notificationData);
  log(`Created ${notificationData.length} notifications`);

  // ═══════════════════════════════════════
  // 26. COUNSELING SESSIONS
  // ═══════════════════════════════════════
  const CounselingSession = mongoose.models.CounselingSession || mongoose.model('CounselingSession', S);
  const counselingData = [
    { student: studentDocs[0]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-09-15`), sessionType: 'Academic', confidentialNotes: 'Student adjusting well to new grade. Discussed study habits.', status: 'Completed', followUpRequired: false },
    { student: studentDocs[1]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-09-20`), sessionType: 'Behavioral', confidentialNotes: 'Reported bullying incident. Witness statements taken.', status: 'Completed', followUpRequired: true, followUpDate: new Date(`${baseYear}-10-01`) },
    { student: studentDocs[2]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-10-01`), sessionType: 'Personal', confidentialNotes: 'Student experiencing family difficulties affecting studies. Referred to school support.', status: 'Completed', followUpRequired: true, followUpDate: new Date(`${baseYear}-10-15`) },
    { student: studentDocs[3]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-10-10`), sessionType: 'Career', confidentialNotes: 'Student interested in engineering. Discussed course selection for Grade 11.', status: 'Completed', followUpRequired: false },
    { student: studentDocs[4]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-10-15`), sessionType: 'Academic', confidentialNotes: 'Student struggling with English. Recommended extra tutoring sessions.', status: 'Scheduled', followUpRequired: true, followUpDate: new Date(`${baseYear}-10-25`) },
    { student: studentDocs[5]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-11-01`), sessionType: 'Behavioral', confidentialNotes: 'Class disruption reported. Warning issued and parent notified.', status: 'Scheduled', followUpRequired: true, followUpDate: new Date(`${baseYear}-11-15`) },
    { student: studentDocs[10]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-11-05`), sessionType: 'Career', confidentialNotes: 'Group session about higher education options in Ethiopia.', status: 'Scheduled', followUpRequired: false },
    { student: studentDocs[20]._id, counselor: counselorUser._id, sessionDate: new Date(`${baseYear}-11-10`), sessionType: 'Academic', confidentialNotes: 'Excellent performance discussion. Encouraged to participate in science fair.', status: 'Completed', followUpRequired: false },
  ];
  await CounselingSession.insertMany(counselingData);
  log(`Created ${counselingData.length} counseling sessions`);

  // ═══════════════════════════════════════
  // 27. BEHAVIORAL REPORTS (Discipline)
  // ═══════════════════════════════════════
  const BehavioralReport = mongoose.models.BehavioralReport || mongoose.model('BehavioralReport', S);
  const behavioralData = [
    { student: studentDocs[1]._id, reportedBy: teacher1._id, incidentDate: new Date(`${baseYear}-09-18`), incidentType: 'Discipline', severity: 'Moderate', description: 'Student was involved in a verbal altercation with a classmate during lunch break.', actionTaken: 'Verbal warning and parent notification', parentNotified: true, notificationDate: new Date(`${baseYear}-09-18`) },
    { student: studentDocs[5]._id, reportedBy: teacher2._id, incidentDate: new Date(`${baseYear}-09-25`), incidentType: 'Discipline', severity: 'Minor', description: 'Student was late to class for the third time this week.', actionTaken: 'Detention assigned', parentNotified: false },
    { student: studentDocs[8]._id, reportedBy: teacher1._id, incidentDate: new Date(`${baseYear}-10-02`), incidentType: 'Achievement', severity: 'Minor', description: 'Student won first place in the inter-school mathematics competition.', actionTaken: 'Certificate awarded and announced in assembly', parentNotified: true, notificationDate: new Date(`${baseYear}-10-02`) },
    { student: studentDocs[12]._id, reportedBy: teacher2._id, incidentDate: new Date(`${baseYear}-10-05`), incidentType: 'Discipline', severity: 'Serious', description: 'Student was caught cheating during a quiz by copying from a textbook.', actionTaken: 'Quiz score zeroed and parent meeting scheduled', parentNotified: true, notificationDate: new Date(`${baseYear}-10-05`) },
    { student: studentDocs[15]._id, reportedBy: teacher1._id, incidentDate: new Date(`${baseYear}-10-08`), incidentType: 'Participation', severity: 'Minor', description: 'Student actively participated in class discussion and helped peers with their work.', actionTaken: 'Commended in class', parentNotified: false },
    { student: studentDocs[20]._id, reportedBy: teacher2._id, incidentDate: new Date(`${baseYear}-10-12`), incidentType: 'Achievement', severity: 'Minor', description: 'Student submitted an outstanding research project on environmental science.', actionTaken: 'Project displayed in science exhibition', parentNotified: true, notificationDate: new Date(`${baseYear}-10-12`) },
    { student: studentDocs[25]._id, reportedBy: teacher1._id, incidentDate: new Date(`${baseYear}-10-15`), incidentType: 'Discipline', severity: 'Critical', description: 'Student was involved in a physical fight with another student during PE class.', actionTaken: 'Suspension for 3 days and parent called immediately', parentNotified: true, notificationDate: new Date(`${baseYear}-10-15`) },
    { student: studentDocs[30]._id, reportedBy: teacher2._id, incidentDate: new Date(`${baseYear}-10-20`), incidentType: 'Discipline', severity: 'Minor', description: 'Student was using mobile phone during class time.', actionTaken: 'Phone confiscated and returned after class', parentNotified: false },
    { student: studentDocs[40]._id, reportedBy: teacher1._id, incidentDate: new Date(`${baseYear}-10-25`), incidentType: 'Participation', severity: 'Minor', description: 'Student organized a study group and helped 5 classmates prepare for exams.', actionTaken: 'Recognized as peer tutor', parentNotified: true, notificationDate: new Date(`${baseYear}-10-25`) },
    { student: studentDocs[50]._id, reportedBy: teacher2._id, incidentDate: new Date(`${baseYear}-11-01`), incidentType: 'Other', severity: 'Moderate', description: 'Student reported a safety hazard in the science lab. Equipment was repaired promptly.', actionTaken: 'Student commended for safety awareness', parentNotified: false },
  ];
  await BehavioralReport.insertMany(behavioralData);
  log(`Created ${behavioralData.length} behavioral reports`);

  // ═══════════════════════════════════════
  // 28. HEALTH RECORDS
  // ═══════════════════════════════════════
  const HealthRecord = mongoose.models.HealthRecord || mongoose.model('HealthRecord', S);
  const healthData = [];
  for (let i = 0; i < 40; i++) {
    const s = studentDocs[i];
    const health: any = {
      student: s._id,
      bloodType: pick(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
      allergies: i % 5 === 0 ? [pick(['Dust', 'Pollen', 'Peanuts', 'Penicillin'])] : [],
      chronicConditions: i % 8 === 0 ? [pick(['Asthma', 'Diabetes', 'Epilepsy'])] : [],
      medications: i % 8 === 0 ? [pick(['Inhaler', 'Insulin', 'Anticonvulsant'])] : [],
      immunizations: [
        { name: 'BCG', date: new Date(`${s.dateOfBirth ? new Date(s.dateOfBirth).getFullYear() : baseYear - 15}-01-15`), notes: 'Given at birth' },
        { name: 'Polio', date: new Date(`${s.dateOfBirth ? new Date(s.dateOfBirth).getFullYear() : baseYear - 15}-03-20`), notes: 'First dose' },
        { name: 'Measles', date: new Date(`${s.dateOfBirth ? new Date(s.dateOfBirth).getFullYear() : baseYear - 15}-09-10`), notes: 'Given at 9 months' },
      ],
      visits: i % 4 === 0 ? [
        { date: new Date(`${baseYear}-10-${String(rand(1, 28)).padStart(2, '0')}`), reason: 'Routine checkup', diagnosis: 'Healthy', treatment: 'None required', attendedBy: 'School Nurse' },
      ] : [],
      emergencyContact: {
        name: s.emergencyContact?.name || 'Parent Name',
        phone: s.emergencyContact?.phone || '+251911223344',
        relationship: s.emergencyContact?.relationship || 'Father',
      },
    };
    healthData.push(health);
  }
  await HealthRecord.insertMany(healthData);
  log(`Created ${healthData.length} health records`);

  // ═══════════════════════════════════════
  // 29. ATTENDANCE CORRECTIONS
  // ═══════════════════════════════════════
  const AttendanceCorrection = mongoose.models.AttendanceCorrection || mongoose.model('AttendanceCorrection', S);
  const existingAttendance = await Attendance.find().limit(20) as any[];
  const correctionData = [];
  for (let i = 0; i < Math.min(12, existingAttendance.length); i++) {
    const att = existingAttendance[i];
    if (att.status === 'Present') continue;
    const studentDoc = studentDocs.find((s: any) => s._id.toString() === att.student.toString());
    correctionData.push({
      attendance: att._id,
      student: att.student,
      section: att.section,
      date: att.date,
      originalStatus: att.status,
      requestedStatus: 'Present',
      reason: pick([
        'I was present but the teacher did not mark me',
        'I arrived late but was in school',
        'I had a medical appointment and was excused',
        'There was an error in marking',
        'I was in the school library during roll call',
      ]),
      requestedBy: att.student,
      status: i % 3 === 0 ? 'Approved' : i % 3 === 1 ? 'Rejected' : 'Pending',
      reviewedBy: i % 3 !== 2 ? adminUsers[0]._id : undefined,
    });
  }
  if (correctionData.length > 0) {
    await AttendanceCorrection.insertMany(correctionData);
  }
  log(`Created ${correctionData.length} attendance corrections`);

  // ═══════════════════════════════════════
  // 30. ALUMNI (Grade 12 graduates)
  // ═══════════════════════════════════════
  const Alumni = mongoose.models.Alumni || mongoose.model('Alumni', S);
  const alumniData = [];
  const grade12Students = studentDocs.filter((s: any) => s.grade === 12).slice(0, 15);
  for (const s of grade12Students) {
    alumniData.push({
      student: s._id,
      graduationYear: baseYear,
      stream: s.stream,
      finalGPA: parseFloat((rand(20, 40) / 10).toFixed(2)),
      rank: rand(1, 40),
      currentEmployment: {
        status: pick(['Employed', 'Self-Employed', 'Unemployed', 'Further Education', 'Unknown']),
        employer: pick(['Ethio Telecom', 'Commercial Bank of Ethiopia', 'Ministry of Education', 'WHO', 'UNICEF']),
        position: pick(['Junior Staff', 'Intern', 'Officer', 'N/A']),
      },
      higherEducation: {
        enrolled: rand(0, 1) === 1,
        institution: pick(['AAU', 'Jimma University', 'Bahir Dar University', 'Adama Science University', 'Hawassa University']),
        program: pick(['Computer Science', 'Engineering', 'Medicine', 'Business', 'Education']),
      },
      contactInfo: {
        email: s.email || `${s.studentId.toLowerCase()}@alumni.com`,
        phone: s.phoneNumber || `+2519${rand(10000000, 99999999)}`,
        address: `${pick(CITIES)}, Ethiopia`,
      },
      visibilityPreference: 'Public',
    });
  }
  await Alumni.insertMany(alumniData);
  log(`Created ${alumniData.length} alumni records`);

  // ═══════════════════════════════════════
  // 31. TRANSFER LOGS
  // ═══════════════════════════════════════
  const TransferLog = mongoose.models.TransferLog || mongoose.model('TransferLog', S);
  const transferData = [];
  for (let i = 0; i < 8; i++) {
    const s = studentDocs[rand(0, studentDocs.length - 1)];
    const fromSec = sections[rand(0, sections.length - 1)];
    const toSec = sections[rand(0, sections.length - 1)];
    transferData.push({
      student: s._id,
      fromSection: fromSec._id,
      toSection: toSec._id,
      fromGrade: fromSec.grade,
      toGrade: toSec.grade,
      reason: pick([
        'Academic performance adjustment',
        'Parent request for section change',
        'Stream change from Common to Natural Science',
        'Student request',
        'Administrative decision',
        'Transfer to another school',
      ]),
      transferredBy: adminUser._id,
      type: pick(['Section', 'School', 'Withdrawal']),
      schoolName: i === 6 ? 'Addis Ababa Academy' : undefined,
      transferredAt: new Date(`${baseYear}-${String(rand(9, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`),
    });
  }
  await TransferLog.insertMany(transferData);
  log(`Created ${transferData.length} transfer logs`);

  // ═══════════════════════════════════════
  // 32. SUBJECT RESOURCES
  // ═══════════════════════════════════════
  const SubjectResource = mongoose.models.SubjectResource || mongoose.model('SubjectResource', S);
  const resourceData = [];
  for (const sub of subjects) {
    resourceData.push(
      { subject: sub._id, name: `${sub.name} Textbook Grade 9-12`, type: 'Textbook', quantity: 200, status: 'Available', description: `Official ${sub.name} textbook for secondary school` },
      { subject: sub._id, name: `${sub.name} Lab Equipment`, type: 'Equipment', quantity: 30, status: 'Available', description: `Laboratory equipment for ${sub.name} practical sessions` },
    );
  }
  await SubjectResource.insertMany(resourceData);
  log(`Created ${resourceData.length} subject resources`);

  // ═══════════════════════════════════════
  // 33. SUBJECT MATERIALS
  // ═══════════════════════════════════════
  const SubjectMaterial = mongoose.models.SubjectMaterial || mongoose.model('SubjectMaterial', S);
  const materialData = [];
  for (const sub of subjects) {
    for (const sec of sections.filter(s => {
      const grades = sub.grades || [];
      if (!grades.includes(s.grade)) return false;
      const streams = sub.streams || [];
      if (streams.length > 0 && !streams.includes(s.stream)) return false;
      return true;
    }).slice(0, 3)) {
      const key = `${sec._id.toString()}_${sub._id.toString()}`;
      const teacher = subjectTeacherAssignment[key] || teacherDocs[0]._id;
      materialData.push(
        { subject: sub._id, section: sec._id, title: `${sub.name} Chapter 1 Notes`, type: 'Note', description: `Comprehensive notes for ${sub.name} Chapter 1`, uploadedBy: teacher },
        { subject: sub._id, section: sec._id, title: `${sub.name} Mid-term Review`, type: 'Assignment', description: `Review questions for ${sub.name} mid-term exam`, uploadedBy: teacher },
      );
    }
  }
  await SubjectMaterial.insertMany(materialData);
  log(`Created ${materialData.length} subject materials`);

  // ═══════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════
  log('\n========================================');
  log('  SEED COMPLETED SUCCESSFULLY!');
  log('========================================\n');
  log(`Data Summary:`);
  log(`  Admin/Staff Users:     ${adminUsers.length}`);
  log(`  Teacher Users:         ${teacherUsers.length}`);
  log(`  Student Users:         ${studentUsers.length}`);
  log(`  Parent Users:          ${guardianUsers.length}`);
  log(`  Teacher Records:       ${teacherDocs.length}`);
  log(`  Student Records:       ${studentDocs.length}`);
  log(`  Guardians:             ${guardianDocs.length}`);
  log(`  Sections:              ${sections.length}`);
  log(`  Subjects:              ${subjects.length}`);
  log(`  Classrooms:            ${classroomsData.length}`);
  log(`  Teacher Assignments:   ${teacherAssignments.length}`);
  log(`  Subject Assignments:   ${subjectAssignmentsData.length}`);
  log(`  Schedule Slots:        ${scheduleData.length}`);
  log(`  Timetables:            ${timetableData.length}`);
  log(`  Assessments:           ${assessmentDocs.length}`);
  log(`  Assessment Marks:      ${assessmentMarkDocs.length}`);
  log(`  Semester Results:      ${semesterResultsData.length}`);
  log(`  Annual Results:        ${annualResultsData.length}`);
  log(`  Attendance Records:    ${attendanceData.length}`);
  log(`  Rankings:              ${rankingsData.length}`);
  log(`  Fee Structures:        ${feeData.length}`);
  log(`  Payments:              ${paymentsData.length}`);
  log(`  Books:                 ${booksData.length}`);
  log(`  Borrowings:            ${borrowingsData.length}`);
  log(`  Announcements:         ${announcementsData.length}`);
  log(`  Events:                ${eventsData.length}`);
  log(`  Grade Scale:           1`);
  log(`  Academic Terms:        ${academicTermsData.length}`);
  log(`  Transport:             ${transportData.length}`);
  log(`  Inventory:             ${inventoryData.length}`);
  log(`  Messages:              ${messagesData.length}`);
  log(`  Notifications:         ${notificationData.length}`);
  log(`  Counseling Sessions:   ${counselingData.length}`);
  log(`  Behavioral Reports:    ${behavioralData.length}`);
  log(`  Health Records:        ${healthData.length}`);
  log(`  Attendance Corrections: ${correctionData.length}`);
  log(`  Alumni:                ${alumniData.length}`);
  log(`  Transfer Logs:         ${transferData.length}`);
  log(`  Subject Resources:     ${resourceData.length}`);
  log(`  Subject Materials:     ${materialData.length}`);
  log('');
  log('Demo Accounts:');
  log('  Admin:     admin@school.edu.et     / Admin123!');
  log('  Director:  director@school.edu.et  / Admin123!');
  log('  Teacher:   teacher1@school.edu.et  / Teacher123!');
  log('  Student:   student1@school.edu.et  / Student123!');
  log('  Parent:    parent1@school.edu.et   / Parent123!');
  log('  Registrar: registrar@school.edu.et / Admin123!');
  log('  Finance:   finance@school.edu.et   / Admin123!');
  log('');
}

// Standalone runner — only when executed directly as the seed script
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await runFullSeed(console.log);
    await mongoose.disconnect();
    process.exit(0);
  }
  main().catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  });
}
