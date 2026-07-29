# Database Models Documentation

This directory contains all Mongoose models for the Ethiopian Secondary School Management System (ESSMS).

## Models Overview

### Core User & Identity Models
1. **User** - System users with authentication credentials
2. **Student** - Student records with academic information
3. **Teacher** - Teacher profiles and qualifications
4. **Guardian** - Parent/guardian information

### Academic Structure Models
5. **Section** - Class sections (e.g., 9-A, 11 NS-B)
6. **Subject** - Curriculum subjects
7. **TeacherAssignment** - Teacher-section-subject assignments

### Assessment Models
8. **Assessment** - Examinations and assessments
9. **AssessmentMark** - Student marks with auto-calculated grades
10. **Ranking** - Student performance rankings
11. **Attendance** - Daily attendance records

### Financial Models
12. **FeeStructure** - Fee configuration by grade
13. **Payment** - Payment records with receipts

### Library Models
14. **Book** - Library book inventory
15. **Borrowing** - Book borrowing records with fines

### Communication Models
16. **Announcement** - School announcements
17. **Notification** - User notifications

### Security & Audit Models
18. **AuditLog** - Immutable activity logs
19. **CounselingSession** - Encrypted counseling records
20. **BehavioralReport** - Student behavioral incidents

### Additional Models
21. **Event** - School events and calendar
22. **Alumni** - Graduate tracking
23. **Classroom** - Physical classroom management
24. **Timetable** - Class schedules

## Key Features

### Automatic ID Generation
- User: `USR{timestamp}{random}`
- Student: `STD{year}{random}`
- Teacher: `TCH{year}{random}`
- Guardian: `GRD{year}{random}`
- Assessment: `ASS{year}{random}`
- Payment: `PAY{year}{random}`
- Receipt: `REC{year}{timestamp}{random}`
- Borrowing: `BRW{year}{random}`

### Automatic Calculations
- **AssessmentMark**: Auto-calculates percentage, letter grade, and GPA
- **Ranking**: Auto-determines merit category (Excellence ≥90%, Honor ≥85%)
- **FeeStructure**: Auto-sums component amounts
- **Borrowing**: Auto-calculates fines for overdue books

### Data Protection
- **AuditLog**: Immutable (cannot be modified or deleted)
- **Alumni**: Cannot be deleted
- **CounselingSession**: Encrypted confidential notes
- **User**: Password hash not returned by default

### Indexes
All models include appropriate indexes for:
- Unique fields (studentId, teacherId, email, etc.)
- Frequently queried fields (grade, section, date, status)
- Compound indexes for complex queries

## Usage Example

```typescript
import { Student, Teacher, Assessment } from './models';

// Create a student
const student = await Student.create({
  firstName: 'Abebe',
  lastName: 'Kebede',
  dateOfBirth: new Date('2008-05-15'),
  gender: 'Male',
  grade: 9,
  enrollmentDate: new Date(),
  userId: userObjectId,
});

// Student ID is auto-generated
console.log(student.studentId); // STD20240123

// Virtual properties
console.log(student.fullName); // Abebe Kebede
console.log(student.age); // 16
```

## Model Relationships

```
User
 ├─> Student
 ├─> Teacher
 └─> Guardian

Student
 ├─> Section
 ├─> Guardian (many)
 ├─> Assessment Marks
 ├─> Attendance
 ├─> Ranking
 └─> Payments

Teacher
 ├─> Subject (many)
 ├─> Section (through TeacherAssignment)
 └─> Assessment (created by)

Section
 ├─> Student (many)
 ├─> Teacher (homeroom)
 ├─> Classroom
 └─> Timetable

Assessment
 ├─> Subject
 ├─> Section
 ├─> Teacher
 └─> AssessmentMark (many)
```

## Validation Rules

### Student
- Grade: 9-12 only
- Status: Active, Transferred, Withdrawn, Graduated
- Requires at least one guardian

### Assessment
- Status workflow: Draft → Pending Verification → Verified → Approved → Published
- Teachers can only enter marks, not approve

### Attendance
- Status: Present, Absent, Late, Excused
- One record per student per day

### Borrowing
- Fine: 2 ETB per day overdue
- Status: Borrowed, Returned, Overdue

## Security Considerations

1. **Password fields**: Excluded from queries by default (`select: false`)
2. **MFA secrets**: Not returned in API responses
3. **Counseling notes**: Encrypted using AES
4. **Audit logs**: Immutable and cannot be deleted
5. **Role-based access**: Enforced at application level

## Performance Optimization

All models include:
- Strategic indexes on frequently queried fields
- Compound indexes for complex queries
- Virtual properties for computed values
- Pre-save hooks for automatic calculations

## Next Steps

After models are created:
1. Create services layer for business logic
2. Implement controllers for API endpoints
3. Add validation middleware
4. Write unit tests for models
5. Implement RBAC authorization
