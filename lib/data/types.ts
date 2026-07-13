export type EntityStatus =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "graduated"

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

export interface ContactPerson {
  name: string
  phone: string
  email?: string
  occupation?: string
}

export interface StudentDocument {
  id: string
  name: string
  type: string
  url: string
  uploadedDate: string
  verified: boolean
}

// ---------------------------------------------------------------------------
// Academics: classes, sections, subjects
// ---------------------------------------------------------------------------

export interface SchoolClass {
  id: string
  name: string
  academicYear: string
}

export interface ClassSection {
  id: string
  classId: string
  className: string
  section: string
  classTeacherId?: string
  roomNo: string
  capacity: number
}

export interface Subject {
  id: string
  name: string
  code: string
  type: "core" | "elective" | "extra_curricular"
  applicableClassIds: string[]
  teacherIds: string[]
  periodsPerWeek: number
  status: EntityStatus
}

export interface TimetableSlot {
  id: string
  classSectionId: string
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"
  period: number
  subjectId: string
  teacherId: string
  roomNo: string
  startTime: string
  endTime: string
}

export interface Assignment {
  id: string
  title: string
  type: "homework" | "assignment" | "project"
  classSectionId: string
  subjectId: string
  teacherId: string
  assignedDate: string
  dueDate: string
  description: string
  submittedCount: number
  totalStudents: number
  status: "open" | "closed"
}

export interface LessonPlan {
  id: string
  subjectId: string
  classSectionId: string
  teacherId: string
  topic: string
  weekRange: string
  objectives: string
  status: "planned" | "in_progress" | "completed"
}

export interface StudyMaterial {
  id: string
  title: string
  subjectId: string
  classSectionId: string
  uploadedBy: string
  uploadDate: string
  fileType: "pdf" | "doc" | "ppt" | "video" | "link"
  fileSizeKb: number
  downloadCount: number
}

// ---------------------------------------------------------------------------
// Student / Teacher
// ---------------------------------------------------------------------------

export interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  photoUrl?: string
  dob: string
  gender: "male" | "female" | "other"
  bloodGroup: string
  classSectionId: string
  rollNo: number
  admissionDate: string
  status: EntityStatus
  address: Address
  phone: string
  email: string
  father: ContactPerson
  mother: ContactPerson
  guardian?: ContactPerson & { relation: string }
  emergencyContact: string
  medical: {
    allergies: string[]
    chronicConditions: string[]
    medications: string[]
    doctorName: string
    doctorPhone: string
    lastCheckupDate: string
    vaccinationStatus: "complete" | "partial" | "none"
    heightCm: number
    weightKg: number
  }
  documents: StudentDocument[]
  previousSchool?: string
  house?: string
  busRouteId?: string
}

export interface AssignedClass {
  classSectionId: string
  subjectId: string
  role: "class_teacher" | "subject_teacher"
}

export interface TeacherLeaveEntry {
  id: string
  type: "sick" | "casual" | "earned" | "maternity" | "paternity" | "unpaid"
  fromDate: string
  toDate: string
  days: number
  reason: string
  status: "pending" | "approved" | "rejected"
  appliedOn: string
  approvedBy?: string
}

export interface Teacher {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  photoUrl?: string
  dob: string
  gender: "male" | "female" | "other"
  joinDate: string
  designation: string
  department: string
  qualifications: string[]
  experienceYears: number
  subjectIds: string[]
  assignedClasses: AssignedClass[]
  address: Address
  phone: string
  email: string
  emergencyContact: string
  salary: {
    basic: number
    allowances: number
    deductions: number
    netSalary: number
    bankAccountMasked: string
    payGrade: string
    lastPaidDate: string
  }
  leaveHistory: TeacherLeaveEntry[]
  leaveBalance: number
  documents: StudentDocument[]
  status: EntityStatus
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export type AttendanceStatus = "present" | "absent" | "late" | "leave" | "half_day"

export interface AttendanceRecord {
  id: string
  personId: string
  personType: "student" | "staff"
  classSectionId?: string
  date: string
  status: AttendanceStatus
  markedBy: string
  markedAt: string
  remarks?: string
}

// ---------------------------------------------------------------------------
// Examination
// ---------------------------------------------------------------------------

export type ExamStatus = "draft" | "scheduled" | "ongoing" | "completed" | "published"

export interface Exam {
  id: string
  name: string
  term: string
  academicYear: string
  classSectionIds: string[]
  startDate: string
  endDate: string
  status: ExamStatus
}

export interface ExamSubject {
  id: string
  examId: string
  classSectionId: string
  subjectId: string
  examDate: string
  startTime: string
  durationMinutes: number
  maxMarks: number
  passMarks: number
}

export interface Mark {
  id: string
  examId: string
  subjectId: string
  studentId: string
  marksObtained: number
  isAbsent: boolean
  remarks?: string
}

export interface GradeScale {
  id: string
  label: string
  minPercent: number
  maxPercent: number
  remark: string
}

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

export type FeeStatus = "paid" | "pending" | "overdue" | "partial"
export type PaymentMode = "cash" | "card" | "upi" | "bank_transfer" | "cheque"

export interface FeeCategory {
  id: string
  name: string
  frequency: "one_time" | "monthly" | "quarterly" | "annual"
  defaultAmount: number
  applicableClassIds: string[]
}

export interface FeeInstallment {
  id: string
  categoryId: string
  classSectionId: string
  academicYear: string
  label: string
  dueDate: string
  amount: number
}

export interface FeeTransactionItem {
  categoryId: string
  label: string
  amount: number
}

export interface FeeTransaction {
  id: string
  receiptNo: string
  studentId: string
  items: FeeTransactionItem[]
  totalAmount: number
  discount: number
  fine: number
  paidAmount: number
  balance: number
  mode?: PaymentMode
  status: FeeStatus
  dueDate: string
  transactionDate?: string
  collectedBy?: string
  academicYear: string
}

// ---------------------------------------------------------------------------
// Notifications & Calendar
// ---------------------------------------------------------------------------

export type NotificationType =
  | "fee_due"
  | "birthday"
  | "leave_request"
  | "new_admission"
  | "exam_reminder"
  | "parent_message"
  | "system_alert"
  | "announcement"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  actionable: boolean
  relatedEntityId?: string
  severity: "info" | "warning" | "critical"
}

export type CalendarEventType =
  | "holiday"
  | "exam"
  | "event"
  | "meeting"
  | "fee_due"
  | "birthday"
  | "academic"

export interface CalendarEvent {
  id: string
  title: string
  type: CalendarEventType
  date: string
  endDate?: string
  allDay: boolean
  description?: string
  audience: string
  createdBy?: string
}

// ---------------------------------------------------------------------------
// Admissions / Campus Operations
// ---------------------------------------------------------------------------

export type AdmissionStage =
  | "inquiry"
  | "application"
  | "interview"
  | "offer"
  | "enrolled"
  | "rejected"

export interface AdmissionLead {
  id: string
  applicantName: string
  dob: string
  gender: "male" | "female" | "other"
  applyingForClass: string
  parentName: string
  parentPhone: string
  parentEmail: string
  source: "website" | "referral" | "walk_in" | "social_media" | "event"
  stage: AdmissionStage
  assignedTo?: string
  interviewDate?: string
  notes?: string
  createdDate: string
  lastActivityDate: string
}

export interface MaintenanceLog {
  id: string
  vehicleId: string
  date: string
  odometer: number
  fuelLiters: number
  cost: number
  note: string
}

export interface RouteStop {
  name: string
  sequence: number
  pickupTime: string
  dropTime: string
  studentsCount: number
}

export interface TransportRoute {
  id: string
  name: string
  vehicleId?: string
  stops: RouteStop[]
  totalDistanceKm: number
  status: EntityStatus
}

export interface Vehicle {
  id: string
  regNo: string
  type: "bus" | "van" | "car"
  capacity: number
  driverName: string
  driverPhone: string
  driverLicenseNo: string
  status: EntityStatus
  routeId?: string
  lastServiceDate: string
  nextServiceDue: string
  fuelType: "diesel" | "petrol" | "cng" | "electric"
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: number
  availableCopies: number
  status: EntityStatus
  shelfLocation: string
}

export interface BookIssue {
  id: string
  bookId: string
  borrowerId: string
  borrowerType: "student" | "staff"
  issueDate: string
  dueDate: string
  returnDate?: string
  status: "issued" | "returned" | "overdue"
  fineAmount: number
}

export interface SchoolEvent {
  id: string
  title: string
  type: "cultural" | "sports" | "academic" | "meeting" | "holiday_celebration"
  date: string
  startTime: string
  endTime: string
  venue: string
  audience: string
  organizerId?: string
  description?: string
  status: "scheduled" | "cancelled" | "completed"
}

export interface Announcement {
  id: string
  title: string
  type: "announcement" | "circular" | "newsletter"
  audience: string[]
  body: string
  authorId?: string
  createdDate: string
  publishDate: string
  status: "draft" | "scheduled" | "published" | "archived"
}

// ---------------------------------------------------------------------------
// Administration: HRMS, Users & Roles, Audit
// ---------------------------------------------------------------------------

export interface StaffMember {
  id: string
  name: string
  photoUrl?: string
  employeeId: string
  designation: string
  department: string
  joinDate: string
  phone: string
  email: string
  employmentType: "full_time" | "part_time" | "contract"
  status: EntityStatus
  reportingManager?: string
}

export interface LeaveRequest {
  id: string
  staffId: string
  staffName: string
  role: string
  leaveType: "sick" | "casual" | "earned" | "maternity" | "paternity" | "unpaid"
  fromDate: string
  toDate: string
  daysCount: number
  reason: string
  status: "pending" | "approved" | "rejected"
  appliedDate: string
  approvedBy?: string
  approvedDate?: string
}

export interface PayrollRecord {
  id: string
  staffId: string
  staffName: string
  period: string
  basicSalary: number
  allowances: number
  deductions: number
  netPay: number
  status: "pending" | "processed" | "paid"
  paymentDate?: string
  paymentMode?: PaymentMode
}

export interface JobOpening {
  id: string
  title: string
  department: string
  openings: number
  status: "open" | "closed" | "on_hold"
  postedDate: string
}

export interface Candidate {
  id: string
  name: string
  jobId: string
  stage: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected"
  appliedDate: string
  interviewDate?: string
  rating?: number
}

export interface AppUser {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  status: "active" | "invited" | "suspended"
  lastLogin?: string
  createdDate: string
}

export interface AuditLogEntry {
  id: string
  actorId: string
  actorName: string
  actorRole: string
  action: "create" | "update" | "delete" | "login" | "export" | "permission_change"
  module: string
  entityType: string
  entityId?: string
  description: string
  timestamp: string
  ipAddress: string
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SchoolProfile {
  name: string
  logoUrl?: string
  address: string
  phone: string
  email: string
  code: string
  establishedYear: number
  principalName: string
}

export interface AcademicTerm {
  id: string
  name: string
  startDate: string
  endDate: string
}

export interface AcademicSession {
  year: string
  startDate: string
  endDate: string
  terms: AcademicTerm[]
}
