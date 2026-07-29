# Ethiopian Secondary School Management System (ESSMS)

Enterprise-grade school management platform for Ethiopian secondary schools (Grades 9-12). Built with the MERN stack (MongoDB, Express.js, React, Node.js) + TypeScript.

---

## Quick Start

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment
cd ../server && copy .env.example .env    # Windows

# Start MongoDB (must be running first)
# Then start both server + client:
cd .. && npm run dev
```

> **Auto-seed**: First startup automatically creates demo accounts. No manual seed needed.

### Demo Credentials

| Role               | Email                        | Password       |
|--------------------|------------------------------|----------------|
| System Admin       | admin@school.edu.et          | Admin123!      |
| School Director    | director@school.edu.et       | Admin123!      |
| Academic Head      | academic@school.edu.et       | Admin123!      |
| Registrar          | registrar@school.edu.et      | Admin123!      |
| Finance Officer    | finance@school.edu.et        | Admin123!      |
| Counselor          | counselor@school.edu.et      | Admin123!      |
| Librarian          | librarian@school.edu.et      | Admin123!      |
| Teacher            | teacher@school.edu.et        | Teacher123!    |
| Homeroom Teacher   | teacher3@school.edu.et       | Teacher123!    |
| Student            | student@school.edu.et        | Student123!    |
| Parent             | parent@school.edu.et         | Parent123!     |

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [User Roles (11)](#user-roles)
- [All Modules & Features (25)](#all-modules--features)
- [Server Models (33)](#server-models)
- [Permission System (89)](#permission-system)
- [Server Routes](#server-routes)
- [API Client Endpoints](#api-client-endpoints)
- [Client Routes](#client-routes)
- [Sidebar Navigation](#sidebar-navigation)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Separation of Duties](#separation-of-duties)

---

## Architecture

```
sms/
├── server/                          # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── config/                  # DB config, permissions (89 categories)
│   │   ├── controllers/             # Route handlers (27 controllers)
│   │   ├── middleware/              # authenticate, authorize, requirePermission, rate-limit, error handler
│   │   ├── models/                  # Mongoose schemas (33 models)
│   │   ├── routes/                  # Express routers (27 route files)
│   │   ├── services/                # Business logic layer
│   │   ├── types/                   # TypeScript types & enums (UserRole, etc.)
│   │   ├── utils/                   # Helpers (password, JWT, logger)
│   │   ├── server.ts               # Entry point
│   │   └── seed.ts                  # Full database seeder
│   └── package.json
│
├── client/                          # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/              # Reusable UI (Layout, ProtectedRoute, etc.)
│   │   ├── contexts/                # AuthContext, NotificationContext
│   │   ├── pages/                   # 50+ page components
│   │   ├── services/                # API client (axios, 25+ API modules)
│   │   ├── App.tsx                  # Root with routing (50+ routes)
│   │   └── main.tsx                # Entry point
│   └── package.json
│
├── package.json                     # Root workspace scripts
└── README.md
```

---

## Tech Stack

### Backend
| Technology      | Purpose                          |
|-----------------|----------------------------------|
| Node.js 18+     | Runtime                          |
| Express.js      | Web framework                    |
| TypeScript      | Language                         |
| MongoDB + Mongoose | Database + ODM               |
| JWT             | Auth (access + refresh tokens)   |
| PBKDF2/SHA-512  | Password hashing                 |
| speakeasy       | TOTP MFA                         |
| Socket.io       | Real-time notifications          |
| Multer          | File uploads                     |
| PDFKit          | PDF generation (receipts, reports) |
| Nodemailer      | Email                            |

### Frontend
| Technology      | Purpose                          |
|-----------------|----------------------------------|
| React 18        | UI framework                     |
| TypeScript      | Language                         |
| Vite            | Build tool                       |
| Material UI (MUI) | Component library              |
| React Router v6 | Routing                          |
| Recharts        | Charts & analytics               |
| Axios           | HTTP client                      |
| React Context API | State management               |
| react-hook-form | Form management                  |
| date-fns        | Date utilities                   |

---

## User Roles

11 roles defined in `server/src/types/index.ts` (`UserRole` enum):

| Enum Value         | Display Label    | Key Description                                       |
|--------------------|------------------|-------------------------------------------------------|
| `system_admin`     | System Admin     | Full system access (excluding academic modification)  |
| `school_director`  | Director         | View-only grades + unlock assessments                 |
| `academic_head`    | Academic Head    | Verify, approve, publish grades                       |
| `registrar`        | Registrar        | Student enrollment (no grade modification)            |
| `finance_officer`  | Finance Officer  | Finance module only (no grades/counseling)            |
| `teacher`          | Teacher          | Enter marks (cannot publish), mark attendance         |
| `homeroom_teacher` | Homeroom Teacher | Teacher + section-wide responsibilities               |
| `counselor`        | Counselor        | Counseling & behavioral management                    |
| `librarian`        | Librarian        | Library management only                               |
| `student`          | Student          | Own data only (grades, attendance, documents)         |
| `parent`           | Parent           | Linked children's data (approved grades only)         |

---

## All Modules & Features (25)

### 1. Authentication & Security
- JWT access + refresh tokens
- TOTP multi-factor authentication (speakeasy)
- Session management with configurable timeout
- Account lockout: 5 failed attempts -> 30-min lockout
- Rate limiting per endpoint
- Immutable audit logging

### 2. User Management
- CRUD for system users
- Role assignment (11 roles)
- Avatar/photo upload
- Activate/deactivate users

### 3. Student Management
- Registration with auto-ID (`STD{year}{random}`)
- Profile with Ethiopian address (city, subcity, woreda)
- Status workflow: Active, Suspended, Transferred, Withdrawn, Graduated, Archived
- Bulk promote to next grade
- Advanced search with multi-field filtering
- Transfer, withdrawal, suspension, graduation
- History tracking for all status changes
- Guardian linking

### 4. Teacher Management
- Registration with qualifications, employment details
- Workload calculation + overload detection (>30 periods/week)
- Assignment to sections & subjects
- Leave management (request + approve)
- Performance tracking
- Attendance recording (check-in/check-out)
- Teacher Portal: My dashboard, timetable, sections, marks entry, reports

### 5. Guardian/Parent Portal
- Register guardians with user account creation
- Link/unlink to multiple students
- View children's grades, attendance, fee status
- Parent Dashboard with quick links

### 6. Academic Structure
- **Sections**: Name (e.g. "9-A", "11 NS-B"), capacity, stream, homeroom teacher
- **Subjects**: Curriculum by grade & stream
- Subject assignments linking subjects to sections
- Subject resources & materials (files, links)
- Subject schedules (period allocation)
- **Classrooms**: Room management (capacity, type, facilities)

### 7. Assessment & Grading
- 6 assessment types: Assignment, Quiz, Class Work, Project, Mid Exam, Final Exam
- Auto percentage, letter grade (A/B/C/D/F), GPA (0.0-4.0)
- Approval workflow: Draft -> Pending Verification -> Verified -> Approved -> Published
- **Separation of duties**: Teachers enter marks, Academic Heads verify/approve, Registrar publishes
- Report card generation
- At-risk student analytics
- Homeroom cross-subject marks view

### 8. Attendance
- Daily marking: Present, Absent, Late, Excused
- Section attendance sheets with date navigation
- Dashboard with school-wide stats
- Chronic absentee detection
- Correction workflow: Request -> Review/Approve
- Summary reports by section, grade, school

### 9. Rankings
- Merit categories: Academic Excellence (>=90%), Honor Student (>=85%)
- School-wide, grade-level, section, stream rankings
- Top performers per subject
- Auto-calculation on marks approval

### 10. Finance
- Fee structure management by grade (component breakdown)
- Payment recording with auto-receipt (`REC{year}{timestamp}{random}`)
- Student fee status tracking
- Collection & outstanding reports
- Receipt PDF generation

### 11. Library
- Book inventory (ISBN, category, quantity)
- Book search
- Borrowing with fine calculation (2 ETB/day overdue)
- Overdue reports
- Library statistics

### 12. Announcements
- Professional system with statuses: Draft, Scheduled, Published, Expired, Archived
- Categories: Academic, Administrative, Financial, Events, Emergency
- Priorities: Low, Normal, High, Urgent (color-coded)
- Targeting: Audience (All/Students/Teachers/Parents/Staff), Grades, Sections, Subjects
- Scheduling with publish date & expiry date
- Read tracking per user
- Role-based creation permissions

### 13. Notifications
- In-app notification system
- Types: Attendance Alert, Grade Published, Fee Reminder, Exam Scheduled, Announcement, Message
- Mark as read, mark all as read
- Unread count badge (polls every 30s)

### 14. Messaging
- Internal messaging between users
- Inbox/outbox with threading
- Unread count
- Read tracking

### 15. Timetable
- Schedule management by section
- Day/time slot allocation with subject & teacher
- Conflict detection
- Teacher & student timetable views

### 16. Dashboard
- **Admin**: Stats cards (students, teachers, attendance, fees), charts (enrollment trends, grade distribution), recent registrations, top performers, alerts
- **Teacher**: My stats, today's schedule, homeroom info, attendance check-in, announcements widget
- **Student**: Grades, attendance, ranking, quick actions, announcements widget

### 17. Counseling
- Encrypted session records (AES-256)
- Create, read, update sessions
- Confidential notes encryption

### 18. Discipline (Behavioral)
- Behavioral incident reporting
- Create and track behavioral reports
- Homeroom teacher access to section records

### 19. Health Records
- Student health records
- Clinic visit tracking
- Immunization records

### 20. Alumni
- Graduate tracking
- Alumni statistics
- Records are protected from deletion

### 21. Events & Calendar
- School events: Academic, Examination, Holiday, Meeting, Ceremony
- Calendar view with filters
- Event CRUD

### 22. Reports & Documents
- Report card generation
- Student transcript
- Attendance reports (summary, section, school-wide)
- Finance reports (collection, outstanding)
- Academic reports (performance, rankings, section performance)
- Audit log reports

### 23. Audit Logs
- Immutable activity logging (cannot be modified or deleted)
- All sensitive actions recorded
- Filterable by user, action type, date range
- Statistics dashboard

### 24. Assignment Management
- Teacher-section-subject assignments
- Batch teacher assignment
- Unassigned students tracking
- Section overview per grade
- Workload monitoring
- Homeroom teacher assignment

### 25. Settings
- School profile (name, address, phone, email, logo, website)
- Academic config (year, term, grading system)
- Feature toggles (MFA, attendance, library, counseling, etc.)
- Security settings (session timeout, max login attempts, lockout duration)
- Notification preferences
- Theme customization

---

## Server Models (33)

All models in `server/src/models/` are Mongoose schemas with auto-ID generation, auto-calculations, and data protection features.

| #  | File                          | Model Name           | Description                                                              |
|----|-------------------------------|----------------------|--------------------------------------------------------------------------|
| 1  | User.model.ts                 | User                 | System users with auth credentials; password hash excluded by default    |
| 2  | Student.model.ts              | Student              | Student records; auto-generates `STD{year}{random}` IDs                  |
| 3  | Teacher.model.ts              | Teacher              | Teacher profiles & qualifications; auto-generates `TCH{year}{random}` IDs |
| 4  | Guardian.model.ts             | Guardian             | Parent/guardian info; auto-generates `GRD{year}{random}` IDs             |
| 5  | Section.model.ts              | Section              | Class sections (e.g. 9-A, 11 NS-B)                                       |
| 6  | Subject.model.ts              | Subject              | Curriculum subjects taught at the school                                 |
| 7  | SubjectAssignment.model.ts    | SubjectAssignment    | Assignment of subjects to sections/grades                                |
| 8  | SubjectSchedule.model.ts      | SubjectSchedule      | Scheduling details for subjects (periods, days)                          |
| 9  | SubjectResource.model.ts      | SubjectResource      | Teaching resources linked to subjects                                    |
| 10 | SubjectMaterial.model.ts      | SubjectMaterial      | Educational materials (files, links) for subjects                        |
| 11 | TeacherAssignment.model.ts    | TeacherAssignment    | Teacher-section-subject assignments                                      |
| 12 | Assessment.model.ts           | Assessment           | Exams/assessments with status workflow (Draft -> Published)             |
| 13 | AssessmentMark.model.ts       | AssessmentMark       | Student marks; auto-calculates percentage, letter grade, GPA             |
| 14 | Attendance.model.ts           | Attendance           | Daily attendance (Present/Absent/Late/Excused); one per student per day  |
| 15 | AttendanceCorrection.model.ts | AttendanceCorrection | Requests for correcting attendance entries                               |
| 16 | Ranking.model.ts              | Ranking              | Performance rankings; auto-determined merit (Excellence >= 90%, Honor >= 85%) |
| 17 | FeeStructure.model.ts         | FeeStructure         | Fee configuration by grade; auto-sums component amounts                  |
| 18 | Payment.model.ts              | Payment              | Payment records; auto-generates `PAY{year}` and `REC{year}{timestamp}`  |
| 19 | Book.model.ts                 | Book                 | Library book inventory                                                   |
| 20 | Borrowing.model.ts            | Borrowing            | Book borrowing; auto-calculates fines (2 ETB/day overdue)               |
| 21 | Announcement.model.ts         | Announcement         | School announcements (Draft, Scheduled, Published, Expired, Archived)   |
| 22 | Notification.model.ts         | Notification         | User notifications (attendance alerts, grade published, fee reminders)  |
| 23 | Message.model.ts              | Message              | Internal messaging between users                                         |
| 24 | AuditLog.model.ts             | AuditLog             | Immutable activity logs (cannot be modified or deleted)                  |
| 25 | CounselingSession.model.ts    | CounselingSession    | Encrypted counseling records (AES-256 confidential notes)               |
| 26 | BehavioralReport.model.ts     | BehavioralReport     | Student behavioral incidents and reports                                 |
| 27 | Event.model.ts                | Event                | School events and calendar entries                                       |
| 28 | Alumni.model.ts               | Alumni               | Graduate tracking; records protected from deletion                       |
| 29 | Classroom.model.ts            | Classroom            | Physical classroom management (room details, capacity)                   |
| 30 | Timetable.model.ts            | Timetable            | Class schedules/timetables for sections                                  |
| 31 | HealthRecord.model.ts         | HealthRecord         | Student health records, visits, and immunizations                        |
| 32 | Settings.model.ts             | Settings             | System-wide configuration (key-value pairs)                              |

---

## Permission System (89)

Defined in `server/src/config/permissions.ts` as the `PermissionCategory` enum with string values in `namespace:action` format.

### Student Management (7)
| Permission              | String                |
|-------------------------|-----------------------|
| `STUDENT_READ`          | `student:read`        |
| `STUDENT_CREATE`        | `student:create`      |
| `STUDENT_UPDATE`        | `student:update`      |
| `STUDENT_DELETE`        | `student:delete`      |
| `STUDENT_TRANSFER`      | `student:transfer`    |
| `STUDENT_PROMOTE`       | `student:promote`     |
| `STUDENT_GRADUATE`      | `student:graduate`    |

### Teacher Management (7)
| Permission              | String                |
|-------------------------|-----------------------|
| `TEACHER_READ`          | `teacher:read`        |
| `TEACHER_CREATE`        | `teacher:create`      |
| `TEACHER_UPDATE`        | `teacher:update`      |
| `TEACHER_ASSIGN`        | `teacher:assign`      |
| `TEACHER_WORKLOAD`      | `teacher:workload`    |
| `TEACHER_LEAVE`         | `teacher:leave`       |
| `TEACHER_DELETE`        | `teacher:delete`      |

### Guardian Management (3)
| Permission              | String                |
|-------------------------|-----------------------|
| `GUARDIAN_READ`         | `guardian:read`       |
| `GUARDIAN_CREATE`       | `guardian:create`     |
| `GUARDIAN_UPDATE`       | `guardian:update`     |

### Assessment Management (8)
| Permission                | String                    |
|---------------------------|---------------------------|
| `ASSESSMENT_CREATE`       | `assessment:create`       |
| `ASSESSMENT_READ`         | `assessment:read`         |
| `ASSESSMENT_UPDATE`       | `assessment:update`       |
| `ASSESSMENT_ENTER_MARKS`  | `assessment:enter_marks`  |
| `ASSESSMENT_VERIFY`       | `assessment:verify`       |
| `ASSESSMENT_APPROVE`      | `assessment:approve`      |
| `ASSESSMENT_PUBLISH`      | `assessment:publish`      |
| `ASSESSMENT_UNLOCK`       | `assessment:unlock`       |

### Grade Management (4)
| Permission              | String                |
|-------------------------|-----------------------|
| `GRADE_READ_OWN`        | `grade:read_own`      |
| `GRADE_READ_ALL`        | `grade:read_all`      |
| `GRADE_READ_SECTION`    | `grade:read_section`  |
| `GRADE_CALCULATE`       | `grade:calculate`     |

### Attendance Management (8)
| Permission                       | String                           |
|----------------------------------|----------------------------------|
| `ATTENDANCE_MARK`                | `attendance:mark`                |
| `ATTENDANCE_READ_OWN`            | `attendance:read_own`            |
| `ATTENDANCE_READ_SECTION`        | `attendance:read_section`        |
| `ATTENDANCE_READ_ALL`            | `attendance:read_all`            |
| `ATTENDANCE_REPORT`              | `attendance:report`              |
| `ATTENDANCE_DELETE`              | `attendance:delete`              |
| `ATTENDANCE_CORRECTION_REQUEST`  | `attendance:correction_request`  |
| `ATTENDANCE_CORRECTION_REVIEW`   | `attendance:correction_review`   |

### Finance Management (6)
| Permission                | String                    |
|---------------------------|---------------------------|
| `FINANCE_READ`            | `finance:read`            |
| `FINANCE_CREATE_FEE`      | `finance:create_fee`      |
| `FINANCE_UPDATE_FEE`      | `finance:update_fee`      |
| `FINANCE_RECORD_PAYMENT`  | `finance:record_payment`  |
| `FINANCE_GENERATE_RECEIPT`| `finance:generate_receipt`|
| `FINANCE_REPORT`          | `finance:report`          |

### Library Management (6)
| Permission                | String                    |
|---------------------------|---------------------------|
| `LIBRARY_READ`            | `library:read`            |
| `LIBRARY_MANAGE_BOOKS`    | `library:manage_books`    |
| `LIBRARY_BORROW`          | `library:borrow`          |
| `LIBRARY_RETURN`          | `library:return`          |
| `LIBRARY_FINE`            | `library:fine`            |
| `LIBRARY_REPORT`          | `library:report`          |

### Communication (5)
| Permission                | String                    |
|---------------------------|---------------------------|
| `ANNOUNCEMENT_CREATE`     | `announcement:create`     |
| `ANNOUNCEMENT_READ`       | `announcement:read`       |
| `NOTIFICATION_SEND`       | `notification:send`       |
| `MESSAGE_SEND`            | `message:send`            |
| `MESSAGE_READ`            | `message:read`            |

### Counseling & Behavioral (6)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `COUNSELING_CREATE`           | `counseling:create`           |
| `COUNSELING_READ_OWN`         | `counseling:read_own`         |
| `COUNSELING_READ_ALL`         | `counseling:read_all`         |
| `COUNSELING_UPDATE`           | `counseling:update`           |
| `BEHAVIORAL_REPORT_CREATE`    | `behavioral:create`           |
| `BEHAVIORAL_REPORT_READ`      | `behavioral:read`             |

### Academic Structure (10)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `SECTION_CREATE`              | `section:create`              |
| `SECTION_UPDATE`              | `section:update`              |
| `SECTION_READ`                | `section:read`                |
| `CURRICULUM_MANAGE`           | `curriculum:manage`           |
| `SUBJECT_ASSIGN`              | `subject:assign`              |
| `SUBJECT_RESOURCE_MANAGE`     | `subject:resource_manage`     |
| `SUBJECT_MATERIAL_MANAGE`     | `subject:material_manage`     |
| `SUBJECT_MATERIAL_VIEW`       | `subject:material_view`       |
| `TIMETABLE_CREATE`            | `timetable:create`            |
| `TIMETABLE_READ`              | `timetable:read`              |

### Documents (4)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `DOCUMENT_TRANSCRIPT`         | `document:transcript`         |
| `DOCUMENT_CERTIFICATE`        | `document:certificate`        |
| `DOCUMENT_REPORT_CARD`        | `document:report_card`        |
| `DOCUMENT_READ_OWN`           | `document:read_own`           |

### Reports & Analytics (6)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `REPORT_ACADEMIC`             | `report:academic`             |
| `REPORT_FINANCIAL`            | `report:financial`            |
| `REPORT_ATTENDANCE`           | `report:attendance`           |
| `REPORT_MINISTRY`             | `report:ministry`             |
| `ANALYTICS_VIEW`              | `analytics:view`              |
| `DASHBOARD_MIS`               | `dashboard:mis`               |

### Audit & Security (5)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `AUDIT_READ`                  | `audit:read`                  |
| `AUDIT_REPORT`                | `audit:report`                |
| `USER_CREATE`                 | `user:create`                 |
| `USER_UPDATE`                 | `user:update`                 |
| `USER_ROLE_CHANGE`            | `user:role_change`            |
| `USER_DELETE`                 | `user:delete`                 |

### System Administration (3)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `SYSTEM_CONFIG`               | `system:config`               |
| `SYSTEM_BACKUP`               | `system:backup`               |
| `SYSTEM_MAINTENANCE`          | `system:maintenance`          |

### Alumni Management (3)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `ALUMNI_READ`                 | `alumni:read`                 |
| `ALUMNI_UPDATE`               | `alumni:update`               |
| `ALUMNI_REPORT`               | `alumni:report`               |

### Event Management (3)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `EVENT_CREATE`                | `event:create`                |
| `EVENT_READ`                  | `event:read`                  |
| `EVENT_UPDATE`                | `event:update`                |

### Resource Management (3)
| Permission                    | String                        |
|-------------------------------|-------------------------------|
| `RESOURCE_MANAGE`             | `resource:manage`             |
| `RESOURCE_READ`               | `resource:read`               |
| `RESOURCE_ALLOCATE`           | `resource:allocate`           |

### Helper Functions
| Function                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `hasPermission(role, perm)` | Check if a role has a specific permission      |
| `hasAnyPermission(role, perms[])` | Check if a role has any of given permissions |
| `hasAllPermissions(role, perms[])` | Check if a role has all given permissions  |
| `getRolePermissions(role)` | Get all permissions for a role                  |

---

## Server Routes

All endpoints are under the base path `http://localhost:5002/api/v1`.

### Middleware Used
| Middleware           | Description                                                |
|----------------------|------------------------------------------------------------|
| `authenticate`       | JWT token verification                                     |
| `authorize(roles)`   | Role-based access (specific roles allowed)                 |
| `requirePermission(perm)` | Permission-based access (checks permission map)       |
| `authLimiter`        | Rate limiting for login endpoint                           |

### Route Mount Points (routes/index.ts)

| Mount Point        | Route File              | Module                  |
|--------------------|-------------------------|-------------------------|
| `/auth`            | auth.routes.ts          | Authentication          |
| `/users`           | user.routes.ts          | User Management         |
| `/dashboard`       | dashboard.routes.ts     | Dashboard               |
| `/students`        | student.routes.ts       | Student Management      |
| `/guardians`       | guardian.routes.ts      | Guardian Management     |
| `/sections`        | section.routes.ts       | Section Management      |
| `/teachers`        | teacher.routes.ts       | Teacher Management      |
| `/assessments`     | assessment.routes.ts    | Assessment/Grades       |
| `/attendance`      | attendance.routes.ts    | Attendance              |
| `/rankings`        | ranking.routes.ts       | Rankings                |
| `/finance`         | finance.routes.ts       | Finance                 |
| `/library`         | library.routes.ts       | Library                 |
| `/communications`  | communication.routes.ts | Communications          |
| `/messages`        | message.routes.ts       | Messaging               |
| `/timetables`      | timetable.routes.ts     | Timetables              |
| `/subjects`        | subject.routes.ts       | Subjects                |
| `/classrooms`      | classroom.routes.ts     | Classrooms              |
| `/counseling`      | counseling.routes.ts    | Counseling              |
| `/behavioral`      | behavioral.routes.ts    | Behavioral Reports      |
| `/health-check`    | health.routes.ts        | Health Records          |
| `/settings`        | settings.routes.ts      | Settings                |
| `/events`          | event.routes.ts         | Events                  |
| `/alumni`          | alumni.routes.ts        | Alumni                  |
| `/audit-logs`      | audit.routes.ts         | Audit Logs              |
| `/assignments`     | assignment.routes.ts    | Assignments             |
| `/announcements`   | announcement.routes.ts  | Announcements           |
| `GET /health`      | (inline)                | Health Check (public)   |

### Detailed Endpoints

#### Auth (`/auth`)
| Method | Path                | Middleware      | Description                    |
|--------|---------------------|-----------------|--------------------------------|
| POST   | `/auth/login`       | `authLimiter`   | Login with email/username+pwd  |
| POST   | `/auth/logout`      | `authenticate`  | Logout                         |
| POST   | `/auth/refresh`     | --              | Refresh access token           |
| GET    | `/auth/profile`     | `authenticate`  | Get current user profile       |
| POST   | `/auth/change-password` | `authenticate` | Change password             |
| POST   | `/auth/mfa/setup`   | `authenticate`  | Setup TOTP MFA (generate secret)|
| POST   | `/auth/mfa/verify-and-enable` | `authenticate` | Verify & enable MFA    |
| POST   | `/auth/mfa/verify`  | --              | Verify MFA during login        |
| POST   | `/auth/mfa/disable` | `authenticate`  | Disable MFA                    |

#### Users (`/users`) -- all require `authenticate`
| Method | Path                  | Middleware                        | Description         |
|--------|-----------------------|-----------------------------------|---------------------|
| GET    | `/users/me`           | --                                | Current user        |
| GET    | `/users`              | `requirePermission(USER_CREATE)`  | List users          |
| POST   | `/users`              | `authorize(SYSTEM_ADMIN)` + `requirePermission(USER_CREATE)` | Create user |
| GET    | `/users/:id`          | `requirePermission(USER_CREATE)`  | Get user            |
| PUT    | `/users/:id`          | `requirePermission(USER_UPDATE)`  | Update user         |
| PUT    | `/users/:id/role`     | `authorize(SYSTEM_ADMIN)` + `requirePermission(USER_ROLE_CHANGE)` | Change role |
| PUT    | `/users/:id/status`   | `authorize(SYSTEM_ADMIN)` + `requirePermission(USER_UPDATE)` | Activate/deactivate |

#### Students (`/students`) -- all require `authenticate`
| Method | Path                              | Middleware                                   | Description               |
|--------|-----------------------------------|----------------------------------------------|---------------------------|
| POST   | `/students`                       | `requirePermission(STUDENT_CREATE)` + upload | Register student          |
| GET    | `/students`                       | `requirePermission(STUDENT_READ)`            | List students             |
| POST   | `/students/advanced-search`       | `requirePermission(STUDENT_READ)`            | Advanced multi-field search|
| POST   | `/students/bulk-status`          | `requirePermission(STUDENT_UPDATE, STUDENT_PROMOTE)` | Bulk status update |
| POST   | `/students/bulk-promote`         | `requirePermission(STUDENT_PROMOTE)`         | Bulk promote              |
| GET    | `/students/:id`                   | `requirePermission(STUDENT_READ)`            | Get student details       |
| GET    | `/students/:id/full-details`      | `requirePermission(STUDENT_READ)`            | Full student profile      |
| PUT    | `/students/:id`                   | `requirePermission(STUDENT_UPDATE)` + upload | Update student            |
| POST   | `/students/:id/promote`           | `requirePermission(STUDENT_PROMOTE)`         | Promote to next grade     |
| POST   | `/students/:id/transfer`          | `requirePermission(STUDENT_TRANSFER)`        | Transfer to another school|
| POST   | `/students/:id/withdraw`          | `requirePermission(STUDENT_TRANSFER)`        | Withdraw student          |
| POST   | `/students/:id/suspend`           | `requirePermission(STUDENT_UPDATE)`          | Suspend student           |
| POST   | `/students/:id/archive`           | `requirePermission(STUDENT_DELETE)`          | Archive student           |
| POST   | `/students/:id/restore`           | `requirePermission(STUDENT_UPDATE)`          | Restore student           |
| POST   | `/students/:id/graduate`          | `requirePermission(STUDENT_GRADUATE)`        | Mark as graduated         |
| GET    | `/students/:id/history`           | `requirePermission(STUDENT_READ)`            | Status change history     |
| GET    | `/students/:id/transcript`        | `requirePermission(DOCUMENT_TRANSCRIPT)`     | Academic transcript       |
| PUT    | `/students/:id/section`           | `requirePermission(STUDENT_UPDATE)`          | Assign section            |

#### Teachers (`/teachers`) -- all require `authenticate`
| Method | Path                                         | Middleware                                   | Description               |
|--------|----------------------------------------------|----------------------------------------------|---------------------------|
| POST   | `/teachers`                                  | `requirePermission(TEACHER_CREATE)` + upload | Register teacher          |
| GET    | `/teachers`                                  | `requirePermission(TEACHER_READ)`            | List teachers             |
| GET    | `/teachers/dashboard`                        | `requirePermission(REPORT_ACADEMIC)`         | Dashboard stats           |
| GET    | `/teachers/:id`                              | `requirePermission(TEACHER_READ)`            | Get teacher details       |
| PUT    | `/teachers/:id`                              | `requirePermission(TEACHER_UPDATE)` + upload | Update teacher            |
| DELETE | `/teachers/:id`                              | `requirePermission(TEACHER_DELETE)`          | Delete teacher            |
| POST   | `/teachers/assign`                           | `requirePermission(TEACHER_ASSIGN)`          | Assign to section/subject |
| DELETE | `/teachers/assignments/:assignmentId`        | `requirePermission(TEACHER_ASSIGN)`          | Remove assignment         |
| GET    | `/teachers/:id/assignments`                  | `requirePermission(TEACHER_READ)`            | Get assignments           |
| GET    | `/teachers/:id/workload`                     | `requirePermission(TEACHER_WORKLOAD)`        | Workload calculation      |
| POST   | `/teachers/:id/attendance`                   | `requirePermission(TEACHER_UPDATE)`          | Record attendance         |
| GET    | `/teachers/:id/attendance`                   | `requirePermission(TEACHER_READ)`            | Get attendance            |
| POST   | `/teachers/:id/leaves`                       | `requirePermission(TEACHER_UPDATE)`          | Request leave             |
| PUT    | `/teachers/:id/leaves/:leaveId`              | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, SCHOOL_DIRECTOR)` | Approve/reject leave |
| POST   | `/teachers/:id/transfer`                     | `requirePermission(TEACHER_ASSIGN)`          | Transfer teacher          |
| GET    | `/teachers/:id/performance`                  | `requirePermission(REPORT_ACADEMIC)`         | Get performance           |
| PUT    | `/teachers/:id/performance`                  | `requirePermission(TEACHER_UPDATE)`          | Update performance        |

**My Teacher Portal:**
| Method | Path                                                | Middleware                                    | Description             |
|--------|-----------------------------------------------------|-----------------------------------------------|-------------------------|
| GET    | `/teachers/my/dashboard`                            | `authorize(TEACHER, HOMEROOM_TEACHER)`        | My dashboard            |
| GET    | `/teachers/my/timetable`                            | `authorize(TEACHER, HOMEROOM_TEACHER)`        | My timetable            |
| GET    | `/teachers/my/sections`                             | `authorize(TEACHER, HOMEROOM_TEACHER)`        | My sections             |
| GET    | `/teachers/my/sections/:sectionId/students`         | `authorize(TEACHER, HOMEROOM_TEACHER)`        | Section students        |
| GET    | `/teachers/my/sections/:sectionId/attendance`       | `authorize(TEACHER, HOMEROOM_TEACHER)`        | Section attendance      |
| GET    | `/teachers/my/subjects`                             | `authorize(TEACHER, HOMEROOM_TEACHER)`        | My subjects             |
| GET    | `/teachers/my/assessments`                          | `authorize(TEACHER, HOMEROOM_TEACHER)`        | My assessments          |
| GET    | `/teachers/my/marks`                                | `authorize(TEACHER, HOMEROOM_TEACHER)`        | Get marks               |
| POST   | `/teachers/my/marks`                                | `authorize(TEACHER, HOMEROOM_TEACHER)`        | Save marks              |
| POST   | `/teachers/my/attendance`                          | `authorize(TEACHER, HOMEROOM_TEACHER)`        | Record my attendance    |
| GET    | `/teachers/my/performance`                          | `authorize(TEACHER, HOMEROOM_TEACHER)`        | My performance          |
| GET    | `/teachers/my/reports/:type`                        | `authorize(TEACHER, HOMEROOM_TEACHER, ACADEMIC_HEAD, SCHOOL_DIRECTOR)` | My reports |

#### Guardians (`/guardians`) -- all require `authenticate`
| Method | Path                              | Middleware                          | Description               |
|--------|-----------------------------------|-------------------------------------|---------------------------|
| POST   | `/guardians`                      | `requirePermission(GUARDIAN_CREATE)`| Register guardian         |
| GET    | `/guardians`                      | `requirePermission(GUARDIAN_READ)`  | List guardians            |
| GET    | `/guardians/:id`                  | `requirePermission(GUARDIAN_READ)`  | Get guardian details      |
| PUT    | `/guardians/:id`                  | `requirePermission(GUARDIAN_UPDATE)`| Update guardian           |
| POST   | `/guardians/:id/link-student`     | `requirePermission(GUARDIAN_UPDATE)`| Link to student           |
| POST   | `/guardians/:id/unlink-student`   | `requirePermission(GUARDIAN_UPDATE)`| Unlink from student       |

#### Sections (`/sections`) -- all require `authenticate`
| Method | Path                                  | Middleware                                   | Description               |
|--------|---------------------------------------|----------------------------------------------|---------------------------|
| POST   | `/sections`                           | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`     | Create section            |
| GET    | `/sections`                           | `requirePermission(SECTION_READ)`            | List sections             |
| GET    | `/sections/dashboard`                 | `authorize(SYSTEM_ADMIN, SCHOOL_DIRECTOR, ACADEMIC_HEAD, REGISTRAR)` | Dashboard |
| GET    | `/sections/:id`                       | `requirePermission(SECTION_READ)`            | Get section details       |
| PUT    | `/sections/:id`                       | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`     | Update section            |
| DELETE | `/sections/:id`                       | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`     | Delete section            |
| POST   | `/sections/:id/archive`               | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`     | Archive section           |
| POST   | `/sections/:id/restore`               | `authorize(SYSTEM_ADMIN)`                    | Restore section           |
| GET    | `/sections/:id/history`               | `requirePermission(SECTION_READ)`            | Section history           |
| GET    | `/sections/:id/students`              | `requirePermission(SECTION_READ)`            | List students in section  |
| POST   | `/sections/:id/students`              | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, REGISTRAR)` | Assign students    |
| DELETE | `/sections/:id/students/:studentId`   | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, REGISTRAR)` | Remove student     |
| GET    | `/sections/:id/subjects`              | `requirePermission(SECTION_READ)`            | Section subjects          |
| POST   | `/sections/transfer/:studentId`       | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, REGISTRAR)` | Transfer between sections |
| GET    | `/sections/:id/transfers`             | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, REGISTRAR)` | Transfer history    |
| GET    | `/sections/:id/performance`           | `authorize(SYSTEM_ADMIN, SCHOOL_DIRECTOR, ACADEMIC_HEAD, HOMEROOM_TEACHER)` | Performance |
| GET    | `/sections/:id/attendance`            | `authorize(SYSTEM_ADMIN, SCHOOL_DIRECTOR, ACADEMIC_HEAD, HOMEROOM_TEACHER, COUNSELOR)` | Attendance |
| POST   | `/sections/balance`                   | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`     | Balance section sizes     |

#### Assessments (`/assessments`) -- all require `authenticate`
| Method | Path                                        | Middleware                                   | Description               |
|--------|----------------------------------------------|----------------------------------------------|---------------------------|
| POST   | `/assessments`                               | `requirePermission(ASSESSMENT_CREATE)`       | Create assessment         |
| GET    | `/assessments`                               | `requirePermission(ASSESSMENT_READ)`         | List assessments          |
| GET    | `/assessments/my-grades`                     | `authorize(STUDENT)`                         | Student's own grades      |
| GET    | `/assessments/my-children-marks`             | `authorize(PARENT)`                          | Parent's children marks   |
| POST   | `/assessments/calculate-rankings`            | `requirePermission(GRADE_CALCULATE)`         | Trigger ranking calc      |
| GET    | `/assessments/student/:studentId`            | `requirePermission(ASSESSMENT_READ)`         | Student's assessments     |
| GET    | `/assessments/student/:studentId/summary`    | `authenticate`                               | Marks summary             |
| GET    | `/assessments/:id`                           | `requirePermission(ASSESSMENT_READ)`         | Get assessment            |
| PUT    | `/assessments/:id`                           | `requirePermission(ASSESSMENT_UPDATE)`       | Update assessment         |
| PUT    | `/assessments/:id/marks`                     | `requirePermission(ASSESSMENT_ENTER_MARKS)`  | Enter/update marks        |
| POST   | `/assessments/:id/submit`                    | `requirePermission(ASSESSMENT_ENTER_MARKS)`  | Submit for approval       |
| POST   | `/assessments/:id/verify`                    | `requirePermission(ASSESSMENT_VERIFY)`       | Verify marks              |
| POST   | `/assessments/:id/approve`                   | `requirePermission(ASSESSMENT_APPROVE)`      | Approve marks             |
| POST   | `/assessments/:id/reject`                    | `requirePermission(ASSESSMENT_VERIFY)`       | Reject marks              |
| POST   | `/assessments/:id/publish`                   | `authorize(REGISTRAR)`                       | Publish results           |
| POST   | `/assessments/:id/lock`                      | `authorize(SYSTEM_ADMIN)`                    | Lock assessment           |
| POST   | `/assessments/:id/unlock`                    | `authorize(SYSTEM_ADMIN)`                    | Unlock assessment         |
| GET    | `/assessments/:id/marks`                     | `authenticate`                               | Get marks                 |
| DELETE | `/assessments/:id/marks`                     | `authenticate`                               | Delete all marks          |
| DELETE | `/assessments/:id/marks/:studentId`          | `authenticate`                               | Delete student mark       |
| GET    | `/assessments/report-card/:studentId`        | `requirePermission(ASSESSMENT_READ)`         | Generate report card      |
| GET    | `/assessments/analytics/at-risk`             | `authorize(COUNSELOR, ACADEMIC_HEAD, SCHOOL_DIRECTOR, SYSTEM_ADMIN)` | At-risk students |
| GET    | `/assessments/homeroom/:sectionId/marks`     | `authenticate`                               | Homeroom marks            |

#### Attendance (`/attendance`) -- all require `authenticate`
| Method | Path                                      | Middleware                                   | Description               |
|--------|-------------------------------------------|----------------------------------------------|---------------------------|
| POST   | `/attendance`                             | `requirePermission(ATTENDANCE_MARK)`         | Mark attendance           |
| GET    | `/attendance`                             | `requirePermission(ATTENDANCE_REPORT)`       | List records              |
| GET    | `/attendance/dashboard/today`             | `requirePermission(ATTENDANCE_REPORT)`       | Today's dashboard         |
| GET    | `/attendance/my-attendance`               | `authorize(STUDENT)`                         | Student's attendance      |
| GET    | `/attendance/my-children-attendance`      | `authorize(PARENT)`                          | Children's attendance     |
| GET    | `/attendance/chronic-absentees`           | `requirePermission(ATTENDANCE_REPORT)`       | Chronic absentees         |
| GET    | `/attendance/school-summary`              | `requirePermission(ATTENDANCE_REPORT)`       | School-wide summary       |
| GET    | `/attendance/student/:id`                 | `requirePermission(ATTENDANCE_READ_ALL)`     | Student attendance history|
| GET    | `/attendance/section/:id/sheet`           | `requirePermission(ATTENDANCE_READ_SECTION)` | Section sheet             |
| GET    | `/attendance/section/:id/sheet/:dateStr`  | `requirePermission(ATTENDANCE_READ_SECTION)` | Sheet by date             |
| GET    | `/attendance/reports/summary`             | `requirePermission(ATTENDANCE_REPORT)`       | Summary report            |
| GET    | `/attendance/section/:id/summary`         | `requirePermission(ATTENDANCE_REPORT)`       | Section summary           |
| PUT    | `/attendance/:id`                         | `requirePermission(ATTENDANCE_MARK)`         | Update record             |
| DELETE | `/attendance/:id`                         | `requirePermission(ATTENDANCE_DELETE)`       | Delete record             |
| POST   | `/attendance/corrections`                 | `requirePermission(ATTENDANCE_CORRECTION_REQUEST)` | Request correction   |
| GET    | `/attendance/corrections`                 | `requirePermission(ATTENDANCE_CORRECTION_REVIEW)` | List corrections     |
| PUT    | `/attendance/corrections/:id/review`      | `requirePermission(ATTENDANCE_CORRECTION_REVIEW)` | Review correction    |

#### Rankings (`/rankings`) -- all require `authenticate`
| Method | Path                                        | Middleware                                   | Description               |
|--------|----------------------------------------------|----------------------------------------------|---------------------------|
| POST   | `/rankings/calculate`                        | `requirePermission(GRADE_CALCULATE)`         | Calculate all rankings    |
| GET    | `/rankings/my-ranking`                       | `authorize(STUDENT)`                         | My ranking                |
| GET    | `/rankings/top-performers`                   | `requirePermission(ANALYTICS_VIEW)`          | Top performers            |
| GET    | `/rankings/school`                           | `requirePermission(ANALYTICS_VIEW)`          | School-wide rankings      |
| GET    | `/rankings/student/:id`                      | `requirePermission(GRADE_READ_ALL)`           | Student ranking           |
| GET    | `/rankings/section/:id`                      | `requirePermission(GRADE_READ_SECTION)`      | Section rankings          |
| GET    | `/rankings/grade/:grade`                     | `requirePermission(GRADE_READ_ALL)`          | Grade rankings            |
| GET    | `/rankings/stream/:grade/:stream`            | `requirePermission(GRADE_READ_ALL)`          | Stream rankings           |
| GET    | `/rankings/subject/:subjectId/top-performers`| `requirePermission(ANALYTICS_VIEW)`          | Subject top performers    |
| POST   | `/rankings/student/:studentId/recalculate`   | `requirePermission(GRADE_CALCULATE)`         | Recalculate student       |

#### Finance (`/finance`) -- all require `authenticate`
| Method | Path                              | Middleware                                   | Description               |
|--------|-----------------------------------|----------------------------------------------|---------------------------|
| POST   | `/finance`                        | `requirePermission(FINANCE_CREATE_FEE)`      | Create fee structure      |
| GET    | `/finance/structures`             | `requirePermission(FINANCE_READ)`            | List fee structures       |
| PUT    | `/finance/structures/:id`         | `requirePermission(FINANCE_CREATE_FEE)`      | Update fee structure      |
| POST   | `/finance/payments`               | `requirePermission(FINANCE_RECORD_PAYMENT)`  | Record payment            |
| GET    | `/finance/payments/:id/receipt`   | `requirePermission(FINANCE_GENERATE_RECEIPT)`| Generate receipt          |
| GET    | `/finance/students/:id/status`    | `requirePermission(FINANCE_READ)`            | Student fee status        |
| GET    | `/finance/reports/collection`     | `requirePermission(FINANCE_REPORT)`          | Collection report         |
| GET    | `/finance/reports/outstanding`    | `requirePermission(FINANCE_REPORT)`          | Outstanding report        |

#### Library (`/library`) -- all require `authenticate`
| Method | Path                                    | Middleware                                   | Description               |
|--------|------------------------------------------|----------------------------------------------|---------------------------|
| POST   | `/library/books`                         | `requirePermission(LIBRARY_MANAGE_BOOKS)` + upload | Add book           |
| GET    | `/library/books`                         | `requirePermission(LIBRARY_READ)`            | List books                |
| GET    | `/library/books/search`                  | `requirePermission(LIBRARY_READ)`            | Search books              |
| PUT    | `/library/books/:id`                     | `requirePermission(LIBRARY_MANAGE_BOOKS)` + upload | Update book        |
| DELETE | `/library/books/:id`                     | `requirePermission(LIBRARY_MANAGE_BOOKS)`    | Delete book               |
| GET    | `/library/borrowings`                    | `requirePermission(LIBRARY_READ)`            | All borrowings            |
| GET    | `/library/borrowings/my`                 | `requirePermission(LIBRARY_BORROW)`          | My borrowings             |
| GET    | `/library/borrowings/user/:id`           | `requirePermission(LIBRARY_READ)`            | User borrowings           |
| POST   | `/library/borrowings`                    | `requirePermission(LIBRARY_BORROW)`          | Borrow book               |
| PUT    | `/library/borrowings/:id/return`         | `requirePermission(LIBRARY_RETURN)`          | Return book               |
| GET    | `/library/reports/overdue`               | `requirePermission(LIBRARY_REPORT)`          | Overdue report            |
| GET    | `/library/statistics`                    | `requirePermission(LIBRARY_READ)`            | Library stats             |

#### Communications (`/communications`) -- all require `authenticate`
| Method | Path                                      | Middleware                                   | Description                |
|--------|--------------------------------------------|----------------------------------------------|----------------------------|
| POST   | `/communications/announcements`            | `requirePermission(ANNOUNCEMENT_CREATE)`     | Create announcement        |
| GET    | `/communications/announcements`            | `authenticate`                               | List announcements         |
| PUT    | `/communications/announcements/:id`        | `requirePermission(ANNOUNCEMENT_CREATE)`     | Update announcement        |
| DELETE | `/communications/announcements/:id`        | `requirePermission(ANNOUNCEMENT_CREATE)`     | Delete announcement        |
| POST   | `/communications/notifications`            | `requirePermission(NOTIFICATION_SEND)`       | Send notification          |
| GET    | `/communications/notifications`            | `authenticate`                               | My notifications           |
| PUT    | `/communications/notifications/read-all`   | `authenticate`                               | Mark all read              |
| PUT    | `/communications/notifications/:id/read`   | `authenticate`                               | Mark read                  |
| DELETE | `/communications/notifications/:id`        | `authenticate`                               | Delete notification        |

#### Announcements (`/announcements`) -- all require `authenticate`
| Method | Path                              | Middleware                                   | Description             |
|--------|-----------------------------------|----------------------------------------------|-------------------------|
| GET    | `/announcements`                  | --                                           | List (role-filtered)    |
| GET    | `/announcements/stats`            | `authorize(SYSTEM_ADMIN, SCHOOL_DIRECTOR, ACADEMIC_HEAD)` | Stats    |
| POST   | `/announcements`                  | --                                           | Create                  |
| GET    | `/announcements/:id`              | --                                           | Get single              |
| PUT    | `/announcements/:id`              | --                                           | Update                  |
| DELETE | `/announcements/:id`              | --                                           | Delete                  |
| POST   | `/announcements/:id/publish`      | --                                           | Publish                 |
| POST   | `/announcements/:id/unpublish`    | --                                           | Unpublish               |
| POST   | `/announcements/:id/archive`      | --                                           | Archive                 |
| POST   | `/announcements/:id/read`         | --                                           | Mark as read            |

#### Messages (`/messages`) -- all require `authenticate`
| Method | Path                              | Middleware                                   | Description             |
|--------|-----------------------------------|----------------------------------------------|-------------------------|
| POST   | `/messages`                       | `requirePermission(MESSAGE_SEND)`            | Send message            |
| GET    | `/messages/inbox`                 | `requirePermission(MESSAGE_READ)`            | Inbox                   |
| GET    | `/messages/outbox`                | `requirePermission(MESSAGE_SEND)`            | Outbox                  |
| GET    | `/messages/unread-count`          | `requirePermission(MESSAGE_READ)`            | Unread count            |
| GET    | `/messages/thread/:threadId`      | `requirePermission(MESSAGE_READ)`            | Thread view             |
| PUT    | `/messages/:id/read`              | `requirePermission(MESSAGE_READ)`            | Mark read               |
| DELETE | `/messages/:id`                   | `requirePermission(MESSAGE_READ)`            | Delete                  |

#### Timetables (`/timetables`) -- all require `authenticate`
| Method | Path                              | Middleware                                   | Description             |
|--------|-----------------------------------|----------------------------------------------|-------------------------|
| POST   | `/timetables`                     | `requirePermission(TIMETABLE_CREATE)`        | Create timetable        |
| GET    | `/timetables`                     | `requirePermission(TIMETABLE_READ)`          | List timetables         |
| GET    | `/timetables/section/:sectionId`  | `requirePermission(TIMETABLE_READ)`          | Section timetable       |
| PUT    | `/timetables/:id`                 | `requirePermission(TIMETABLE_CREATE)`        | Update                  |
| DELETE | `/timetables/:id`                 | `requirePermission(TIMETABLE_CREATE)`        | Delete                  |
| POST   | `/timetables/:id/slots`           | `requirePermission(TIMETABLE_CREATE)`        | Add slot                |
| DELETE | `/timetables/:id/slots/:slotId`   | `requirePermission(TIMETABLE_CREATE)`        | Remove slot             |

#### Subjects (`/subjects`) -- all require `authenticate`
| Method | Path                                        | Middleware                                   | Description             |
|--------|----------------------------------------------|----------------------------------------------|-------------------------|
| POST   | `/subjects`                                  | `requirePermission(CURRICULUM_MANAGE)`       | Create subject          |
| GET    | `/subjects`                                  | `requirePermission(SECTION_READ)`            | List subjects           |
| GET    | `/subjects/dashboard`                        | `requirePermission(REPORT_ACADEMIC)`         | Subject dashboard       |
| GET    | `/subjects/reports/performance`              | `requirePermission(REPORT_ACADEMIC)`         | Performance report      |
| GET    | `/subjects/reports/ranking`                  | `requirePermission(REPORT_ACADEMIC)`         | Ranking report          |
| GET    | `/subjects/reports/section-performance`      | `requirePermission(REPORT_ACADEMIC)`         | Section performance     |
| GET    | `/subjects/:id`                              | `requirePermission(SECTION_READ)`            | Get subject             |
| GET    | `/subjects/:id/report`                       | `requirePermission(REPORT_ACADEMIC)`         | Subject report          |
| PUT    | `/subjects/:id`                              | `requirePermission(CURRICULUM_MANAGE)`       | Update                  |
| PUT    | `/subjects/:id/status`                       | `requirePermission(CURRICULUM_MANAGE)`       | Toggle active           |
| DELETE | `/subjects/:id`                              | `requirePermission(CURRICULUM_MANAGE)`       | Delete                  |
| POST   | `/subjects/assignments`                      | `requirePermission(SUBJECT_ASSIGN)`          | Create assignment       |
| GET    | `/subjects/assignments`                      | `requirePermission(SUBJECT_ASSIGN)`          | List assignments        |
| POST   | `/subjects/assignments/copy`                 | `requirePermission(SUBJECT_ASSIGN)`          | Copy assignments        |
| DELETE | `/subjects/assignments/:id`                  | `requirePermission(SUBJECT_ASSIGN)`          | Delete assignment       |
| POST   | `/subjects/resources`                        | `requirePermission(SUBJECT_RESOURCE_MANAGE)` | Create resource         |
| GET    | `/subjects/resources`                        | `requirePermission(SECTION_READ)`            | List resources          |
| PUT    | `/subjects/resources/:id`                    | `requirePermission(SUBJECT_RESOURCE_MANAGE)` | Update resource         |
| DELETE | `/subjects/resources/:id`                    | `requirePermission(SUBJECT_RESOURCE_MANAGE)` | Delete resource         |
| POST   | `/subjects/materials`                        | `requirePermission(SUBJECT_MATERIAL_MANAGE)` | Create material         |
| GET    | `/subjects/materials`                        | `requirePermission(SUBJECT_MATERIAL_VIEW)`   | List materials          |
| DELETE | `/subjects/materials/:id`                    | `requirePermission(SUBJECT_MATERIAL_MANAGE)` | Delete material         |
| POST   | `/subjects/schedules`                        | `requirePermission(CURRICULUM_MANAGE)`       | Create schedule         |
| GET    | `/subjects/schedules`                        | `requirePermission(SECTION_READ)`            | List schedules          |
| PUT    | `/subjects/schedules/:id`                    | `requirePermission(CURRICULUM_MANAGE)`       | Update schedule         |
| DELETE | `/subjects/schedules/:id`                    | `requirePermission(CURRICULUM_MANAGE)`       | Delete schedule         |

#### Classrooms (`/classrooms`) -- all require `authenticate`
| Method | Path                    | Middleware                               | Description          |
|--------|-------------------------|------------------------------------------|----------------------|
| POST   | `/classrooms`           | `requirePermission(RESOURCE_MANAGE)`     | Create classroom     |
| GET    | `/classrooms`           | `requirePermission(RESOURCE_READ)`       | List classrooms      |
| GET    | `/classrooms/:id`       | `requirePermission(RESOURCE_READ)`       | Get classroom        |
| PUT    | `/classrooms/:id`       | `requirePermission(RESOURCE_MANAGE)`     | Update               |
| DELETE | `/classrooms/:id`       | `requirePermission(RESOURCE_MANAGE)`     | Delete               |

#### Counseling (`/counseling`) -- all require `authenticate`
| Method | Path                  | Middleware                                   | Description          |
|--------|-----------------------|----------------------------------------------|----------------------|
| POST   | `/counseling`         | `requirePermission(COUNSELING_CREATE)`       | Create session       |
| GET    | `/counseling`         | `requirePermission(COUNSELING_READ_ALL)`     | List sessions        |
| GET    | `/counseling/:id`     | `requirePermission(COUNSELING_READ_ALL)`     | Get session          |
| PUT    | `/counseling/:id`     | `requirePermission(COUNSELING_UPDATE)`       | Update session       |

#### Behavioral (`/behavioral`) -- all require `authenticate`
| Method | Path                  | Middleware                                   | Description          |
|--------|-----------------------|----------------------------------------------|----------------------|
| POST   | `/behavioral`         | `requirePermission(BEHAVIORAL_REPORT_CREATE)`| Create report        |
| GET    | `/behavioral`         | `requirePermission(BEHAVIORAL_REPORT_READ)`  | List reports         |
| GET    | `/behavioral/:id`     | `requirePermission(BEHAVIORAL_REPORT_READ)`  | Get report           |
| PUT    | `/behavioral/:id`     | `requirePermission(COUNSELING_UPDATE)`       | Update report        |

#### Health (`/health-check`) -- all require `authenticate`
| Method | Path                              | Middleware                               | Description           |
|--------|-----------------------------------|------------------------------------------|-----------------------|
| GET    | `/health-check/:studentId`        | `requirePermission(STUDENT_READ)`        | Get health record     |
| POST   | `/health-check`                   | `requirePermission(STUDENT_CREATE)`      | Create record         |
| PUT    | `/health-check/:studentId`        | `requirePermission(STUDENT_UPDATE)`      | Update record         |
| POST   | `/health-check/:studentId/visits` | `requirePermission(STUDENT_UPDATE)`      | Add clinic visit      |
| POST   | `/health-check/:studentId/immunizations` | `requirePermission(STUDENT_UPDATE)` | Add immunization   |

#### Settings (`/settings`) -- all require `authenticate`
| Method | Path              | Middleware                        | Description           |
|--------|-------------------|-----------------------------------|-----------------------|
| GET    | `/settings`       | --                                | Get system settings   |
| PUT    | `/settings`       | `authorize(SYSTEM_ADMIN)`         | Update settings       |

#### Events (`/events`) -- all require `authenticate`
| Method | Path              | Middleware                           | Description           |
|--------|-------------------|--------------------------------------|-----------------------|
| POST   | `/events`         | `requirePermission(EVENT_CREATE)`    | Create event          |
| GET    | `/events`         | `requirePermission(EVENT_READ)`      | List events           |
| GET    | `/events/:id`     | `requirePermission(EVENT_READ)`      | Get event             |
| PUT    | `/events/:id`     | `requirePermission(EVENT_UPDATE)`    | Update event          |
| DELETE | `/events/:id`     | `requirePermission(EVENT_CREATE)`    | Delete event          |

#### Alumni (`/alumni`) -- all require `authenticate`
| Method | Path              | Middleware                               | Description           |
|--------|-------------------|------------------------------------------|-----------------------|
| GET    | `/alumni`         | `requirePermission(ALUMNI_READ)`         | List alumni           |
| GET    | `/alumni/stats`   | `requirePermission(ALUMNI_REPORT)`       | Statistics            |
| GET    | `/alumni/:id`     | `requirePermission(ALUMNI_READ)`         | Get alumnus           |
| PUT    | `/alumni/:id`     | `requirePermission(ALUMNI_UPDATE)`       | Update alumni         |

#### Audit Logs (`/audit-logs`) -- all require `authenticate`
| Method | Path                | Middleware                               | Description           |
|--------|---------------------|------------------------------------------|-----------------------|
| GET    | `/audit-logs`       | `requirePermission(AUDIT_READ)`          | List audit logs       |
| GET    | `/audit-logs/stats` | `requirePermission(AUDIT_REPORT)`        | Statistics            |
| GET    | `/audit-logs/:id`   | `requirePermission(AUDIT_READ)`          | Get entry             |

#### Dashboard (`/dashboard`) -- all require `authenticate`
| Method | Path                    | Middleware | Description                     |
|--------|-------------------------|------------|---------------------------------|
| GET    | `/dashboard/stats`      | --         | Admin dashboard statistics      |
| GET    | `/dashboard/teacher`    | --         | Teacher dashboard data          |
| GET    | `/dashboard/student`    | --         | Student dashboard data          |

#### Assignments (`/assignments`) -- all require `authenticate`
| Method | Path                                          | Middleware                                                    | Description              |
|--------|-----------------------------------------------|---------------------------------------------------------------|--------------------------|
| GET    | `/assignments/dashboard`                      | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, SCHOOL_DIRECTOR)`     | Assignment dashboard     |
| GET    | `/assignments/students/unassigned`            | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, REGISTRAR)`           | Unassigned students      |
| GET    | `/assignments/sections/:id/overview`          | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, SCHOOL_DIRECTOR, REGISTRAR, TEACHER, HOMEROOM_TEACHER)` | Section overview |
| POST   | `/assignments/teachers/batch-assign`          | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`                      | Batch assign teachers    |
| GET    | `/assignments/teachers/:id/workload-check`    | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, SCHOOL_DIRECTOR)`     | Workload check           |
| POST   | `/assignments/section-subject-teacher`        | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`                      | Assign teacher           |
| POST   | `/assignments/homeroom`                       | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD)`                      | Set homeroom teacher     |
| GET    | `/assignments/reports`                        | `authorize(SYSTEM_ADMIN, ACADEMIC_HEAD, SCHOOL_DIRECTOR)`     | Reports                  |

---

## API Client Endpoints

Defined in `client/src/services/api.ts`. All calls are prefixed with `/api/v1`. Grouped by module:

### authAPI
| Method | Path                  | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/auth/login`         | Login with email and password  |
| POST   | `/auth/logout`        | Logout                         |
| POST   | `/auth/refresh`       | Refresh access token           |
| GET    | `/auth/profile`       | Get authenticated user profile |
| POST   | `/auth/change-password` | Change password              |

### usersAPI
| Method | Path                   | Description          |
|--------|------------------------|----------------------|
| GET    | `/users`               | List users (filtered)|
| POST   | `/users`               | Create user          |
| GET    | `/users/:id`           | Get user by ID       |
| PUT    | `/users/:id`           | Update user          |
| PUT    | `/users/:id/role`      | Change user role     |

### studentsAPI (21 endpoints)
| Method | Path                                    | Description             |
|--------|-----------------------------------------|-------------------------|
| GET    | `/students`                             | List students           |
| POST   | `/students`                             | Register student        |
| GET    | `/students/:id`                         | Get student             |
| PUT    | `/students/:id`                         | Update student          |
| POST   | `/students/:id/transfer`                | Transfer to other school|
| POST   | `/students/:id/withdraw`                | Withdraw student        |
| POST   | `/students/:id/promote`                 | Promote to next grade   |
| POST   | `/students/:id/suspend`                 | Suspend student         |
| POST   | `/students/:id/archive`                 | Archive student         |
| POST   | `/students/:id/restore`                 | Restore student         |
| POST   | `/students/:id/graduate`               | Mark as graduated       |
| GET    | `/students/:id/transcript`             | Academic transcript     |
| GET    | `/students/:id/full-details`            | Full student profile    |
| GET    | `/students/:id/history`                 | Status change history   |
| POST   | `/students/advanced-search`             | Advanced multi-field search|
| POST   | `/students/bulk-status`                 | Bulk status update      |
| POST   | `/students/bulk-promote`                | Bulk grade promotion    |
| PUT    | `/students/:id/section`                 | Assign section          |

### teachersAPI (around 30 endpoints)
| Method | Path                                              | Description            |
|--------|----------------------------------------------------|------------------------|
| GET    | `/teachers`                                        | List teachers          |
| POST   | `/teachers`                                        | Register teacher       |
| GET    | `/teachers/:id`                                    | Get teacher            |
| PUT    | `/teachers/:id`                                    | Update teacher         |
| DELETE | `/teachers/:id`                                    | Delete teacher         |
| POST   | `/teachers/assign`                                 | Assign to section      |
| DELETE | `/teachers/assignments/:assignmentId`              | Remove assignment      |
| GET    | `/teachers/:id/workload`                           | Workload calculation   |
| GET    | `/teachers/:id/assignments`                        | Assignments            |
| POST   | `/teachers/:id/attendance`                         | Record attendance      |
| GET    | `/teachers/:id/attendance`                         | Get attendance         |
| POST   | `/teachers/:id/leaves`                             | Request leave          |
| PUT    | `/teachers/:id/leaves/:leaveId`                    | Approve/reject leave   |
| POST   | `/teachers/:id/transfer`                           | Transfer teacher       |
| GET    | `/teachers/:id/performance`                        | Get performance        |
| PUT    | `/teachers/:id/performance`                        | Update performance     |
| GET    | `/teachers/dashboard`                              | Dashboard stats        |
| GET    | `/teachers/my/dashboard`                           | My dashboard           |
| GET    | `/teachers/my/timetable`                           | My timetable           |
| GET    | `/teachers/my/sections`                            | My sections            |
| GET    | `/teachers/my/sections/:sectionId/students`        | Section students       |
| GET    | `/teachers/my/sections/:sectionId/attendance`      | Section attendance     |
| GET    | `/teachers/my/subjects`                            | My subjects            |
| GET    | `/teachers/my/assessments`                         | My assessments         |
| GET    | `/teachers/my/marks`                               | Get marks              |
| POST   | `/teachers/my/marks`                               | Save marks             |
| POST   | `/teachers/my/attendance`                          | Record my attendance   |
| GET    | `/teachers/my/performance`                         | My performance         |
| GET    | `/teachers/my/reports/:type`                       | My reports             |

### sectionsAPI
| Method | Path                                    | Description             |
|--------|-----------------------------------------|-------------------------|
| GET    | `/sections`                             | List sections           |
| POST   | `/sections`                             | Create section          |
| GET    | `/sections/:id`                         | Get section             |
| PUT    | `/sections/:id`                         | Update section          |
| DELETE | `/sections/:id`                         | Delete section          |
| GET    | `/sections/:id/students`                | Section students        |
| GET    | `/sections/:id/subjects`                | Section subjects        |
| POST   | `/sections/:id/archive`                 | Archive section         |
| POST   | `/sections/:id/restore`                 | Restore section         |
| GET    | `/sections/:id/history`                 | Section history         |
| POST   | `/sections/:id/students`                | Assign students         |
| DELETE | `/sections/:id/students/:studentId`     | Remove student          |
| POST   | `/sections/transfer/:studentId`         | Transfer between sections|
| GET    | `/sections/:id/transfers`               | Transfer history        |
| GET    | `/sections/:id/performance`             | Academic performance    |
| GET    | `/sections/:id/attendance`              | Attendance summary      |
| GET    | `/sections/dashboard`                   | Section dashboard       |
| POST   | `/sections/balance`                     | Balance section sizes   |

### assessmentsAPI
| Method | Path                                            | Description             |
|--------|--------------------------------------------------|-------------------------|
| GET    | `/assessments`                                   | List assessments        |
| POST   | `/assessments`                                   | Create assessment       |
| GET    | `/assessments/:id`                               | Get assessment          |
| PUT    | `/assessments/:id`                               | Update assessment       |
| PUT    | `/assessments/:id/marks`                         | Enter/update marks      |
| POST   | `/assessments/:id/verify`                        | Verify marks            |
| POST   | `/assessments/:id/approve`                       | Approve marks           |
| POST   | `/assessments/:id/submit`                        | Submit for approval     |
| POST   | `/assessments/:id/reject`                        | Reject marks            |
| POST   | `/assessments/:id/publish`                       | Publish results         |
| POST   | `/assessments/:id/lock`                          | Lock assessment         |
| POST   | `/assessments/:id/unlock`                        | Unlock assessment       |
| GET    | `/assessments/report-card/:studentId`            | Generate report card    |
| GET    | `/assessments/analytics/at-risk`                 | At-risk students        |
| GET    | `/assessments/homeroom/:sectionId/marks`         | Homeroom marks          |
| GET    | `/assessments/student/:studentId`                | Student's assessments   |
| GET    | `/assessments/my-grades`                         | Student's own grades    |
| POST   | `/assessments/calculate-rankings`                | Trigger ranking calc    |
| DELETE | `/assessments/:assessmentId/marks/:studentId`    | Delete student mark     |
| DELETE | `/assessments/:assessmentId/marks`               | Delete all marks        |
| GET    | `/assessments/student/:studentId/summary`        | Marks summary           |
| GET    | `/assessments/my-children-marks`                 | Parent's children marks |

### attendanceAPI
| Method | Path                                            | Description             |
|--------|--------------------------------------------------|-------------------------|
| GET    | `/attendance`                                    | List records            |
| POST   | `/attendance`                                    | Mark attendance         |
| PUT    | `/attendance/:id`                                | Update record           |
| DELETE | `/attendance/:id`                                | Delete record           |
| GET    | `/attendance/student/:studentId`                 | Student attendance      |
| GET    | `/attendance/section/:sectionId/sheet/:date`     | Section sheet by date   |
| GET    | `/attendance/my-attendance`                      | Student's attendance    |
| GET    | `/attendance/my-children-attendance`             | Children's attendance   |
| GET    | `/attendance/reports/summary`                    | Summary report          |
| GET    | `/attendance/school-summary`                     | School-wide summary     |
| GET    | `/attendance/dashboard/today`                    | Today's dashboard       |
| GET    | `/attendance/corrections`                        | List corrections        |
| POST   | `/attendance/corrections`                        | Request correction      |
| PUT    | `/attendance/corrections/:id/review`             | Review correction       |

### financeAPI
| Method | Path                                    | Description             |
|--------|-----------------------------------------|-------------------------|
| GET    | `/finance/structures`                   | List fee structures     |
| POST   | `/finance`                              | Create fee structure    |
| PUT    | `/finance/structures/:id`               | Update fee structure    |
| GET    | `/finance/students/:studentId/status`   | Student fee status      |
| POST   | `/finance/payments`                     | Record payment          |
| GET    | `/finance/payments/:paymentId/receipt`  | Generate receipt        |
| GET    | `/finance/reports/collection`           | Collection report       |
| GET    | `/finance/reports/outstanding`          | Outstanding report      |

### libraryAPI
| Method | Path                                    | Description             |
|--------|-----------------------------------------|-------------------------|
| GET    | `/library/books`                        | List books              |
| GET    | `/library/books/search`                 | Search books            |
| POST   | `/library/books`                        | Add book                |
| PUT    | `/library/books/:id`                    | Update book             |
| DELETE | `/library/books/:id`                    | Delete book             |
| POST   | `/library/borrowings`                   | Borrow book             |
| PUT    | `/library/borrowings/:borrowingId/return` | Return book           |
| GET    | `/library/borrowings`                   | All borrowings          |
| GET    | `/library/borrowings/my`                | My borrowings           |
| GET    | `/library/borrowings/user/:userId`      | User borrowings         |
| GET    | `/library/reports/overdue`              | Overdue report          |
| GET    | `/library/statistics`                   | Library stats           |

### communicationAPI
| Method | Path                                          | Description             |
|--------|-----------------------------------------------|-------------------------|
| GET    | `/communications/announcements`               | List announcements      |
| POST   | `/communications/announcements`               | Create announcement     |
| PUT    | `/communications/announcements/:id`           | Update announcement     |
| DELETE | `/communications/announcements/:id`           | Delete announcement     |
| GET    | `/communications/notifications`               | My notifications        |
| PUT    | `/communications/notifications/:id/read`      | Mark read               |
| PUT    | `/communications/notifications/read-all`      | Mark all read           |
| DELETE | `/communications/notifications/:id`           | Delete notification     |
| POST   | `/communications/notifications`               | Send notification       |

### messagesAPI
| Method | Path                              | Description             |
|--------|-----------------------------------|-------------------------|
| GET    | `/messages/inbox`                 | Inbox                   |
| GET    | `/messages/outbox`                | Outbox                  |
| POST   | `/messages`                       | Send message            |
| GET    | `/messages/thread/:threadId`      | Thread view             |
| PUT    | `/messages/:id/read`              | Mark read               |
| DELETE | `/messages/:id`                   | Delete                  |
| GET    | `/messages/unread-count`          | Unread count            |

### rankingsAPI
| Method | Path                          | Description             |
|--------|-------------------------------|-------------------------|
| GET    | `/rankings`                   | List rankings           |
| GET    | `/rankings/my-ranking`        | My ranking (student)    |
| GET    | `/rankings/student/:id`       | Student ranking         |
| POST   | `/rankings/calculate`         | Calculate rankings      |

### guardiansAPI
| Method | Path                                    | Description             |
|--------|-----------------------------------------|-------------------------|
| GET    | `/guardians`                            | List guardians          |
| POST   | `/guardians`                            | Register guardian       |
| GET    | `/guardians/:id`                        | Get guardian            |
| PUT    | `/guardians/:id`                        | Update guardian         |
| POST   | `/guardians/:id/students`               | Link to student         |
| DELETE | `/guardians/:id/students/:studentId`    | Unlink from student     |

### timetablesAPI, classroomsAPI, counselingAPI, behavioralAPI, healthAPI, eventsAPI, alumniAPI, dashboardAPI, subjectsAPI, assignmentsAPI, announcementsAPI
(Each follows the same pattern as server routes above.)

---

## Client Routes (52 routes)

All routes are wrapped in `<ProtectedRoute>` with `<Layout>` (except login, MFA, reset-password). Defined in `client/src/App.tsx`.

| Path                                              | Component/Page                   |
|---------------------------------------------------|----------------------------------|
| `/login`                                          | LoginPage                        |
| `/mfa`                                            | MfaVerificationPage              |
| `/reset-password`                                 | PasswordResetPage                |
| `/`                                               | Redirects to `/dashboard`        |
| `/dashboard`                                      | DashboardPage                    |
| `/change-password`                                | ChangePasswordPage               |
| `/students`                                       | StudentListPage                  |
| `/students/new`                                   | StudentFormPage                  |
| `/students/advanced-search`                       | AdvancedStudentSearchPage        |
| `/students/bulk-promote`                          | BulkPromotePage                  |
| `/students/:id`                                   | StudentProfilePage               |
| `/students/:id/edit`                              | StudentFormPage                  |
| `/teachers`                                       | TeacherListPage                  |
| `/teachers/new`                                   | TeacherFormPage                  |
| `/teachers/:id`                                   | TeacherProfilePage               |
| `/teachers/:id/edit`                              | TeacherFormPage                  |
| `/my-teacher/dashboard`                           | MyTeacherDashboard                |
| `/my-teacher/timetable`                           | MyTeacherTimetable                |
| `/my-teacher/sections`                            | MyTeacherSections                 |
| `/my-teacher/sections/:sectionId/students`       | MyTeacherSectionStudents          |
| `/my-teacher/marks`                               | MyTeacherMarks                    |
| `/my-teacher/reports`                             | MyTeacherReports                  |
| `/assessments`                                    | MarksManagementPage              |
| `/assessments/new`                                | AssessmentFormPage               |
| `/assessments/:id/marks`                          | MarksEntryPage                   |
| `/assessments/report-card/:studentId`             | ReportCardPage (assessments)     |
| `/assessments/homeroom/:sectionId/marks`          | HomeroomSectionMarksPage         |
| `/attendance`                                     | AttendanceSheetPage              |
| `/attendance/dashboard`                           | AttendanceDashboardPage          |
| `/attendance/reports`                             | AttendanceReportsPage            |
| `/attendance/corrections`                         | AttendanceCorrectionPage         |
| `/finance`                                        | FeeStructurePage                 |
| `/finance/payments`                               | PaymentPage                      |
| `/finance/reports`                                | FinanceReportsPage               |
| `/library`                                        | LibraryBooksPage                 |
| `/library/borrowing`                              | LibraryBorrowingPage             |
| `/announcements`                                  | AnnouncementsPage                |
| `/communications`                                 | AnnouncementsPage                |
| `/communications/notifications`                   | NotificationCenterPage           |
| `/profile`                                        | ProfilePage                      |
| `/sections`                                       | SectionListPage                  |
| `/sections/:id`                                   | SectionProfilePage               |
| `/rankings`                                       | RankingPage                      |
| `/reports/report-cards`                           | ReportCardPage (reports)         |
| `/calendar`                                       | CalendarPage                     |
| `/guardians`                                      | GuardianPortalPage               |
| `/my-dashboard`                                   | StudentDashboardPage             |
| `/messages`                                       | MessagesPage                     |
| `/timetable`                                      | TimetablePage                    |
| `/classrooms`                                     | ClassroomsPage                   |
| `/counseling`                                     | CounselingPage                   |
| `/discipline`                                     | DisciplinePage                   |
| `/health`                                         | HealthPage                       |
| `/settings`                                       | SettingsPage                     |
| `/users`                                          | UsersPage                        |
| `/subjects`                                       | SubjectListPage                  |
| `/subjects/new`                                   | SubjectFormPage                  |
| `/subjects/:id`                                   | SubjectDetailPage                |
| `/subjects/:id/edit`                              | SubjectFormPage                  |
| `/alumni`                                         | AlumniPage                       |
| `/audit-logs`                                     | AuditLogPage                     |
| `/assignments/dashboard`                          | AssignmentDashboardPage          |
| `/assignments/students/unassigned`                | UnassignedStudentsPage           |
| `/assignments/teachers/batch`                     | TeacherBatchAssignPage           |
| `/assignments/sections`                           | SectionOverviewPage              |
| `/assignments/reports`                            | AssignmentReportsPage            |

---

## Sidebar Navigation

Defined in `client/src/components/Layout.tsx`. Items conditionally rendered based on user role.

| #  | Text                  | Icon                    | Path                                     | Allowed Roles                            |
|----|-----------------------|-------------------------|------------------------------------------|------------------------------------------|
| 1  | Dashboard             | Dashboard               | `/dashboard`                             | All 11 roles                             |
| 2  | My Teaching           | School                  | `/my-teacher/dashboard`                  | teacher, homeroom_teacher                |
| 3  | My Timetable          | Schedule                | `/my-teacher/timetable`                  | teacher, homeroom_teacher                |
| 4  | My Sections           | Group                   | `/my-teacher/sections`                   | teacher, homeroom_teacher                |
| 5  | My Marks              | AssignmentIcon          | `/my-teacher/marks`                      | teacher, homeroom_teacher                |
| 6  | My Reports            | TrendingUp              | `/my-teacher/reports`                    | teacher, homeroom_teacher, academic_head, school_director |
| 7  | My Studies            | School                  | `/my-dashboard`                          | student                                  |
| 8  | Students              | School                  | `/students`                              | system_admin, school_director, academic_head, registrar, teacher, homeroom_teacher, counselor |
| 9  | Adv. Search           | Search                  | `/students/advanced-search`              | system_admin, school_director, academic_head, registrar, teacher, homeroom_teacher, counselor |
| 10 | Bulk Promote          | TrendingUp              | `/students/bulk-promote`                 | system_admin, academic_head              |
| 11 | Teachers              | Person                  | `/teachers`                              | system_admin, school_director            |
| 12 | Assessments           | Assessment              | `/assessments`                           | system_admin, school_director, academic_head, teacher, homeroom_teacher, student, parent |
| 13 | Attendance            | EventNote               | `/attendance`                            | system_admin, school_director, academic_head, teacher, homeroom_teacher, student, parent |
| 14 | Finance               | AccountBalance          | `/finance`                               | system_admin, school_director, finance_officer, student, parent |
| 15 | Library               | LocalLibrary            | `/library`                               | system_admin, school_director, librarian, teacher, student |
| 16 | Announcements         | Campaign                | `/announcements`                         | All 11 roles                             |
| 17 | Notification Center   | NotificationsActive     | `/communications/notifications`          | All 11 roles                             |
| 18 | Messages              | ForwardToInbox          | `/messages`                              | system_admin, school_director, academic_head, teacher, homeroom_teacher, counselor, student, parent |
| 19 | Sections              | GroupWork               | `/sections`                              | system_admin, school_director, academic_head, registrar |
| 20 | Rankings              | EmojiEvents             | `/rankings`                              | system_admin, school_director, academic_head, teacher, homeroom_teacher, student, parent |
| 21 | Report Cards          | Description             | `/reports`                               | system_admin, school_director, academic_head, registrar, teacher, homeroom_teacher, student, parent |
| 22 | Timetable             | CalendarToday           | `/timetable`                             | system_admin, school_director, academic_head, registrar, teacher, homeroom_teacher, counselor, student, parent |
| 23 | Subjects              | SubjectIcon             | `/subjects`                              | system_admin, school_director, academic_head, registrar, teacher, homeroom_teacher, student, parent |
| 24 | Assign. Dashboard     | Dashboard               | `/assignments/dashboard`                 | system_admin, school_director, academic_head |
| 25 | Unassigned Students   | School                  | `/assignments/students/unassigned`       | system_admin, academic_head, registrar    |
| 26 | Batch Assign          | Group                   | `/assignments/teachers/batch`            | system_admin, academic_head              |
| 27 | Section Overview      | GroupWork               | `/assignments/sections`                  | system_admin, school_director, academic_head, registrar, teacher, homeroom_teacher |
| 28 | Assign. Reports       | Assessment              | `/assignments/reports`                   | system_admin, school_director, academic_head |
| 29 | Classrooms            | MeetingRoom             | `/classrooms`                            | system_admin, school_director, academic_head, registrar |
| 30 | Counseling            | Psychology              | `/counseling`                            | system_admin, school_director, academic_head, counselor |
| 31 | Discipline            | Gavel                   | `/discipline`                            | system_admin, school_director, academic_head, counselor, homeroom_teacher |
| 32 | Health Records        | HealthAndSafety         | `/health`                                | system_admin, school_director, academic_head, counselor |
| 33 | Users                 | People                  | `/users`                                 | system_admin (ONLY)                      |
| 34 | Alumni                | School                  | `/alumni`                                | system_admin, school_director, academic_head, registrar |
| 35 | Audit Logs            | History                 | `/audit-logs`                            | system_admin, school_director            |
| 36 | Settings              | Settings                | `/settings`                              | system_admin (ONLY)                      |
| 37 | My Children           | SupervisorAccount       | `/guardians`                             | parent (ONLY)                            |
| 38 | Calendar              | CalendarMonth           | `/calendar`                              | All 11 roles                             |

---

## Security

- **RBAC**: 11 roles x 89 permission categories
- **Separation of Duties**: Teachers enter marks, Academic Heads verify/approve, Registrar publishes
- **Audit Logging**: All sensitive actions immutably logged
- **Account Lockout**: 5 failed attempts -> 30-min lockout
- **Rate Limiting**: API-wide + auth-specific rate limits
- **MFA**: TOTP-based multi-factor authentication (speakeasy)
- **Data Encryption**: Counseling notes encrypted with AES-256
- **Password Hashing**: PBKDF2 with SHA-512, force change on first login
- **Session Management**: Configurable timeout, refresh token rotation
- **Helmet**: HTTP security headers
- **CORS**: Configurable allowed origins

---

## Separation of Duties

Defined in `server/src/config/permissions.ts`:

| Operation        | Performer(s)                                        |
|------------------|-----------------------------------------------------|
| Grade Entry      | Teacher, Homeroom Teacher                           |
| Grade Verification | Academic Head                                     |
| Grade Approval   | Academic Head, School Director                      |
| Grade Publish    | Registrar                                           |
| Grade Unlock     | School Director                                     |
| Grade View-Only  | School Director (Req 1.7)                           |

### Key Design Principles (per requirements):
- **Req 1.3**: Least privilege -- each role gets minimum permissions needed
- **Req 1.4**: Separation of duties -- Teachers enter marks, Academic Heads verify/approve/publish
- **Req 1.5**: Finance Officer cannot access grades or counseling
- **Req 1.6**: Registrar cannot modify grades
- **Req 1.7**: Director has view-only grades
- **Req 1.8**: System Admin has no academic modification capabilities
- **Req 8.6**: Students/parents see only published grades
- **Req 19.1-19.3**: Counseling notes encrypted, role-restricted access

---

## Environment Variables

Key variables in `server/.env`:

| Variable                | Default                                    | Description                      |
|-------------------------|--------------------------------------------|----------------------------------|
| `PORT`                  | 5002                                       | Server port                      |
| `MONGODB_URI`           | `mongodb://localhost:27017/essms_dev`       | Database connection               |
| `JWT_SECRET`            | (required)                                 | JWT signing secret                |
| `JWT_REFRESH_SECRET`    | (required)                                 | Refresh token secret              |
| `JWT_EXPIRES_IN`        | 15m                                        | Access token expiry               |
| `JWT_REFRESH_EXPIRES_IN`| 7d                                         | Refresh token expiry              |
| `CLIENT_URL`            | `http://localhost:5173`                     | CORS allowed origin               |
| `SMTP_HOST`             | -                                          | Email server host                 |
| `SMTP_PORT`             | 587                                        | Email server port                 |
| `SMTP_USER`             | -                                          | Email username                    |
| `SMTP_PASS`             | -                                          | Email password                    |
| `ENCRYPTION_KEY`        | (required)                                 | AES-256 key for counseling notes  |
| `SESSION_TIMEOUT`       | 30                                         | Session timeout in minutes        |
| `MAX_LOGIN_ATTEMPTS`    | 5                                          | Max failed attempts before lockout|
| `LOCKOUT_DURATION`      | 30                                         | Lockout duration in minutes       |

---

## Scripts

### Root (`package.json`)
| Command             | Description                                  |
|---------------------|----------------------------------------------|
| `npm run dev`       | Start server + client concurrently           |
| `npm run server`    | Start backend only                           |
| `npm run client`    | Start frontend only                          |
| `npm run build`     | Build client + server                        |

### Server (`server/package.json`)
| Command             | Description                                  |
|---------------------|----------------------------------------------|
| `npm run dev`       | Dev mode with ts-node                        |
| `npm run build`     | Compile TypeScript                           |
| `npm start`         | Run compiled production build                |
| `npm run seed`      | Seed full demo data                          |
| `npm test`          | Run tests with Jest                          |
| `npm run lint`      | Lint code                                    |

### Client (`client/package.json`)
| Command             | Description                                  |
|---------------------|----------------------------------------------|
| `npm run dev`       | Vite dev server (port 5173)                  |
| `npm run build`     | Production build                             |
| `npm run preview`   | Preview production build                     |
| `npm run lint`      | Lint code                                    |
| `npm test`          | Run tests with Vitest                        |

---

## License

MIT
