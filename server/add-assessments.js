/**
 * Comprehensive Assessment Creator for ESSMS
 * Creates assessments + marks for ALL students, ALL subjects, ALL sections
 * Run: node add-assessments.js
 */
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/essms_dev';

const ASSESSMENT_TYPES = ['Assignment', 'Quiz', 'Class Work', 'Project', 'Mid Exam', 'Final Exam'];
const TERMS = ['1', '2'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function calcGrade(pct) {
  if (pct >= 90) return { letter: 'A+', gradePoint: 4.0 };
  if (pct >= 85) return { letter: 'A', gradePoint: 4.0 };
  if (pct >= 80) return { letter: 'A-', gradePoint: 3.75 };
  if (pct >= 75) return { letter: 'B+', gradePoint: 3.5 };
  if (pct >= 70) return { letter: 'B', gradePoint: 3.0 };
  if (pct >= 65) return { letter: 'B-', gradePoint: 2.75 };
  if (pct >= 60) return { letter: 'C+', gradePoint: 2.5 };
  if (pct >= 50) return { letter: 'C', gradePoint: 2.0 };
  if (pct >= 45) return { letter: 'D', gradePoint: 1.0 };
  return { letter: 'F', gradePoint: 0 };
}

function getResultStatus(avg) {
  if (avg >= 90) return 'Excellent';
  if (avg >= 80) return 'Very Good';
  if (avg >= 70) return 'Good';
  if (avg >= 50) return 'Pass';
  return 'Fail';
}

function getLetterGrade(mark) {
  if (mark >= 90) return 'A+';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B+';
  if (mark >= 60) return 'B';
  if (mark >= 50) return 'C';
  return 'F';
}

function getMaxMarks(type) {
  const map = {
    'Assignment': 20, 'Quiz': 15, 'Class Work': 10,
    'Project': 25, 'Mid Exam': 50, 'Final Exam': 80,
  };
  return map[type] || 20;
}

function getWeight(type) {
  const map = {
    'Assignment': 10, 'Quiz': 10, 'Class Work': 10,
    'Project': 10, 'Mid Exam': 25, 'Final Exam': 35,
  };
  return map[type] || 10;
}

function getSubjectsForSection(section, allSubjects) {
  return allSubjects.filter(s => {
    const grades = s.grades || [];
    if (!grades.includes(section.grade)) return false;
    const streams = s.streams || [];
    if (streams.length > 0 && !streams.includes(section.stream)) return false;
    return true;
  });
}

async function addAssessments() {
  console.log('=== ESSMS Comprehensive Assessment Creator ===\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;

  const [sections, subjects, students, teachers, users] = await Promise.all([
    db.collection('sections').find({}).toArray(),
    db.collection('subjects').find({}).toArray(),
    db.collection('students').find({ status: 'Active' }).toArray(),
    db.collection('teachers').find({}).toArray(),
    db.collection('users').find({}).toArray(),
  ]);

  console.log(`Found: ${sections.length} sections, ${subjects.length} subjects, ${students.length} students, ${teachers.length} teachers`);

  if (sections.length === 0 || subjects.length === 0 || students.length === 0) {
    console.log('ERROR: Run the server seed first to create base data!');
    process.exit(1);
  }

  const adminUser = users.find(u => u.role === 'system_admin') || users[0];
  const now = new Date();
  const currentMonth = now.getMonth();
  const baseYear = currentMonth >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const currentAY = `${baseYear}/${baseYear + 1}`;

  // Build teacher-subject-section assignment map
  const assignments = await db.collection('teacherassignments').find({ academicYear: currentAY }).toArray();
  const assignMap = {};
  for (const a of assignments) {
    const key = `${a.section.toString()}_${a.subject.toString()}`;
    assignMap[key] = a.teacher;
  }

  // Clear old assessments + marks for this academic year
  const oldAssessments = await db.collection('assessments').find({ academicYear: currentAY }).toArray();
  const oldIds = oldAssessments.map(a => a._id);
  if (oldIds.length > 0) {
    await db.collection('assessmentmarks').deleteMany({ assessment: { $in: oldIds } });
    await db.collection('assessments').deleteMany({ _id: { $in: oldIds } });
    console.log(`Cleared ${oldIds.length} old assessments + their marks`);
  }
  await db.collection('semesterresults').deleteMany({ academicYear: currentAY });
  await db.collection('annualresults').deleteMany({ academicYear: currentAY });
  await db.collection('rankings').deleteMany({ academicYear: currentAY });
  console.log('Cleared old results + rankings\n');

  // ══════════════════════════════════════════════════════════════
  // STEP 1: Create Assessments for Every Section × Subject × Type × Term
  // ══════════════════════════════════════════════════════════════
  const assessments = [];
  let assessCounter = 0;

  for (const section of sections) {
    const secSubjects = getSubjectsForSection(section, subjects);
    if (secSubjects.length === 0) continue;

    for (const subject of secSubjects) {
      const key = `${section._id.toString()}_${subject._id.toString()}`;
      const teacherId = assignMap[key] || teachers[0]._id;

      for (const term of TERMS) {
        for (const type of ASSESSMENT_TYPES) {
          assessCounter++;
          const totalMarks = getMaxMarks(type);
          const monthOffset = term === '1' ? rand(1, 3) : rand(4, 6);
          const month = baseYear + (term === '1' ? 9 : 2) + monthOffset % 3;
          const day = rand(5, 25);

          assessments.push({
            assessmentId: `ASS${baseYear}${String(assessCounter).padStart(5, '0')}`,
            subject: subject._id,
            section: section._id,
            teacher: teacherId,
            type,
            title: `${subject.name} ${type} - Sem ${term}`,
            description: `${type} for ${subject.name} - ${section.name} Grade ${section.grade}`,
            totalMarks,
            date: new Date(`${term === '1' ? baseYear : baseYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`),
            academicYear: currentAY,
            term,
            status: 'Published',
            publishedBy: adminUser._id,
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  console.log(`Creating ${assessments.length} assessments...`);
  const assessmentDocs = [];
  for (let i = 0; i < assessments.length; i += 500) {
    const chunk = assessments.slice(i, i + 500);
    const docs = await db.collection('assessments').insertMany(chunk);
    assessmentDocs.push(...Object.values(docs.insertedIds));
  }
  console.log(`Created ${assessmentDocs.length} assessments`);

  // Re-fetch assessments to get _ids
  const allAssessments = await db.collection('assessments').find({ academicYear: currentAY }).toArray();
  console.log(`Working with ${allAssessments.length} assessments\n`);

  // ══════════════════════════════════════════════════════════════
  // STEP 2: Create Marks for Every Assessment × Every Student
  // ══════════════════════════════════════════════════════════════
  const marks = [];
  const studentMap = {};
  for (const s of students) {
    const secId = s.section ? s.section.toString() : 'none';
    if (!studentMap[secId]) studentMap[secId] = [];
    studentMap[secId].push(s);
  }

  let markCounter = 0;
  for (const assessment of allAssessments) {
    const secId = assessment.section.toString();
    const secStudents = studentMap[secId] || [];
    const totalMarks = assessment.totalMarks || 20;

    for (const student of secStudents) {
      markCounter++;
      const base = rand(25, 88);
      const variation = rand(-12, 12);
      const marksObtained = Math.max(0, Math.min(totalMarks, Math.round((base + variation) * totalMarks / 100)));
      const percentage = Math.round((marksObtained / totalMarks) * 10000) / 100;
      const grade = calcGrade(percentage);

      marks.push({
        assessment: assessment._id,
        student: student._id,
        marksObtained,
        percentage,
        letterGrade: grade.letter,
        gradePoint: grade.gradePoint,
        enteredBy: adminUser._id,
        enteredAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`Creating ${marks.length} marks...`);
  for (let i = 0; i < marks.length; i += 2000) {
    await db.collection('assessmentmarks').insertMany(marks.slice(i, i + 2000));
  }
  console.log(`Created ${marks.length} marks\n`);

  // ══════════════════════════════════════════════════════════════
  // STEP 3: Calculate Semester Results
  // ══════════════════════════════════════════════════════════════
  const semesterResults = [];
  for (const section of sections) {
    const secStudents = studentMap[section._id.toString()] || [];
    const secSubjects = getSubjectsForSection(section, subjects);

    for (const student of secStudents) {
      for (const term of TERMS) {
        for (const subject of secSubjects) {
          const subAssessments = allAssessments.filter(a =>
            a.section.toString() === section._id.toString() &&
            a.subject.toString() === subject._id.toString() &&
            a.term === term
          );

          if (subAssessments.length === 0) continue;

          let weightedSum = 0;
          let totalWeight = 0;
          for (const a of subAssessments) {
            const studentMarks = marks.filter(m =>
              m.student.toString() === student._id.toString() &&
              m.assessment.toString() === a._id.toString()
            );
            if (studentMarks.length > 0) {
              const w = getWeight(a.type);
              weightedSum += studentMarks[0].percentage * w;
              totalWeight += w;
            }
          }

          const avg = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;

          semesterResults.push({
            student: student._id,
            semester: term,
            subject: subject._id,
            mark: avg,
            grade: getLetterGrade(avg),
            academicYear: currentAY,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
  }

  console.log(`Creating ${semesterResults.length} semester results...`);
  for (let i = 0; i < semesterResults.length; i += 2000) {
    await db.collection('semesterresults').insertMany(semesterResults.slice(i, i + 2000));
  }
  console.log(`Created ${semesterResults.length} semester results\n`);

  // ══════════════════════════════════════════════════════════════
  // STEP 4: Calculate Annual Results
  // ══════════════════════════════════════════════════════════════
  const annualResults = [];
  for (const section of sections) {
    const secStudents = studentMap[section._id.toString()] || [];
    const secSubjects = getSubjectsForSection(section, subjects);

    for (const student of secStudents) {
      const sem1Marks = semesterResults.filter(r =>
        r.student.toString() === student._id.toString() && r.semester === '1'
      );
      const sem2Marks = semesterResults.filter(r =>
        r.student.toString() === student._id.toString() && r.semester === '2'
      );

      const sem1Avg = sem1Marks.length > 0
        ? Math.round((sem1Marks.reduce((s, r) => s + r.mark, 0) / sem1Marks.length) * 100) / 100
        : 0;
      const sem2Avg = sem2Marks.length > 0
        ? Math.round((sem2Marks.reduce((s, r) => s + r.mark, 0) / sem2Marks.length) * 100) / 100
        : 0;
      const annualAvg = Math.round(((sem1Avg + sem2Avg) / 2) * 100) / 100;
      const attendance = rand(75, 100);

      annualResults.push({
        student: student._id,
        academicYear: currentAY,
        semester1Total: Math.round(sem1Marks.reduce((s, r) => s + r.mark, 0) * 100) / 100,
        semester1Average: sem1Avg,
        semester1Result: getResultStatus(sem1Avg),
        semester2Total: Math.round(sem2Marks.reduce((s, r) => s + r.mark, 0) * 100) / 100,
        semester2Average: sem2Avg,
        semester2Result: getResultStatus(sem2Avg),
        annualAverage: annualAvg,
        finalResult: getResultStatus(annualAvg),
        promotionStatus: annualAvg >= 50 ? 'Promoted' : 'Repeat',
        attendance,
        conduct: pick(['Excellent', 'Very Good', 'Good', 'Satisfactory']),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await db.collection('annualresults').insertMany(annualResults);
  console.log(`Created ${annualResults.length} annual results\n`);

  // ══════════════════════════════════════════════════════════════
  // STEP 5: Calculate Rankings
  // ══════════════════════════════════════════════════════════════
  const rankings = [];
  for (const term of TERMS) {
    for (const section of sections) {
      const secStudents = studentMap[section._id.toString()] || [];
      const secAverages = [];

      for (const student of secStudents) {
        const termResults = semesterResults.filter(r =>
          r.student.toString() === student._id.toString() && r.semester === term
        );
        const avg = termResults.length > 0
          ? Math.round((termResults.reduce((s, r) => s + r.mark, 0) / termResults.length) * 100) / 100
          : 0;
        secAverages.push({ student, avg });
      }

      secAverages.sort((a, b) => b.avg - a.avg);
      const total = secAverages.length;

      for (let rank = 0; rank < secAverages.length; rank++) {
        const { student, avg } = secAverages[rank];
        rankings.push({
          student: student._id,
          academicYear: currentAY,
          term,
          overallAverage: avg,
          gpa: avg >= 90 ? 4.0 : avg >= 80 ? 3.5 : avg >= 70 ? 3.0 : avg >= 60 ? 2.5 : avg >= 50 ? 2.0 : avg >= 40 ? 1.0 : 0,
          sectionRank: rank + 1,
          gradeRank: 0,
          schoolRank: 0,
          totalStudentsInSection: total,
          subjectAverages: [],
          calculatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  for (let i = 0; i < rankings.length; i += 2000) {
    await db.collection('rankings').insertMany(rankings.slice(i, i + 2000));
  }
  console.log(`Created ${rankings.length} rankings`);

  // ══════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════');
  console.log('  ASSESSMENT CREATION COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`  Academic Year:     ${currentAY}`);
  console.log(`  Sections:          ${sections.length}`);
  console.log(`  Subjects:          ${subjects.length}`);
  console.log(`  Students:          ${students.length}`);
  console.log(`  Assessments:       ${assessments.length}`);
  console.log(`  Assessment Marks:  ${marks.length}`);
  console.log(`  Semester Results:  ${semesterResults.length}`);
  console.log(`  Annual Results:    ${annualResults.length}`);
  console.log(`  Rankings:          ${rankings.length}`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Done!');
}

addAssessments().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
