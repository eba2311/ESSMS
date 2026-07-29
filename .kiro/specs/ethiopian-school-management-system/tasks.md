# Implementation Plan: Ethiopian Secondary School Management System

## Overview

This implementation plan breaks down the Ethiopian Secondary School Management System into discrete, manageable tasks following the MERN stack architecture. The implementation follows an incremental approach, building core infrastructure first, then authentication and authorization, followed by feature modules, and finally integration and testing.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - Initialize Node.js/Express backend with TypeScript configuration
  - Set up React frontend with TypeScript and required dependencies
  - Configure MongoDB Atlas connection with Mongoose
  - Set up project structure following three-tier architecture
  - Configure development tools (ESLint, Prettier, nodemon)
  - Set up environment variable management (.env files)
  - _Requirements: 25.1, 25.2_

- [x] 2. Database Schema Implementation
  - [x] 2.1 Create core Mongoose models and schemas
    - Implement User, Student, Teacher, Guardian models with validation
    - Implement Section, Subject, TeacherAssignment models
    - Add indexes for performance optimization (studentId, teacherId, userId unique indexes)
    - _Requirements: 1.1, 4.1, 4.2, 9.1, 12.1_
  
  - [ ]* 2.2 Write property test for unique ID generation
    - **Property 8: Unique Student ID Generation**
    - Test that creating multiple students never produces duplicate IDs
    - _Requirements: 4.1_
  
  - [x] 2.3 Create academic and assessment models
    - Implement Assessment, AssessmentMark, Ranking models
    - Implement Attendance model with compound indexes
    - Add validation rules for grade calculations and mark limits
    - _Requirements: 7.1, 7.2, 5.1, 6.1_

  
  - [ ]* 2.4 Write property tests for data immutability
    - **Property 9: Student Records Are Immutable**
    - Test that deletion operations fail and only status updates are permitted
    - _Requirements: 4.8_
  
  - [x] 2.5 Create finance, library, and communication models
    - Implement FeeStructure, Payment, Book, Borrowing models
    - Implement Announcement, Notification models
    - Add receipt number and payment ID auto-generation
    - _Requirements: 10.1, 10.2, 11.1, 13.1, 13.2_
  
  - [x] 2.6 Create audit and security models
    - Implement AuditLog model with immutable flag
    - Implement CounselingSession, BehavioralReport models with encryption for confidential notes
    - Implement Event, Alumni, Classroom, Timetable models
    - _Requirements: 21.1, 19.1, 17.1, 18.1, 20.1_

- [x] 3. Authentication and Session Management
  - [x] 3.1 Implement password hashing with bcrypt
    - Create password hashing utility with cost factor 10
    - Implement password validation function
    - _Requirements: 2.2, 22.3_
  
  - [ ]* 3.2 Write property test for password security
    - **Property 28: Password Storage Security**
    - Test that stored passwords are bcrypt hashes with cost factor ≥ 10
    - _Requirements: 22.3_
  
  - [x] 3.3 Implement JWT token generation and validation
    - Create JWT utility for token generation with 15-minute expiration
    - Implement token validation middleware
    - Add refresh token mechanism
    - _Requirements: 2.1, 2.8_
  
  - [ ]* 3.4 Write property test for authentication
    - **Property 4: Valid Authentication Produces Valid Token**
    - Test that valid credentials always produce valid JWT with correct payload
    - _Requirements: 2.1_
  
  - [x] 3.5 Implement login endpoint with rate limiting
    - Create POST /api/auth/login endpoint
    - Implement failed attempt tracking and account lockout logic
    - Add 5-attempt lockout with 30-minute duration
    - _Requirements: 2.1, 2.3_
  
  - [ ]* 3.6 Write property test for account lockout
    - **Property 5: Account Lockout After Failed Attempts**
    - Test that 5 consecutive failures lock account for 30 minutes
    - _Requirements: 2.3_
  
  - [x] 3.7 Implement session management
    - Create session timeout middleware (15 minutes inactivity)
    - Implement single session enforcement (terminate on new login)
    - Add logout endpoint with token invalidation
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [x] 3.8 Implement MFA setup and verification
    - Create MFA enrollment endpoint using TOTP
    - Implement MFA verification endpoint
    - Add backup codes generation
    - _Requirements: 2.10_

- [x] 4. Authorization and RBAC Implementation
  - [x] 4.1 Create role and permission definitions
    - Define 11 roles with permission mappings
    - Create permission constants for all features
    - Implement least privilege and separation of duties rules
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [x] 4.2 Implement authorization middleware
    - Create role verification middleware
    - Implement feature access checking
    - Add role-based route protection
    - _Requirements: 1.2_
  
  - [ ]* 4.3 Write property test for RBAC enforcement
    - **Property 1: Role-Based Access Control Enforcement**
    - Test that access is granted iff role has permission
    - _Requirements: 1.2, 28.10_
  
  - [ ]* 4.4 Write property test for separation of duties
    - **Property 3: Separation of Duties for Grade Publication**
    - Test that teachers can enter but not publish, only academic heads can publish
    - _Requirements: 1.4, 8.5_
  
  - [x] 4.5 Implement role change functionality
    - Create PUT /api/users/:id/role endpoint (admin only)
    - Implement immediate permission update logic
    - _Requirements: 1.9_
  
  - [ ]* 4.6 Write property test for role updates
    - **Property 2: Role Permission Updates Are Immediate**
    - Test that role changes immediately apply new permissions
    - _Requirements: 1.9_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 6. Student Lifecycle Management
  - [ ] 6.1 Implement student registration API
    - Create POST /api/students endpoint with validation
    - Implement unique student ID generation
    - Link student to guardian records
    - Add Ethiopian address structure validation
    - _Requirements: 4.1, 4.2, 4.10_
  
  - [ ] 6.2 Implement student profile management
    - Create GET /api/students/:id endpoint
    - Create PUT /api/students/:id endpoint with field validation
    - Implement status transition logic (Active, Transferred, Withdrawn, Graduated)
    - Maintain history of grade and section changes
    - _Requirements: 4.2, 4.3, 4.6, 4.9_
  
  - [ ] 6.3 Implement transfer and withdrawal workflows
    - Create POST /api/students/:id/transfer endpoint
    - Create POST /api/students/:id/withdraw endpoint with reason
    - Generate transfer documents
    - _Requirements: 4.5, 4.6_
  
  - [ ] 6.4 Implement promotion and graduation
    - Create POST /api/students/:id/promote endpoint
    - Implement grade completion check and promotion criteria
    - Create graduation marking for grade 12 students
    - _Requirements: 4.3, 4.4, 4.7_

- [ ] 7. Ethiopian Academic Structure Implementation
  - [ ] 7.1 Create grade and section management
    - Implement Section model with grade and stream fields
    - Create POST /api/sections endpoint
    - Add section naming validation (e.g., "9-A", "11 NS-B")
    - _Requirements: 3.1, 3.2, 3.6, 3.7_
  
  - [ ] 7.2 Implement curriculum assignment logic
    - Create service for automatic subject assignment based on grade and stream
    - Implement grade 9-10 common curriculum assignment
    - Implement grade 11-12 Natural Science curriculum assignment
    - Implement grade 11-12 Social Science curriculum assignment
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ]* 7.3 Write property test for curriculum assignment
    - **Property 6: Grade-Appropriate Curriculum Assignment**
    - Test that correct subjects are assigned based on grade and stream
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 7.4 Implement teacher assignment with conflict detection
    - Create POST /api/teachers/:id/assign endpoint
    - Implement scheduling conflict detection logic
    - Validate teacher qualifications for subject
    - _Requirements: 3.9, 3.10, 9.4_
  
  - [ ]* 7.5 Write property test for schedule conflicts
    - **Property 7: Schedule Conflict Prevention**
    - Test that conflicting assignments are rejected
    - _Requirements: 3.10, 15.4_

- [ ] 8. Assessment and Grade Management
  - [ ] 8.1 Implement assessment creation
    - Create POST /api/assessments endpoint
    - Validate assessment types (Quiz, Assignment, Mid-Term, Final, Continuous, Practical)
    - Restrict creation to assigned teachers only
    - _Requirements: 7.1, 7.2_
  
  - [ ] 8.2 Implement mark entry with validation
    - Create PUT /api/assessments/:id/marks endpoint
    - Validate marks do not exceed total marks
    - Restrict mark entry to assigned teachers
    - _Requirements: 7.3, 7.4_
  
  - [ ]* 8.3 Write property test for mark validation
    - **Property 15: Mark Entry Validation**
    - Test that marks exceeding total are rejected
    - _Requirements: 7.4_
  
  - [ ] 8.4 Implement grade calculation logic
    - Create service for letter grade calculation (A-F scale)
    - Implement GPA calculation (4.0 scale)
    - Calculate subject averages and overall averages
    - _Requirements: 7.5, 7.6, 5.1_
  
  - [ ]* 8.5 Write property tests for grade calculations
    - **Property 16: Letter Grade Calculation**
    - Test correct letter grade for all percentage values
    - **Property 10: Subject Average Calculation Correctness**
    - Test that calculated average equals arithmetic mean
    - _Requirements: 7.5, 5.1_

- [ ] 9. Grade Publication Workflow
  - [ ] 9.1 Implement workflow state transitions
    - Create assessment status management (Draft, Pending Verification, Verified, Approved)
    - Implement POST /api/assessments/:id/verify endpoint (Academic Head only)
    - Implement POST /api/assessments/:id/approve endpoint (Academic Head/Director only)
    - Add audit logging for all status changes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.9_
  
  - [ ] 9.2 Implement visibility controls
    - Create authorization rules based on assessment status
    - Hide non-approved marks from students and guardians
    - Show approved marks to students and guardians
    - _Requirements: 8.6, 8.7_
  
  - [ ]* 9.3 Write property tests for workflow
    - **Property 17: Approved Marks Are Visible**
    - Test visibility rules based on status
    - _Requirements: 8.6, 8.7_
  
  - [ ] 9.4 Implement mark immutability for approved assessments
    - Add modification prevention for approved marks
    - Implement unlock mechanism for School Directors
    - Log all unlock operations in audit trail
    - _Requirements: 8.8_
  
  - [ ]* 9.5 Write property test for immutability
    - **Property 18: Approved Marks Immutability**
    - Test that approved marks cannot be modified without director unlock
    - _Requirements: 8.8_


- [ ] 10. Ranking and Performance System
  - [ ] 10.1 Implement ranking calculation service
    - Create ranking calculation algorithm for section, grade, stream, and school
    - Implement sorting by overall average with tie-breaking rules
    - Calculate total students at each level for rank percentiles
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 10.2 Write property test for ranking correctness
    - **Property 11: Ranking Reflects Performance Order**
    - Test that students are correctly ordered by average
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [ ] 10.3 Implement automatic ranking recalculation
    - Create trigger for ranking updates on mark changes
    - Implement batch recalculation for affected students
    - Add POST /api/assessments/calculate-rankings endpoint
    - _Requirements: 5.7_
  
  - [ ]* 10.4 Write property test for ranking updates
    - **Property 12: Ranking Updates Propagate**
    - Test that mark changes trigger correct ranking recalculation
    - _Requirements: 5.7_
  
  - [ ] 10.5 Implement merit identification
    - Create logic to flag Academic Excellence (≥90%), Honor Students (≥85%)
    - Track highest scores per subject at all levels
    - _Requirements: 5.8, 5.10_

- [ ] 11. Attendance Management System
  - [ ] 11.1 Implement attendance marking
    - Create POST /api/attendance endpoint with status validation
    - Implement section-level attendance sheet interface
    - Restrict marking to assigned teachers for their sections
    - _Requirements: 6.1, 6.2_
  
  - [ ] 11.2 Implement attendance record tracking
    - Create GET /api/attendance/student/:id endpoint
    - Store marking teacher ID with each record
    - _Requirements: 6.3_
  
  - [ ]* 11.3 Write property test for attendance completeness
    - **Property 13: Attendance Record Completeness**
    - Test that all required fields are present
    - _Requirements: 6.3_
  
  - [ ] 11.4 Implement attendance percentage calculation
    - Create service to calculate attendance percentage
    - Identify chronic absentees (attendance < 75%)
    - _Requirements: 6.4, 6.5_
  
  - [ ]* 11.5 Write property test for attendance calculation
    - **Property 14: Attendance Percentage Calculation**
    - Test that percentage equals (present days / total days) × 100
    - _Requirements: 6.4_
  
  - [ ] 11.6 Implement attendance reports and alerts
    - Create GET /api/attendance/reports/summary endpoint
    - Implement 3-consecutive-absence alert generation
    - Generate daily, weekly, monthly attendance reports
    - _Requirements: 6.6, 6.7, 6.9_
  
  - [ ] 11.7 Implement teacher attendance tracking
    - Create teacher check-in/check-out endpoints
    - Track teacher attendance records
    - _Requirements: 6.10_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Teacher Management Module
  - [ ] 13.1 Implement teacher registration
    - Create POST /api/teachers endpoint
    - Generate unique teacher ID
    - Store qualifications and experience
    - _Requirements: 9.1, 9.2_
  
  - [ ] 13.2 Implement teacher assignment management
    - Create teacher-section-subject assignment API
    - Validate teacher qualifications for subjects
    - _Requirements: 9.3, 9.4_
  
  - [ ] 13.3 Implement workload calculation
    - Create GET /api/teachers/:id/workload endpoint
    - Calculate total periods per week
    - Flag overloaded teachers (>30 periods/week)
    - _Requirements: 9.5, 9.6_
  
  - [ ] 13.4 Implement leave management
    - Create teacher leave request API
    - Implement approval workflow
    - Mark teachers as unavailable during approved leave
    - _Requirements: 9.7, 9.8, 9.9_
  
  - [ ] 13.5 Implement teacher performance reporting
    - Generate student pass rates for each teacher
    - Calculate average scores for teacher's sections
    - _Requirements: 9.10_

- [ ] 14. Finance Management Module
  - [ ] 14.1 Implement fee structure configuration
    - Create POST /api/finance/fee-structure endpoint
    - Allow configuration by grade with multiple components
    - _Requirements: 10.1_
  
  - [ ] 14.2 Implement automatic billing generation
    - Create billing record generation on student enrollment
    - Link billing to student's grade fee structure
    - _Requirements: 10.2_
  
  - [ ]* 14.3 Write property test for automatic billing
    - **Property 19: Automatic Billing Generation**
    - Test that enrollment creates billing with correct fee structure
    - _Requirements: 10.2, 10.3_
  
  - [ ] 14.4 Implement payment recording
    - Create POST /api/finance/payment endpoint
    - Generate unique receipt number for each payment
    - Implement digital receipt generation
    - _Requirements: 10.3, 10.4_
  
  - [ ]* 14.5 Write property test for receipt generation
    - **Property 20: Receipt Generation for Payments**
    - Test that every payment generates a unique receipt
    - _Requirements: 10.4_
  
  - [ ] 14.6 Implement outstanding fee calculation
    - Create service to calculate total billed - total paid
    - Flag overdue accounts (>30 days)
    - _Requirements: 10.5, 10.6_
  
  - [ ]* 14.7 Write property test for outstanding calculation
    - **Property 21: Outstanding Fee Calculation**
    - Test that outstanding equals total billed minus total paid
    - _Requirements: 10.5_
  
  - [ ] 14.8 Implement financial reporting
    - Create collection reports API
    - Create outstanding amounts reports
    - Implement expense tracking
    - _Requirements: 10.7, 10.8_
  
  - [ ] 14.9 Implement finance role restrictions
    - Ensure Finance Officers cannot access grade or counseling data
    - Add authorization checks on sensitive endpoints
    - _Requirements: 10.9_


- [ ] 15. Library Management Module
  - [ ] 15.1 Implement book inventory management
    - Create POST /api/library/books endpoint
    - Store ISBN, title, author, category, quantity, available copies
    - Implement book search by title, author, ISBN, category
    - _Requirements: 11.1, 11.2, 11.10_
  
  - [ ] 15.2 Implement borrowing system
    - Create POST /api/library/borrow endpoint
    - Decrement available copies on borrow
    - Prevent borrowing when available copies = 0
    - _Requirements: 11.3, 11.4_
  
  - [ ] 15.3 Implement return and fine calculation
    - Create POST /api/library/return endpoint
    - Increment available copies on return
    - Calculate fine for overdue returns (2 birr/day)
    - _Requirements: 11.5, 11.6_
  
  - [ ]* 15.4 Write property tests for library operations
    - **Property 22: Library Inventory Consistency**
    - Test that available copies ≤ quantity and borrowing/returning updates correctly
    - **Property 23: Fine Calculation for Overdue Books**
    - Test that fine = 2 × days overdue
    - _Requirements: 11.4, 11.5, 11.6_
  
  - [ ] 15.5 Implement borrowing restrictions
    - Prevent borrowing with outstanding fines
    - Track borrowing history
    - _Requirements: 11.7_
  
  - [ ] 15.6 Implement library reports
    - Create most-borrowed books report
    - Generate borrowing trends analytics
    - Implement inventory alerts for low stock
    - _Requirements: 11.8, 11.9_

- [ ] 16. Parent and Guardian Portal
  - [ ] 16.1 Implement guardian registration and linking
    - Create POST /api/guardians endpoint
    - Link guardian accounts to student children
    - _Requirements: 12.1_
  
  - [ ] 16.2 Implement guardian data access controls
    - Restrict guardians to viewing only linked children's data
    - Implement data isolation checks
    - _Requirements: 12.2, 12.10_
  
  - [ ] 16.3 Implement guardian views
    - Create endpoints for viewing child's attendance
    - Create endpoints for viewing child's grades (approved only)
    - Create endpoints for viewing child's rankings and performance
    - Create endpoints for viewing fee statements
    - _Requirements: 12.3, 12.4, 12.5, 12.6_
  
  - [ ] 16.4 Implement guardian notifications
    - Display announcements to guardians
    - Send absence alerts for 3 consecutive days
    - Send grade publication notifications
    - _Requirements: 12.7, 12.8, 12.9_

- [ ] 17. Communication and Notification System
  - [ ] 17.1 Implement announcement management
    - Create POST /api/communication/announcements endpoint
    - Implement target audience filtering
    - Display announcements based on user role and grade
    - _Requirements: 13.1, 13.2_
  
  - [ ] 17.2 Implement email notification service
    - Set up Nodemailer with SMTP configuration
    - Create email templates for different notification types
    - Implement sending for grade publication, fee reminders, attendance alerts
    - _Requirements: 13.3_
  
  - [ ] 17.3 Implement SMS notification service (optional)
    - Set up SMS gateway integration
    - Implement SMS sending for critical alerts
    - _Requirements: 13.4_
  
  - [ ] 17.4 Implement automatic notification triggers
    - Create trigger for 3-consecutive-absence alert
    - Create trigger for low performance alert (<60% average)
    - Create trigger for overdue fee reminders (7 days)
    - Create trigger for assessment scheduled notifications (7 days before)
    - _Requirements: 13.5, 13.6, 13.7, 13.8_
  
  - [ ] 17.5 Implement teacher-guardian messaging
    - Create POST /api/communication/messages endpoint
    - Allow teachers to message guardians of students in their sections
    - _Requirements: 13.9_
  
  - [ ] 17.6 Implement notification logging
    - Log all sent notifications with delivery status
    - Track read/unread status for in-app notifications
    - _Requirements: 13.10_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Document and Certificate Management
  - [ ] 19.1 Implement transcript generation
    - Create GET /api/students/:id/transcript endpoint
    - Include all subject grades, GPA, attendance
    - Apply digital signature
    - _Requirements: 14.1, 14.2_
  
  - [ ]* 19.2 Write property test for transcript completeness
    - **Property 24: Transcript Completeness**
    - Test that transcripts contain all required fields
    - _Requirements: 14.2_
  
  - [ ] 19.3 Implement certificate generation
    - Create enrollment certificate generator
    - Create graduation certificate generator
    - Create recommendation letter generator
    - _Requirements: 14.3, 14.4, 14.5_
  
  - [ ] 19.4 Implement report card generation
    - Create term report card with grades, rank, attendance
    - Include subject-wise performance
    - _Requirements: 14.6_
  
  - [ ] 19.5 Implement document storage and retrieval
    - Store generated documents with timestamps
    - Prevent unauthorized modifications
    - Allow PDF download
    - Log all document generation
    - _Requirements: 14.7, 14.8, 14.9, 14.10_

- [ ] 20. Academic Management Information System (AMIS)
  - [ ] 20.1 Implement curriculum management
    - Create curriculum definition API with subjects and credit hours
    - Allow Academic Heads to modify curriculum
    - _Requirements: 15.1_
  
  - [ ] 20.2 Implement class period configuration
    - Create period definition with start/end times
    - _Requirements: 15.2_
  
  - [ ] 20.3 Implement timetable generation
    - Create automated timetable generation algorithm
    - Assign teachers to sections based on qualifications
    - Detect and prevent teacher double-booking
    - Detect and prevent section double-booking
    - _Requirements: 15.3, 15.4, 15.5_
  
  - [ ] 20.4 Implement manual timetable adjustments
    - Allow manual modifications to generated timetables
    - Revalidate conflicts after changes
    - _Requirements: 15.6_
  
  - [ ] 20.5 Implement examination scheduling
    - Create examination schedule management
    - Prevent conflicts for same section
    - Assign invigilators
    - _Requirements: 15.7, 15.8_
  
  - [ ] 20.6 Implement promotion eligibility calculation
    - Create service to determine eligibility (average ≥50%, attendance ≥75%)
    - _Requirements: 15.9_
  
  - [ ]* 20.7 Write property test for promotion eligibility
    - **Property 25: Promotion Eligibility Rules**
    - Test that eligibility = (average ≥50% AND attendance ≥75%)
    - _Requirements: 15.9_
  
  - [ ] 20.8 Implement academic analytics
    - Generate pass rates, average scores by section and grade
    - Create performance trend analytics
    - _Requirements: 15.10_


- [ ] 21. Management Information System (MIS) Dashboard
  - [ ] 21.1 Implement KPI calculation services
    - Calculate total enrolled students count
    - Calculate total active teachers count
    - Calculate school-wide attendance rate
    - Calculate pass rate (average ≥50%)
    - Calculate fee collection rate
    - Calculate student-teacher ratio
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ] 21.2 Implement trend analytics
    - Create enrollment trends over 5 years
    - Create performance trends by grade
    - Create financial performance trends (monthly revenue/expenses)
    - _Requirements: 16.7, 16.8, 16.9_
  
  - [ ]* 21.3 Write property test for trend calculations
    - **Property 26: Enrollment Trend Data Accuracy** (if trend calculation is complex enough)
    - Test that trend data calculations are mathematically correct
    - _Requirements: 16.7_
  
  - [ ] 21.4 Implement real-time dashboard updates
    - Add WebSocket connection for live KPI updates
    - Trigger dashboard refresh on data changes
    - _Requirements: 16.10_

- [ ] 22. School Resource Management
  - [ ] 22.1 Implement classroom management
    - Create POST /api/resources/classrooms endpoint
    - Store room details, capacity, type, facilities
    - _Requirements: 17.1_
  
  - [ ] 22.2 Implement classroom allocation
    - Create allocation API with conflict detection
    - Prevent double-booking
    - _Requirements: 17.2, 17.3_
  
  - [ ] 22.3 Implement laboratory and equipment inventory
    - Create lab and equipment tracking
    - Track condition status
    - _Requirements: 17.4, 17.5_
  
  - [ ] 22.4 Implement maintenance scheduling
    - Create maintenance schedule API
    - Mark equipment unavailable during maintenance
    - Send alerts for due maintenance
    - _Requirements: 17.6, 17.7, 17.10_
  
  - [ ] 22.5 Implement resource utilization reports
    - Generate classroom occupancy reports
    - Generate equipment inventory reports
    - _Requirements: 17.8, 17.9_

- [ ] 23. School Calendar and Event Management
  - [ ] 23.1 Implement academic calendar management
    - Create POST /api/calendar/academic-calendar endpoint
    - Store term dates and holidays
    - _Requirements: 18.1_
  
  - [ ] 23.2 Implement event scheduling
    - Create POST /api/calendar/events endpoint
    - Display events on user dashboards by role
    - _Requirements: 18.2, 18.3_
  
  - [ ] 23.3 Implement meeting scheduling
    - Create parent-teacher meeting scheduler
    - Send notifications to participants
    - _Requirements: 18.4, 18.5_
  
  - [ ] 23.4 Implement holiday management
    - Manage public holidays and non-school days
    - Prevent assessment scheduling on holidays
    - _Requirements: 18.6, 18.7_
  
  - [ ] 23.5 Implement examination calendar
    - Display examination schedule by grade
    - Allow calendar export
    - _Requirements: 18.8, 18.9_
  
  - [ ] 23.6 Implement event reminders
    - Send reminder notifications 3 days before events
    - _Requirements: 18.10_

- [ ] 24. Guidance and Counseling Module
  - [ ] 24.1 Implement counseling session management
    - Create POST /api/counseling/sessions endpoint
    - Encrypt confidential notes before storage
    - Restrict access to counselors and school directors only
    - _Requirements: 19.1, 19.2, 19.10_
  
  - [ ] 24.2 Implement access restrictions
    - Prevent teachers and finance officers from viewing counseling records
    - _Requirements: 19.3_
  
  - [ ] 24.3 Implement behavioral reporting
    - Create POST /api/counseling/behavioral-reports endpoint
    - Link to student records while maintaining counseling note confidentiality
    - Allow homeroom teachers to view behavioral reports
    - _Requirements: 19.4, 19.5, 19.6_
  
  - [ ] 24.4 Implement counseling analytics
    - Generate behavioral trend reports
    - _Requirements: 19.7_
  
  - [ ] 24.5 Implement follow-up scheduling
    - Create follow-up session scheduler with reminders
    - Track student referrals
    - _Requirements: 19.8, 19.9_

- [ ] 25. Alumni Management Module
  - [ ] 25.1 Implement automatic alumni record creation
    - Create alumni record on student graduation
    - Store graduation year, stream, final GPA, rank
    - _Requirements: 20.1_
  
  - [ ] 25.2 Implement alumni profile updates
    - Allow alumni to update employment and education info
    - _Requirements: 20.2_
  
  - [ ] 25.3 Implement alumni directory
    - Create searchable directory by graduation year, stream, name
    - Implement visibility preferences (Public, Alumni Only, Private)
    - _Requirements: 20.3, 20.7_
  
  - [ ] 25.4 Implement alumni tracking
    - Track employment status and occupation
    - Generate employment and higher education statistics
    - _Requirements: 20.4, 20.6_
  
  - [ ] 25.5 Implement alumni communication
    - Allow administrators to send announcements to alumni
    - _Requirements: 20.5_
  
  - [ ] 25.6 Implement alumni data protection
    - Prevent deletion of alumni records
    - Link to original student records
    - _Requirements: 20.8, 20.9_
  
  - [ ] 25.7 Implement Ministry of Education alumni reports
    - Generate graduate tracking reports
    - _Requirements: 20.10_

- [ ] 26. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 27. Audit Logging and Security
  - [ ] 27.1 Implement immutable audit logging
    - Create audit log service with immutable flag
    - Log all authentication attempts with IP and outcome
    - _Requirements: 21.1_
  
  - [ ] 27.2 Implement comprehensive activity logging
    - Log grade modifications with old/new values
    - Log attendance changes
    - Log financial transactions
    - Log role/permission changes
    - Log access denials
    - _Requirements: 21.2, 21.3, 21.4, 21.5, 21.6_
  
  - [ ]* 27.3 Write property tests for audit logging
    - **Property 26: Grade Modification Audit Logging**
    - Test that all grade changes create audit entries
    - **Property 27: Audit Log Immutability**
    - Test that audit logs cannot be modified or deleted
    - _Requirements: 21.2, 21.7_
  
  - [ ] 27.4 Implement audit log search and filtering
    - Create GET /api/audit-logs endpoint with filters
    - Allow filtering by user, date range, activity type
    - _Requirements: 21.8_
  
  - [ ] 27.5 Implement audit reports
    - Generate user activity reports
    - _Requirements: 21.9_
  
  - [ ] 27.6 Implement audit log retention
    - Configure 7-year retention policy
    - _Requirements: 21.10_

- [ ] 28. Data Protection and Encryption
  - [ ] 28.1 Configure HTTPS and TLS
    - Set up TLS 1.2+ for all communication
    - Enforce HTTPS redirects
    - _Requirements: 22.1, 22.2_
  
  - [ ] 28.2 Implement sensitive data encryption
    - Encrypt counseling session notes
    - Encrypt financial transaction data
    - Mask sensitive data in logs
    - _Requirements: 22.4, 22.5, 22.9_
  
  - [ ] 28.3 Implement encrypted database backups
    - Configure automatic backup encryption
    - _Requirements: 22.6_
  
  - [ ] 28.4 Implement data classification system
    - Tag data with classification levels
    - Apply access controls based on classification
    - _Requirements: 22.7, 22.8_
  
  - [ ] 28.5 Implement secure file cleanup
    - Securely delete temporary files after processing
    - _Requirements: 22.10_

- [ ] 29. Time-Based and Location-Based Access Controls
  - [ ] 29.1 Implement assessment period restrictions
    - Configure assessment periods
    - Restrict grade entry to assessment periods only
    - _Requirements: 23.1, 23.2_
  
  - [ ] 29.2 Implement role-based access hours
    - Configure access hours for different roles
    - Implement time-based access checks
    - _Requirements: 23.3, 23.8_
  
  - [ ] 29.3 Implement IP whitelist for admin access
    - Configure IP address whitelists
    - Require additional verification for non-whitelisted IPs
    - Log all non-whitelisted access attempts
    - _Requirements: 23.4, 23.5, 23.6_
  
  - [ ] 29.4 Implement business hours restrictions
    - Restrict financial transactions to business hours
    - _Requirements: 23.7_
  
  - [ ] 29.5 Implement emergency override mechanism
    - Allow School Director override with audit trail
    - _Requirements: 23.9_
  
  - [ ] 29.6 Implement timezone display
    - Display timezone information for all timestamps
    - _Requirements: 23.10_

- [ ] 30. Ministry of Education Reporting
  - [ ] 30.1 Implement enrollment reports
    - Generate annual enrollment by grade, section, stream
    - _Requirements: 24.1_
  
  - [ ] 30.2 Implement examination results reports
    - Generate pass rates, average scores, grade distribution
    - _Requirements: 24.2_
  
  - [ ] 30.3 Implement teacher qualification reports
    - Generate credentials, subjects taught, years of experience
    - _Requirements: 24.3_
  
  - [ ] 30.4 Implement attendance reports
    - Generate average attendance by grade and overall
    - _Requirements: 24.4_
  
  - [ ] 30.5 Implement graduation reports
    - Generate graduates by stream and destination
    - _Requirements: 24.5_
  
  - [ ] 30.6 Implement infrastructure reports
    - Generate classroom count, lab facilities, equipment inventory
    - _Requirements: 24.6_
  
  - [ ] 30.7 Implement report export functionality
    - Export reports in Ministry-required formats
    - Implement automatic report scheduling
    - Validate report completeness before generation
    - Log all report generation activities
    - _Requirements: 24.7, 24.8, 24.10, 24.9_

- [ ] 31. System Performance Optimization
  - [ ] 31.1 Implement database indexing
    - Create indexes on frequently queried fields
    - Implement compound indexes for common query patterns
    - _Requirements: 25.5_
  
  - [ ] 31.2 Implement pagination
    - Add pagination to all list endpoints (50 records per page)
    - _Requirements: 25.6_
  
  - [ ] 31.3 Implement caching
    - Cache user permissions and system configuration
    - Implement cache invalidation strategies
    - _Requirements: 25.7_
  
  - [ ] 31.4 Implement query optimization
    - Log slow queries (>1 second)
    - Optimize expensive queries
    - _Requirements: 25.8_
  
  - [ ] 31.5 Implement lazy loading
    - Implement lazy loading for images and documents
    - _Requirements: 25.9_
  
  - [ ] 31.6 Implement response compression
    - Compress API responses
    - _Requirements: 25.10_

- [ ] 32. Backup and Disaster Recovery
  - [ ] 32.1 Implement automated backup system
    - Configure daily automated backups
    - Implement backup retention policy (30 days daily, 1 year monthly)
    - Store backups in geographically separate location
    - _Requirements: 26.1, 26.2, 26.3_
  
  - [ ] 32.2 Implement backup verification
    - Verify backup integrity after creation
    - _Requirements: 26.4_
  
  - [ ] 32.3 Implement backup encryption
    - Encrypt all backup files
    - _Requirements: 26.5_
  
  - [ ] 32.4 Document disaster recovery procedures
    - Create disaster recovery plan document
    - Document RTO (4 hours) and RPO (24 hours)
    - _Requirements: 26.6, 26.10_
  
  - [ ] 32.5 Implement manual backup
    - Allow administrators to initiate manual backups
    - _Requirements: 26.7_
  
  - [ ] 32.6 Implement backup testing
    - Schedule quarterly backup restoration tests
    - _Requirements: 26.8_
  
  - [ ] 32.7 Implement backup failure alerts
    - Send immediate alerts on backup failures
    - _Requirements: 26.9_


- [ ] 33. Frontend UI Implementation
  - [ ] 33.1 Set up React application structure
    - Initialize React with TypeScript
    - Configure React Router for navigation
    - Set up Redux Toolkit or Context API for state management
    - Install Material UI and Tailwind CSS
    - _Requirements: 27.2_
  
  - [ ] 33.2 Implement authentication UI components
    - Create LoginForm component with validation
    - Create MFAVerification component
    - Create PasswordReset component
    - Create SessionTimeout component
    - _Requirements: 2.1, 2.10_
  
  - [ ] 33.3 Implement responsive layout
    - Create Sidebar navigation with role-based menu items
    - Implement collapsible menu for mobile
    - Implement breadcrumb navigation
    - _Requirements: 27.1, 27.3, 27.10_
  
  - [ ] 33.4 Implement form validation
    - Create FormField component with real-time validation
    - Display user-friendly error messages
    - _Requirements: 27.4, 27.5_
  
  - [ ] 33.5 Implement accessibility features
    - Support keyboard navigation
    - Implement high contrast mode
    - Use descriptive labels
    - _Requirements: 27.6, 27.7, 27.8_
  
  - [ ] 33.6 Implement loading and error states
    - Create LoadingSpinner component
    - Implement ErrorBoundary component
    - _Requirements: 27.9_

- [ ] 34. Dashboard and Analytics UI
  - [ ] 34.1 Implement role-specific dashboards
    - Create AdminDashboard with KPI widgets
    - Create TeacherDashboard
    - Create StudentDashboard
    - Create ParentDashboard
    - _Requirements: 16.1-16.10, 28.1_
  
  - [ ] 34.2 Implement KPI widgets
    - Create reusable KPIWidget component
    - Display real-time metrics
    - _Requirements: 16.1-16.6_
  
  - [ ] 34.3 Implement analytics charts
    - Create PerformanceChart component using Recharts
    - Display enrollment trends
    - Display performance trends
    - Display financial trends
    - _Requirements: 16.7, 16.8, 16.9_

- [ ] 35. Student and Academic Management UI
  - [ ] 35.1 Implement student management components
    - Create StudentList with filtering and pagination
    - Create StudentForm for registration and editing
    - Create StudentProfile with tabbed interface
    - Create StudentTransfer component
    - Create PromotionManager component
    - _Requirements: 4.1-4.10_
  
  - [ ] 35.2 Implement grade entry and reporting UI
    - Create GradeEntry component
    - Create ReportCard component
    - Create Transcript component
    - Create RankingDisplay component
    - _Requirements: 7.1-7.10, 5.1-5.10_
  
  - [ ] 35.3 Implement attendance UI
    - Create AttendanceSheet grid component
    - Create AttendanceReport component
    - Create AttendanceAlerts component
    - _Requirements: 6.1-6.10_

- [ ] 36. Finance and Library UI
  - [ ] 36.1 Implement finance management UI
    - Create FeeStructure component
    - Create PaymentRecording component
    - Create Receipt component
    - Create FinanceReports component
    - _Requirements: 10.1-10.10_
  
  - [ ] 36.2 Implement library management UI
    - Create book catalog interface
    - Create borrowing interface
    - Create return and fine calculation interface
    - _Requirements: 11.1-11.10_

- [ ] 37. Communication and Student Portal UI
  - [ ] 37.1 Implement communication components
    - Create AnnouncementBoard component
    - Create NotificationCenter component
    - Create MessageComposer component
    - _Requirements: 13.1-13.10_
  
  - [ ] 37.2 Implement student self-service portal
    - Create student dashboard showing attendance, GPA, grades
    - Display student rankings
    - Show class timetable
    - Display upcoming assessments
    - Allow download of report cards and transcripts
    - _Requirements: 28.1-28.9_
  
  - [ ]* 37.3 Write property test for student data isolation
    - Test that students cannot access other students' data (covered by Property 1)
    - _Requirements: 28.10_

- [ ] 38. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 39. Integration and Wiring
  - [ ] 39.1 Connect frontend to backend APIs
    - Implement Axios HTTP client with interceptors
    - Add authentication token to all requests
    - Implement error handling and retry logic
    - _Requirements: All_
  
  - [ ] 39.2 Implement real-time features
    - Set up Socket.io client connection
    - Implement real-time notifications
    - Implement real-time dashboard updates
    - _Requirements: 13.10, 16.10_
  
  - [ ] 39.3 Implement route protection
    - Add authentication guards to routes
    - Add role-based route protection
    - Redirect unauthorized users
    - _Requirements: 1.2_
  
  - [ ] 39.4 Implement error toast notifications
    - Create global error notification system
    - Display user-friendly error messages
    - _Requirements: 27.4_

- [ ] 40. End-to-End Integration Testing
  - [ ]* 40.1 Test complete user workflows
    - Test student enrollment → billing → grade entry → report generation workflow
    - Test assessment workflow: create → enter marks → verify → approve → publish
    - Test payment workflow: billing → payment → receipt
    - _Requirements: Multiple_
  
  - [ ]* 40.2 Test authorization across all endpoints
    - Verify all role-based access controls work correctly
    - Test separation of duties enforcement
    - _Requirements: 1.1-1.10_

- [ ] 41. Final Checkpoint - Comprehensive Testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 42. Deployment Preparation
  - [ ] 42.1 Configure production environment
    - Set up MongoDB Atlas production cluster
    - Configure environment variables for production
    - Set up HTTPS certificates
    - _Requirements: 22.1, 22.2_
  
  - [ ] 42.2 Deploy backend to hosting platform
    - Deploy to Render or Railway
    - Configure health check endpoints
    - Set up monitoring and logging
    - _Requirements: 25.1, 25.2_
  
  - [ ] 42.3 Deploy frontend to hosting platform
    - Build production React application
    - Deploy to Vercel or Netlify
    - Configure API endpoint URLs
    - _Requirements: 27.1_
  
  - [ ] 42.4 Configure automated backups
    - Set up MongoDB Atlas automated backups
    - Configure backup schedule and retention
    - _Requirements: 26.1, 26.2_
  
  - [ ] 42.5 Perform smoke testing
    - Test critical workflows in production
    - Verify all services are running
    - Test authentication and authorization
    - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at reasonable intervals
- Property tests validate universal correctness properties with minimum 100 iterations each
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: infrastructure → authentication → features → integration
- All correctness properties from the design document are covered by property test tasks
