"use client"

import { createEntityContext } from "./create-entity-context"
import { createValueContext } from "./create-value-context"
import { SEED_DATA } from "@/lib/data/seed/generate"
import type {
  AcademicSession,
  AdmissionLead,
  Announcement,
  AppUser,
  Assignment,
  AttendanceRecord,
  AuditLogEntry,
  Book,
  BookIssue,
  Candidate,
  CalendarEvent,
  ClassSection,
  Exam,
  ExamSubject,
  FeeCategory,
  FeeInstallment,
  FeeTransaction,
  GradeScale,
  JobOpening,
  LeaveRequest,
  LessonPlan,
  MaintenanceLog,
  Mark,
  Notification,
  PayrollRecord,
  SchoolClass,
  SchoolEvent,
  SchoolProfile,
  Student,
  StudyMaterial,
  Subject,
  StaffMember,
  Teacher,
  TimetableSlot,
  TransportRoute,
  Vehicle,
} from "@/lib/data/types"

const KEY = (name: string) => `mycampus360:${name}`

export const classesStore = createEntityContext<SchoolClass>(KEY("classes"), SEED_DATA.classes)
export const classSectionsStore = createEntityContext<ClassSection>(KEY("class-sections"), SEED_DATA.classSections)
export const subjectsStore = createEntityContext<Subject>(KEY("subjects"), SEED_DATA.subjects)
export const timetableStore = createEntityContext<TimetableSlot>(KEY("timetable"), SEED_DATA.timetableSlots)
export const assignmentsStore = createEntityContext<Assignment>(KEY("assignments"), SEED_DATA.assignments)
export const lessonPlansStore = createEntityContext<LessonPlan>(KEY("lesson-plans"), SEED_DATA.lessonPlans)
export const studyMaterialsStore = createEntityContext<StudyMaterial>(KEY("study-materials"), SEED_DATA.studyMaterials)

export const studentsStore = createEntityContext<Student>(KEY("students"), SEED_DATA.students)
export const teachersStore = createEntityContext<Teacher>(KEY("teachers"), SEED_DATA.teachers)
export const attendanceStore = createEntityContext<AttendanceRecord>(KEY("attendance"), SEED_DATA.attendanceRecords)

export const examsStore = createEntityContext<Exam>(KEY("exams"), SEED_DATA.exams)
export const examSubjectsStore = createEntityContext<ExamSubject>(KEY("exam-subjects"), SEED_DATA.examSubjects)
export const marksStore = createEntityContext<Mark>(KEY("marks"), SEED_DATA.marks)
export const gradeScaleStore = createEntityContext<GradeScale>(KEY("grade-scale"), SEED_DATA.gradeScale)

export const feeCategoriesStore = createEntityContext<FeeCategory>(KEY("fee-categories"), SEED_DATA.feeCategories)
export const feeInstallmentsStore = createEntityContext<FeeInstallment>(KEY("fee-installments"), SEED_DATA.feeInstallments)
export const feeTransactionsStore = createEntityContext<FeeTransaction>(KEY("fee-transactions"), SEED_DATA.feeTransactions)

export const notificationsStore = createEntityContext<Notification>(KEY("notifications"), SEED_DATA.notifications)
export const calendarEventsStore = createEntityContext<CalendarEvent>(KEY("calendar-events"), SEED_DATA.calendarEvents)
export const auditLogStore = createEntityContext<AuditLogEntry>(KEY("audit-log"), SEED_DATA.auditLog)

export const admissionLeadsStore = createEntityContext<AdmissionLead>(KEY("admission-leads"), SEED_DATA.admissionLeads)
export const vehiclesStore = createEntityContext<Vehicle>(KEY("vehicles"), SEED_DATA.vehicles)
export const routesStore = createEntityContext<TransportRoute>(KEY("routes"), SEED_DATA.routes)
export const maintenanceLogsStore = createEntityContext<MaintenanceLog>(KEY("maintenance-logs"), SEED_DATA.maintenanceLogs)

export const booksStore = createEntityContext<Book>(KEY("books"), SEED_DATA.books)
export const bookIssuesStore = createEntityContext<BookIssue>(KEY("book-issues"), SEED_DATA.bookIssues)

export const schoolEventsStore = createEntityContext<SchoolEvent>(KEY("school-events"), SEED_DATA.schoolEvents)
export const announcementsStore = createEntityContext<Announcement>(KEY("announcements"), SEED_DATA.announcements)

export const staffMembersStore = createEntityContext<StaffMember>(KEY("staff-members"), SEED_DATA.staffMembers)
export const leaveRequestsStore = createEntityContext<LeaveRequest>(KEY("leave-requests"), SEED_DATA.leaveRequests)
export const payrollStore = createEntityContext<PayrollRecord>(KEY("payroll"), SEED_DATA.payrollRecords)
export const jobOpeningsStore = createEntityContext<JobOpening>(KEY("job-openings"), SEED_DATA.jobOpenings)
export const candidatesStore = createEntityContext<Candidate>(KEY("candidates"), SEED_DATA.candidates)

export const appUsersStore = createEntityContext<AppUser>(KEY("app-users"), SEED_DATA.appUsers)

export const schoolProfileStore = createValueContext<SchoolProfile>(KEY("school-profile"), SEED_DATA.schoolProfile)
export const academicSessionStore = createValueContext<AcademicSession>(KEY("academic-session"), SEED_DATA.academicSession)

export const useClasses = classesStore.useStore
export const useClassSections = classSectionsStore.useStore
export const useSubjects = subjectsStore.useStore
export const useTimetable = timetableStore.useStore
export const useAssignments = assignmentsStore.useStore
export const useLessonPlans = lessonPlansStore.useStore
export const useStudyMaterials = studyMaterialsStore.useStore

export const useStudents = studentsStore.useStore
export const useTeachers = teachersStore.useStore
export const useAttendance = attendanceStore.useStore

export const useExams = examsStore.useStore
export const useExamSubjects = examSubjectsStore.useStore
export const useMarks = marksStore.useStore
export const useGradeScale = gradeScaleStore.useStore

export const useFeeCategories = feeCategoriesStore.useStore
export const useFeeInstallments = feeInstallmentsStore.useStore
export const useFeeTransactions = feeTransactionsStore.useStore

export const useNotifications = notificationsStore.useStore
export const useCalendarEvents = calendarEventsStore.useStore
export const useAuditLog = auditLogStore.useStore

export const useAdmissionLeads = admissionLeadsStore.useStore
export const useVehicles = vehiclesStore.useStore
export const useRoutes = routesStore.useStore
export const useMaintenanceLogs = maintenanceLogsStore.useStore

export const useBooks = booksStore.useStore
export const useBookIssues = bookIssuesStore.useStore

export const useSchoolEvents = schoolEventsStore.useStore
export const useAnnouncements = announcementsStore.useStore

export const useStaffMembers = staffMembersStore.useStore
export const useLeaveRequests = leaveRequestsStore.useStore
export const usePayroll = payrollStore.useStore
export const useJobOpenings = jobOpeningsStore.useStore
export const useCandidates = candidatesStore.useStore

export const useAppUsers = appUsersStore.useStore

export const useSchoolProfile = schoolProfileStore.useStore
export const useAcademicSession = academicSessionStore.useStore

export const ALL_ENTITY_PROVIDERS = [
  classesStore.Provider,
  classSectionsStore.Provider,
  subjectsStore.Provider,
  timetableStore.Provider,
  assignmentsStore.Provider,
  lessonPlansStore.Provider,
  studyMaterialsStore.Provider,
  studentsStore.Provider,
  teachersStore.Provider,
  attendanceStore.Provider,
  examsStore.Provider,
  examSubjectsStore.Provider,
  marksStore.Provider,
  gradeScaleStore.Provider,
  feeCategoriesStore.Provider,
  feeInstallmentsStore.Provider,
  feeTransactionsStore.Provider,
  notificationsStore.Provider,
  calendarEventsStore.Provider,
  auditLogStore.Provider,
  admissionLeadsStore.Provider,
  vehiclesStore.Provider,
  routesStore.Provider,
  maintenanceLogsStore.Provider,
  booksStore.Provider,
  bookIssuesStore.Provider,
  schoolEventsStore.Provider,
  announcementsStore.Provider,
  staffMembersStore.Provider,
  leaveRequestsStore.Provider,
  payrollStore.Provider,
  jobOpeningsStore.Provider,
  candidatesStore.Provider,
  appUsersStore.Provider,
  schoolProfileStore.Provider,
  academicSessionStore.Provider,
]
