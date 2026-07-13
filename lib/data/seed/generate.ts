import { MOCK_USERS } from "@/lib/rbac/mock-users"
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
import {
  BLOOD_GROUPS,
  CLASS_NAMES,
  DEPARTMENTS,
  DESIGNATIONS,
  HOUSES,
  SECTIONS,
  SUBJECT_POOL,
  fullName,
  randomAddress,
  randomPhone,
} from "./pools"
import { addDays, addYears, createRng, pad, toISODate } from "./random"

/** Fixed reference "today" so seeded data is identical on server and client (no hydration drift). */
export const SEED_TODAY = new Date("2026-07-13T00:00:00.000Z")
const ACADEMIC_YEAR = "2025-26"

export interface SeedData {
  classes: SchoolClass[]
  classSections: ClassSection[]
  subjects: Subject[]
  timetableSlots: TimetableSlot[]
  assignments: Assignment[]
  lessonPlans: LessonPlan[]
  studyMaterials: StudyMaterial[]
  students: Student[]
  teachers: Teacher[]
  attendanceRecords: AttendanceRecord[]
  exams: Exam[]
  examSubjects: ExamSubject[]
  marks: Mark[]
  gradeScale: GradeScale[]
  feeCategories: FeeCategory[]
  feeInstallments: FeeInstallment[]
  feeTransactions: FeeTransaction[]
  notifications: Notification[]
  calendarEvents: CalendarEvent[]
  auditLog: AuditLogEntry[]
  admissionLeads: AdmissionLead[]
  vehicles: Vehicle[]
  routes: TransportRoute[]
  maintenanceLogs: MaintenanceLog[]
  books: Book[]
  bookIssues: BookIssue[]
  schoolEvents: SchoolEvent[]
  announcements: Announcement[]
  staffMembers: StaffMember[]
  leaveRequests: LeaveRequest[]
  payrollRecords: PayrollRecord[]
  jobOpenings: JobOpening[]
  candidates: Candidate[]
  appUsers: AppUser[]
  schoolProfile: SchoolProfile
  academicSession: AcademicSession
}

export const GRADE_SCALE: GradeScale[] = [
  { id: "gr_ap", label: "A+", minPercent: 90, maxPercent: 100, remark: "Outstanding" },
  { id: "gr_a", label: "A", minPercent: 80, maxPercent: 89.99, remark: "Excellent" },
  { id: "gr_bp", label: "B+", minPercent: 70, maxPercent: 79.99, remark: "Very Good" },
  { id: "gr_b", label: "B", minPercent: 60, maxPercent: 69.99, remark: "Good" },
  { id: "gr_c", label: "C", minPercent: 50, maxPercent: 59.99, remark: "Average" },
  { id: "gr_d", label: "D", minPercent: 35, maxPercent: 49.99, remark: "Below Average" },
  { id: "gr_f", label: "F", minPercent: 0, maxPercent: 34.99, remark: "Needs Improvement" },
]

function gradeFor(percent: number): string {
  const band = GRADE_SCALE.find((g) => percent >= g.minPercent && percent <= g.maxPercent)
  return band?.label ?? "F"
}

export function buildSeedData(): SeedData {
  const rng = createRng(42)

  // --- Classes & Sections -----------------------------------------------
  const classes: SchoolClass[] = CLASS_NAMES.map((name, i) => ({
    id: `cls_${pad(i + 1, 2)}`,
    name,
    academicYear: ACADEMIC_YEAR,
  }))

  const classSections: ClassSection[] = []
  classes.forEach((cls, i) => {
    const sectionCount = i < 10 ? 1 : 2
    SECTIONS.slice(0, sectionCount).forEach((section) => {
      classSections.push({
        id: `sec_${cls.id}_${section}`,
        classId: cls.id,
        className: cls.name,
        section,
        roomNo: `${rng.int(1, 3)}${pad(rng.int(1, 20), 2)}`,
        capacity: rng.int(28, 40),
      })
    })
  })

  // --- Subjects -----------------------------------------------------------
  const subjects: Subject[] = SUBJECT_POOL.map((s, i) => ({
    id: `sub_${pad(i + 1, 2)}`,
    name: s.name,
    code: s.code,
    type: s.type,
    applicableClassIds: classes.map((c) => c.id),
    teacherIds: [],
    periodsPerWeek: rng.int(3, 6),
    status: "active",
  }))

  // --- Teachers -------------------------------------------------------------
  const TEACHER_COUNT = 24
  const teachers: Teacher[] = Array.from({ length: TEACHER_COUNT }, (_, i) => {
    const { first, last, gender } = fullName(rng)
    const dob = toISODate(addYears(SEED_TODAY, -rng.int(26, 55)))
    const joinDate = toISODate(addYears(SEED_TODAY, -rng.int(1, 15)))
    const subjectIds = rng.items(
      subjects.map((s) => s.id),
      rng.int(1, 2)
    )
    const basic = rng.int(35000, 90000)
    const allowances = Math.round(basic * 0.3)
    const deductions = Math.round(basic * 0.08)
    return {
      id: `tch_${pad(i + 1, 4)}`,
      employeeId: `EMP${pad(i + 1, 4)}`,
      firstName: first,
      lastName: last,
      dob,
      gender,
      joinDate,
      designation: rng.item(DESIGNATIONS),
      department: rng.item(DEPARTMENTS),
      qualifications: rng.items(["B.Ed", "M.Ed", "M.Sc", "M.A.", "B.Sc", "Ph.D"], rng.int(1, 2)),
      experienceYears: rng.int(1, 20),
      subjectIds,
      assignedClasses: [],
      address: randomAddress(rng),
      phone: randomPhone(rng),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@mycampus360.edu`,
      emergencyContact: randomPhone(rng),
      salary: {
        basic,
        allowances,
        deductions,
        netSalary: basic + allowances - deductions,
        bankAccountMasked: `XXXX XXXX ${rng.int(1000, 9999)}`,
        payGrade: rng.item(["L1", "L2", "L3", "L4"]),
        lastPaidDate: toISODate(addDays(SEED_TODAY, -rng.int(1, 20))),
      },
      leaveHistory: [],
      leaveBalance: rng.int(4, 18),
      documents: [
        { id: `doc_tch_${i}_1`, name: "Resume.pdf", type: "resume", url: "#", uploadedDate: joinDate, verified: true },
        { id: `doc_tch_${i}_2`, name: "Degree Certificate.pdf", type: "degree", url: "#", uploadedDate: joinDate, verified: true },
      ],
      status: rng.bool(0.94) ? "active" : "inactive",
    }
  })

  subjects.forEach((subject) => {
    subject.teacherIds = teachers
      .filter((t) => t.subjectIds.includes(subject.id))
      .map((t) => t.id)
  })

  classSections.forEach((section, i) => {
    const teacher = teachers[i % teachers.length]
    section.classTeacherId = teacher.id
    teacher.assignedClasses.push({
      classSectionId: section.id,
      subjectId: rng.item(teacher.subjectIds),
      role: "class_teacher",
    })
  })
  // additional subject-teacher assignments
  classSections.forEach((section) => {
    rng.items(teachers, 2).forEach((teacher) => {
      teacher.assignedClasses.push({
        classSectionId: section.id,
        subjectId: rng.item(teacher.subjectIds),
        role: "subject_teacher",
      })
    })
  })

  // --- Timetable ------------------------------------------------------------
  const DAYS: TimetableSlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const PERIOD_TIMES = [
    ["08:00", "08:45"], ["08:45", "09:30"], ["09:30", "10:15"], ["10:15", "11:00"],
    ["11:15", "12:00"], ["12:00", "12:45"], ["13:30", "14:15"], ["14:15", "15:00"],
  ]
  const timetableSlots: TimetableSlot[] = []
  classSections.slice(0, 10).forEach((section) => {
    DAYS.forEach((day) => {
      PERIOD_TIMES.forEach(([start, end], periodIdx) => {
        if (rng.bool(0.85)) {
          const subject = rng.item(subjects)
          const eligibleTeacher =
            teachers.find((t) => t.subjectIds.includes(subject.id)) ?? rng.item(teachers)
          timetableSlots.push({
            id: `tt_${section.id}_${day}_${periodIdx}`,
            classSectionId: section.id,
            day,
            period: periodIdx + 1,
            subjectId: subject.id,
            teacherId: eligibleTeacher.id,
            roomNo: section.roomNo,
            startTime: start,
            endTime: end,
          })
        }
      })
    })
  })

  // --- Students ---------------------------------------------------------
  const STUDENT_COUNT = 100
  const students: Student[] = []
  let admissionCounter = 1
  const perSection = Math.ceil(STUDENT_COUNT / classSections.length)
  classSections.forEach((section) => {
    const classIdx = classes.findIndex((c) => c.id === section.classId)
    const approxAge = 5 + classIdx
    for (let r = 1; r <= perSection && students.length < STUDENT_COUNT; r++) {
      const { first, last, gender } = fullName(rng)
      const dob = toISODate(addYears(SEED_TODAY, -approxAge - rng.int(0, 1)))
      const father = { name: `${rng.item(["Ramesh", "Suresh", "Anil", "Vijay", "Manoj", "Ajay"])} ${last}`, phone: randomPhone(rng), email: `parent${admissionCounter}@example.com`, occupation: rng.item(["Engineer", "Doctor", "Business Owner", "Teacher", "Government Employee"]) }
      const mother = { name: `${rng.item(["Sunita", "Geeta", "Kavita", "Rekha", "Pooja", "Neha"])} ${last}`, phone: randomPhone(rng), email: `parent2_${admissionCounter}@example.com`, occupation: rng.item(["Homemaker", "Teacher", "Doctor", "Business Owner"]) }
      students.push({
        id: `stu_${pad(admissionCounter, 4)}`,
        admissionNo: `ADM2024${pad(admissionCounter, 3)}`,
        firstName: first,
        lastName: last,
        dob,
        gender,
        bloodGroup: rng.item(BLOOD_GROUPS),
        classSectionId: section.id,
        rollNo: r,
        admissionDate: toISODate(addYears(SEED_TODAY, -rng.int(0, classIdx + 1))),
        status: rng.bool(0.96) ? "active" : "inactive",
        address: randomAddress(rng),
        phone: father.phone,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${admissionCounter}@student.mycampus360.edu`,
        father,
        mother,
        emergencyContact: father.phone,
        medical: {
          allergies: rng.bool(0.15) ? rng.items(["Peanuts", "Dust", "Pollen", "Lactose"], 1) : [],
          chronicConditions: rng.bool(0.05) ? ["Asthma"] : [],
          medications: [],
          doctorName: `Dr. ${rng.item(["Sharma", "Rao", "Kapoor", "Nair"])}`,
          doctorPhone: randomPhone(rng),
          lastCheckupDate: toISODate(addDays(SEED_TODAY, -rng.int(10, 200))),
          vaccinationStatus: rng.bool(0.9) ? "complete" : "partial",
          heightCm: 90 + classIdx * 8 + rng.int(-5, 5),
          weightKg: 15 + classIdx * 3 + rng.int(-3, 3),
        },
        documents: [
          { id: `doc_stu_${admissionCounter}_1`, name: "Birth Certificate.pdf", type: "birth_certificate", url: "#", uploadedDate: toISODate(SEED_TODAY), verified: true },
          { id: `doc_stu_${admissionCounter}_2`, name: "Aadhar Card.pdf", type: "id_proof", url: "#", uploadedDate: toISODate(SEED_TODAY), verified: rng.bool(0.8) },
        ],
        house: rng.item(HOUSES),
        busRouteId: rng.bool(0.5) ? `rt_${pad(rng.int(1, 6), 2)}` : undefined,
      })
      admissionCounter++
    }
  })

  // --- Attendance ---------------------------------------------------------
  const attendanceRecords: AttendanceRecord[] = []
  const ATTENDANCE_DAYS = 24
  function schoolDaysBack(count: number): Date[] {
    const result: Date[] = []
    let cursor = new Date(SEED_TODAY)
    while (result.length < count) {
      if (cursor.getDay() !== 0) result.push(new Date(cursor))
      cursor = addDays(cursor, -1)
    }
    return result.reverse()
  }
  const schoolDays = schoolDaysBack(ATTENDANCE_DAYS)
  students.forEach((student) => {
    schoolDays.forEach((date, i) => {
      const roll = rng.next()
      const status =
        roll < 0.86 ? "present" : roll < 0.92 ? "absent" : roll < 0.96 ? "late" : roll < 0.99 ? "leave" : "half_day"
      attendanceRecords.push({
        id: `att_stu_${student.id}_${i}`,
        personId: student.id,
        personType: "student",
        classSectionId: student.classSectionId,
        date: toISODate(date),
        status,
        markedBy: classSections.find((s) => s.id === student.classSectionId)?.classTeacherId ?? "system",
        markedAt: `${toISODate(date)}T09:15:00.000Z`,
      })
    })
  })
  teachers.forEach((teacher) => {
    schoolDays.forEach((date, i) => {
      const roll = rng.next()
      const status = roll < 0.92 ? "present" : roll < 0.96 ? "leave" : roll < 0.98 ? "late" : "absent"
      attendanceRecords.push({
        id: `att_tch_${teacher.id}_${i}`,
        personId: teacher.id,
        personType: "staff",
        date: toISODate(date),
        status,
        markedBy: "usr_principal",
        markedAt: `${toISODate(date)}T09:00:00.000Z`,
      })
    })
  })

  // --- Exams & Marks --------------------------------------------------------
  const examDefs: { name: string; term: string; status: Exam["status"]; startOffset: number }[] = [
    { name: "Unit Test 1", term: "Term 1", status: "published", startOffset: -60 },
    { name: "Mid-Term Examination", term: "Term 1", status: "published", startOffset: -20 },
    { name: "Final Examination", term: "Term 2", status: "scheduled", startOffset: 45 },
  ]
  const examSections = classSections.slice(0, 8)
  const exams: Exam[] = examDefs.map((def, i) => ({
    id: `exam_${pad(i + 1, 2)}`,
    name: def.name,
    term: def.term,
    academicYear: ACADEMIC_YEAR,
    classSectionIds: examSections.map((s) => s.id),
    startDate: toISODate(addDays(SEED_TODAY, def.startOffset)),
    endDate: toISODate(addDays(SEED_TODAY, def.startOffset + 5)),
    status: def.status,
  }))

  const examSubjects: ExamSubject[] = []
  const coreSubjects = subjects.filter((s) => s.type === "core")
  exams.forEach((exam) => {
    exam.classSectionIds.forEach((sectionId) => {
      coreSubjects.forEach((subject, si) => {
        examSubjects.push({
          id: `exsub_${exam.id}_${sectionId}_${subject.id}`,
          examId: exam.id,
          classSectionId: sectionId,
          subjectId: subject.id,
          examDate: toISODate(addDays(new Date(exam.startDate), si)),
          startTime: "09:00",
          durationMinutes: 90,
          maxMarks: 100,
          passMarks: 35,
        })
      })
    })
  })

  const marks: Mark[] = []
  exams
    .filter((e) => e.status === "published" || e.status === "completed")
    .forEach((exam) => {
      const studentsInExam = students.filter((s) => exam.classSectionIds.includes(s.classSectionId))
      studentsInExam.forEach((student) => {
        coreSubjects.forEach((subject) => {
          const isAbsent = rng.bool(0.02)
          marks.push({
            id: `mark_${exam.id}_${student.id}_${subject.id}`,
            examId: exam.id,
            subjectId: subject.id,
            studentId: student.id,
            marksObtained: isAbsent ? 0 : rng.int(28, 98),
            isAbsent,
          })
        })
      })
    })

  // --- Assignments / Lesson Plans / Study Materials --------------------------
  const assignments: Assignment[] = classSections.slice(0, 10).flatMap((section) =>
    Array.from({ length: 2 }, (_, j) => {
      const subject = rng.item(subjects)
      const teacher = teachers.find((t) => t.subjectIds.includes(subject.id)) ?? rng.item(teachers)
      const total = students.filter((s) => s.classSectionId === section.id).length
      return {
        id: `asg_${section.id}_${j}`,
        title: `${subject.name} ${rng.item(["Worksheet", "Homework", "Chapter Review", "Practice Set"])} ${j + 1}`,
        type: rng.item(["homework", "assignment", "project"] as const),
        classSectionId: section.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        assignedDate: toISODate(addDays(SEED_TODAY, -rng.int(1, 10))),
        dueDate: toISODate(addDays(SEED_TODAY, rng.int(1, 10))),
        description: `Complete the assigned ${subject.name} exercises and submit before the due date.`,
        submittedCount: rng.int(0, total),
        totalStudents: total,
        status: rng.bool(0.8) ? "open" : "closed",
      } satisfies Assignment
    })
  )

  const lessonPlans: LessonPlan[] = classSections.slice(0, 8).map((section, i) => {
    const subject = rng.item(subjects)
    const teacher = teachers.find((t) => t.subjectIds.includes(subject.id)) ?? rng.item(teachers)
    return {
      id: `lp_${i}`,
      subjectId: subject.id,
      classSectionId: section.id,
      teacherId: teacher.id,
      topic: `${subject.name} — ${rng.item(["Chapter 3: Fundamentals", "Unit 2: Applications", "Revision Week", "Chapter 5: Advanced Topics"])}`,
      weekRange: `${toISODate(addDays(SEED_TODAY, i * 7))} – ${toISODate(addDays(SEED_TODAY, i * 7 + 6))}`,
      objectives: "Students will understand the core concepts and apply them through guided practice.",
      status: rng.item(["planned", "in_progress", "completed"] as const),
    }
  })

  const studyMaterials: StudyMaterial[] = Array.from({ length: 18 }, (_, i) => {
    const section = rng.item(classSections)
    const subject = rng.item(subjects)
    return {
      id: `mat_${i}`,
      title: `${subject.name} — ${rng.item(["Notes", "Reference Guide", "Practice Problems", "Video Lecture", "Summary Sheet"])}`,
      subjectId: subject.id,
      classSectionId: section.id,
      uploadedBy: rng.item(teachers).id,
      uploadDate: toISODate(addDays(SEED_TODAY, -rng.int(1, 60))),
      fileType: rng.item(["pdf", "doc", "ppt", "video", "link"] as const),
      fileSizeKb: rng.int(120, 8000),
      downloadCount: rng.int(0, 200),
    }
  })

  // --- Fees -----------------------------------------------------------------
  const feeCategories: FeeCategory[] = [
    { id: "fc_tuition", name: "Tuition Fee", frequency: "quarterly", defaultAmount: 15000, applicableClassIds: classes.map((c) => c.id) },
    { id: "fc_transport", name: "Transport Fee", frequency: "quarterly", defaultAmount: 4500, applicableClassIds: classes.map((c) => c.id) },
    { id: "fc_library", name: "Library Fee", frequency: "annual", defaultAmount: 1200, applicableClassIds: classes.map((c) => c.id) },
    { id: "fc_lab", name: "Lab Fee", frequency: "annual", defaultAmount: 2000, applicableClassIds: classes.slice(5).map((c) => c.id) },
    { id: "fc_exam", name: "Examination Fee", frequency: "annual", defaultAmount: 1800, applicableClassIds: classes.map((c) => c.id) },
  ]

  const feeInstallments: FeeInstallment[] = []
  classSections.forEach((section) => {
    feeCategories.forEach((cat) => {
      const count = cat.frequency === "quarterly" ? 4 : 1
      for (let q = 0; q < count; q++) {
        feeInstallments.push({
          id: `fi_${section.id}_${cat.id}_${q}`,
          categoryId: cat.id,
          classSectionId: section.id,
          academicYear: ACADEMIC_YEAR,
          label: count === 4 ? `${cat.name} — Q${q + 1}` : cat.name,
          dueDate: toISODate(addDays(SEED_TODAY, q * 90 - 30)),
          amount: Math.round(cat.defaultAmount / count),
        })
      }
    })
  })

  const feeTransactions: FeeTransaction[] = []
  let receiptCounter = 1
  students.forEach((student, idx) => {
    const relevant = feeInstallments.filter((fi) => fi.classSectionId === student.classSectionId)
    rng.items(relevant, Math.min(3, relevant.length)).forEach((installment) => {
      const dueDate = new Date(installment.dueDate)
      const isPast = dueDate.getTime() < SEED_TODAY.getTime()
      const roll = rng.next()
      const status: FeeTransaction["status"] = isPast
        ? roll < 0.7 ? "paid" : roll < 0.9 ? "overdue" : "partial"
        : roll < 0.3 ? "paid" : "pending"
      const paidAmount = status === "paid" ? installment.amount : status === "partial" ? Math.round(installment.amount * 0.5) : 0
      feeTransactions.push({
        id: `ftx_${idx}_${installment.id}`,
        receiptNo: status === "paid" || status === "partial" ? `RCT${pad(receiptCounter++, 5)}` : "",
        studentId: student.id,
        items: [{ categoryId: installment.categoryId, label: installment.label, amount: installment.amount }],
        totalAmount: installment.amount,
        discount: 0,
        fine: status === "overdue" ? Math.round(installment.amount * 0.02) : 0,
        paidAmount,
        balance: installment.amount - paidAmount,
        mode: paidAmount > 0 ? rng.item(["cash", "card", "upi", "bank_transfer", "cheque"] as const) : undefined,
        status,
        dueDate: installment.dueDate,
        transactionDate: paidAmount > 0 ? toISODate(addDays(dueDate, -rng.int(0, 15))) : undefined,
        collectedBy: paidAmount > 0 ? rng.item(["usr_accountant", "usr_receptionist"]) : undefined,
        academicYear: ACADEMIC_YEAR,
      })
    })
  })

  // --- Notifications ----------------------------------------------------
  const notifTemplates: { type: Notification["type"]; title: string; message: string; severity: Notification["severity"]; actionable: boolean }[] = [
    { type: "fee_due", title: "Fee Due Reminder", message: "Tuition fee installment is due soon.", severity: "warning", actionable: false },
    { type: "birthday", title: "Upcoming Birthday", message: "A student's birthday is coming up this week.", severity: "info", actionable: false },
    { type: "leave_request", title: "Leave Request", message: "A teacher has requested leave.", severity: "info", actionable: true },
    { type: "new_admission", title: "New Admission", message: "A new admission application was submitted.", severity: "info", actionable: false },
    { type: "exam_reminder", title: "Exam Reminder", message: "Mid-Term Examination begins soon.", severity: "warning", actionable: false },
    { type: "parent_message", title: "Parent Message", message: "A parent sent a message regarding attendance.", severity: "info", actionable: false },
    { type: "system_alert", title: "System Alert", message: "Scheduled maintenance completed successfully.", severity: "info", actionable: false },
  ]
  const notifications: Notification[] = Array.from({ length: 22 }, (_, i) => {
    const t = rng.item(notifTemplates)
    return {
      id: `notif_${i}`,
      type: t.type,
      title: t.title,
      message: t.message,
      timestamp: `${toISODate(addDays(SEED_TODAY, -rng.int(0, 14)))}T${pad(rng.int(7, 18), 2)}:${pad(rng.int(0, 59), 2)}:00.000Z`,
      read: rng.bool(0.55),
      actionable: t.actionable,
      severity: t.severity,
    }
  }).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  // --- Audit Log --------------------------------------------------------
  const auditActions: { action: AuditLogEntry["action"]; module: string; entityType: string }[] = [
    { action: "create", module: "Students", entityType: "Student" },
    { action: "update", module: "Fees", entityType: "FeeTransaction" },
    { action: "delete", module: "Students", entityType: "Student" },
    { action: "login", module: "Auth", entityType: "Session" },
    { action: "export", module: "Reports", entityType: "Report" },
    { action: "permission_change", module: "Users & Roles", entityType: "Role" },
    { action: "update", module: "Examinations", entityType: "Mark" },
    { action: "create", module: "Announcements", entityType: "Announcement" },
  ]
  const auditLog: AuditLogEntry[] = Array.from({ length: 42 }, (_, i) => {
    const a = rng.item(auditActions)
    const actor = rng.item(MOCK_USERS)
    return {
      id: `audit_${i}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: a.action,
      module: a.module,
      entityType: a.entityType,
      description: `${actor.name} performed ${a.action} on ${a.entityType.toLowerCase()} in ${a.module}.`,
      timestamp: `${toISODate(addDays(SEED_TODAY, -rng.int(0, 45)))}T${pad(rng.int(7, 21), 2)}:${pad(rng.int(0, 59), 2)}:00.000Z`,
      ipAddress: `10.0.${rng.int(0, 255)}.${rng.int(1, 254)}`,
    }
  }).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  // --- Admissions ---------------------------------------------------------
  const stages: AdmissionLead["stage"][] = ["inquiry", "application", "interview", "offer", "enrolled", "rejected"]
  const admissionLeads: AdmissionLead[] = Array.from({ length: 32 }, (_, i) => {
    const { first, last, gender } = fullName(rng)
    return {
      id: `lead_${i}`,
      applicantName: `${first} ${last}`,
      dob: toISODate(addYears(SEED_TODAY, -rng.int(3, 15))),
      gender,
      applyingForClass: rng.item(CLASS_NAMES),
      parentName: `${rng.item(["Mr.", "Mrs."])} ${last}`,
      parentPhone: randomPhone(rng),
      parentEmail: `${first.toLowerCase()}.parent@example.com`,
      source: rng.item(["website", "referral", "walk_in", "social_media", "event"] as const),
      stage: rng.item(stages),
      assignedTo: rng.item(["usr_receptionist", "usr_principal"]),
      createdDate: toISODate(addDays(SEED_TODAY, -rng.int(1, 90))),
      lastActivityDate: toISODate(addDays(SEED_TODAY, -rng.int(0, 10))),
    }
  })

  // --- Transport ------------------------------------------------------------
  const vehicles: Vehicle[] = Array.from({ length: 8 }, (_, i) => ({
    id: `veh_${pad(i + 1, 2)}`,
    regNo: `KA${pad(rng.int(1, 60), 2)}AB${rng.int(1000, 9999)}`,
    type: rng.item(["bus", "van", "bus"] as const),
    capacity: rng.item([32, 40, 45]),
    driverName: `${rng.item(["Manoj", "Suresh", "Rakesh", "Vinod"])} ${rng.item(["Kumar", "Yadav", "Singh"])}`,
    driverPhone: randomPhone(rng),
    driverLicenseNo: `DL${rng.int(100000, 999999)}`,
    status: rng.bool(0.9) ? "active" : "inactive",
    routeId: `rt_${pad(i + 1, 2)}`,
    lastServiceDate: toISODate(addDays(SEED_TODAY, -rng.int(10, 90))),
    nextServiceDue: toISODate(addDays(SEED_TODAY, rng.int(10, 90))),
    fuelType: rng.item(["diesel", "diesel", "cng"] as const),
  }))

  const routes: TransportRoute[] = vehicles.map((v, i) => ({
    id: v.routeId!,
    name: `Route ${i + 1} — ${rng.item(["North", "South", "East", "West", "Central"])} Zone`,
    vehicleId: v.id,
    stops: Array.from({ length: rng.int(4, 7) }, (_, s) => ({
      name: `Stop ${s + 1}`,
      sequence: s + 1,
      pickupTime: `0${7 + Math.floor(s / 2)}:${s % 2 === 0 ? "00" : "30"}`,
      dropTime: `1${5 + Math.floor(s / 2)}:${s % 2 === 0 ? "00" : "30"}`,
      studentsCount: rng.int(3, 12),
    })),
    totalDistanceKm: rng.int(8, 25),
    status: v.status,
  }))

  const maintenanceLogs: MaintenanceLog[] = vehicles.flatMap((v) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `mnt_${v.id}_${i}`,
      vehicleId: v.id,
      date: toISODate(addDays(SEED_TODAY, -rng.int(10, 200))),
      odometer: rng.int(20000, 120000),
      fuelLiters: rng.int(30, 60),
      cost: rng.int(2000, 15000),
      note: rng.item(["Routine service", "Brake pad replacement", "Oil change", "Tyre replacement"]),
    }))
  )

  // --- Library -----------------------------------------------------------
  const bookCategories = ["Fiction", "Science", "History", "Biography", "Reference", "Mathematics", "Children"]
  const books: Book[] = Array.from({ length: 45 }, (_, i) => {
    const total = rng.int(2, 8)
    const available = rng.int(0, total)
    return {
      id: `bk_${pad(i + 1, 3)}`,
      title: `${rng.item(["The", "A Guide to", "Introduction to", "Understanding", "Elements of"])} ${rng.item(["Physics", "Adventure", "Ancient History", "Algebra", "The Universe", "Great Leaders", "Modern India"])}`,
      author: `${rng.item(LAST_NAMES_FOR_BOOKS)} ${rng.item(["R.", "K.", "S.", "M."])}`,
      isbn: `978-${rng.int(1000000000, 1999999999)}`,
      category: rng.item(bookCategories),
      totalCopies: total,
      availableCopies: available,
      status: "active",
      shelfLocation: `${rng.item(["A", "B", "C", "D"])}-${rng.int(1, 20)}`,
    }
  })

  const bookIssues: BookIssue[] = Array.from({ length: 28 }, (_, i) => {
    const book = rng.item(books)
    const isStaff = rng.bool(0.15)
    const borrower = isStaff ? rng.item(teachers) : rng.item(students)
    const issueDate = addDays(SEED_TODAY, -rng.int(1, 40))
    const dueDate = addDays(issueDate, 14)
    const returned = rng.bool(0.55)
    const overdue = !returned && dueDate.getTime() < SEED_TODAY.getTime()
    return {
      id: `iss_${i}`,
      bookId: book.id,
      borrowerId: borrower.id,
      borrowerType: isStaff ? "staff" : "student",
      issueDate: toISODate(issueDate),
      dueDate: toISODate(dueDate),
      returnDate: returned ? toISODate(addDays(issueDate, rng.int(2, 13))) : undefined,
      status: returned ? "returned" : overdue ? "overdue" : "issued",
      fineAmount: overdue ? rng.int(10, 100) : 0,
    }
  })

  // --- Events & Announcements ----------------------------------------------
  const schoolEvents: SchoolEvent[] = Array.from({ length: 14 }, (_, i) => ({
    id: `evt_${i}`,
    title: rng.item(["Annual Sports Day", "Science Exhibition", "Parent-Teacher Meeting", "Independence Day Celebration", "Inter-House Debate", "Art & Craft Fair", "Music Concert", "Founders' Day"]),
    type: rng.item(["cultural", "sports", "academic", "meeting", "holiday_celebration"] as const),
    date: toISODate(addDays(SEED_TODAY, rng.int(-20, 60))),
    startTime: "10:00",
    endTime: "13:00",
    venue: rng.item(["Main Auditorium", "School Ground", "Assembly Hall", "Classroom Block A"]),
    audience: rng.item(["All", "Students", "Parents", "Staff"]),
    organizerId: rng.item(teachers).id,
    status: rng.item(["scheduled", "scheduled", "completed"] as const),
  }))

  const announcements: Announcement[] = Array.from({ length: 16 }, (_, i) => ({
    id: `ann_${i}`,
    title: rng.item(["Half-Yearly Exam Schedule Released", "Winter Break Notice", "Fee Payment Deadline Extended", "New Uniform Guidelines", "PTA Meeting Circular", "School Magazine — Issue 12", "Bus Route Change Notice", "Sports Day Registration Open"]),
    type: rng.item(["announcement", "circular", "newsletter"] as const),
    audience: rng.items(["All", "Students", "Parents", "Teachers", "Staff"], rng.int(1, 3)),
    body: "Please find the details below. Contact the front office for any questions regarding this notice.",
    authorId: rng.item(MOCK_USERS).id,
    createdDate: toISODate(addDays(SEED_TODAY, -rng.int(0, 30))),
    publishDate: toISODate(addDays(SEED_TODAY, -rng.int(0, 30))),
    status: rng.item(["published", "published", "draft", "scheduled"] as const),
  }))

  // --- Calendar Events (manually-authored types only — birthdays & fee-due
  // dates are derived at render time from Student/Teacher DOBs and FeeInstallments) ---
  const calendarEvents: CalendarEvent[] = [
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `cal_holiday_${i}`,
      title: rng.item(["Independence Day", "Gandhi Jayanti", "Diwali Break", "Christmas Break", "Republic Day", "Holi", "Summer Break Begins", "Winter Break Begins"]),
      type: "holiday" as const,
      date: toISODate(addDays(SEED_TODAY, rng.int(-60, 120))),
      allDay: true,
      audience: "All",
    })),
    ...exams.map((exam) => ({
      id: `cal_exam_${exam.id}`,
      title: exam.name,
      type: "exam" as const,
      date: exam.startDate,
      endDate: exam.endDate,
      allDay: true,
      audience: "Students",
    })),
    ...schoolEvents.map((evt) => ({
      id: `cal_evt_${evt.id}`,
      title: evt.title,
      type: "event" as const,
      date: evt.date,
      allDay: false,
      description: `${evt.venue} · ${evt.startTime}-${evt.endTime}`,
      audience: evt.audience,
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `cal_meeting_${i}`,
      title: rng.item(["Parent-Teacher Meeting", "Staff Meeting", "PTA Committee Meeting", "Academic Review Meeting"]),
      type: "meeting" as const,
      date: toISODate(addDays(SEED_TODAY, rng.int(-15, 45))),
      allDay: false,
      audience: rng.item(["Parents", "Staff"]),
    })),
  ]

  // --- HRMS: Staff, Leave, Payroll, Recruitment --------------------------
  const staffDesignations = ["Accountant", "Receptionist", "Librarian", "Transport Manager", "Hostel Warden", "Lab Assistant", "Office Assistant", "IT Support"]
  const staffMembers: StaffMember[] = Array.from({ length: 18 }, (_, i) => {
    const { first, last } = fullName(rng)
    return {
      id: `stf_${pad(i + 1, 3)}`,
      name: `${first} ${last}`,
      employeeId: `STF${pad(i + 1, 4)}`,
      designation: rng.item(staffDesignations),
      department: "Administration",
      joinDate: toISODate(addYears(SEED_TODAY, -rng.int(1, 12))),
      phone: randomPhone(rng),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@mycampus360.edu`,
      employmentType: rng.item(["full_time", "full_time", "part_time"] as const),
      status: rng.bool(0.95) ? "active" : "inactive",
      reportingManager: "usr_principal",
    }
  })

  const leaveTypes: LeaveRequest["leaveType"][] = ["sick", "casual", "earned", "maternity", "paternity", "unpaid"]
  const leaveRequests: LeaveRequest[] = [
    ...teachers.slice(0, 14).map((t, i) => {
      const from = addDays(SEED_TODAY, rng.int(-20, 20))
      const days = rng.int(1, 5)
      const status = rng.item(["pending", "approved", "approved", "rejected"] as const)
      return {
        id: `lv_tch_${i}`,
        staffId: t.id,
        staffName: `${t.firstName} ${t.lastName}`,
        role: "Teacher",
        leaveType: rng.item(leaveTypes),
        fromDate: toISODate(from),
        toDate: toISODate(addDays(from, days - 1)),
        daysCount: days,
        reason: rng.item(["Personal reasons", "Medical appointment", "Family function", "Health recovery"]),
        status,
        appliedDate: toISODate(addDays(from, -rng.int(1, 5))),
        approvedBy: status !== "pending" ? "usr_vice_principal" : undefined,
        approvedDate: status !== "pending" ? toISODate(addDays(from, -1)) : undefined,
      } satisfies LeaveRequest
    }),
    ...staffMembers.slice(0, 10).map((s, i) => {
      const from = addDays(SEED_TODAY, rng.int(-20, 20))
      const days = rng.int(1, 4)
      const status = rng.item(["pending", "approved", "rejected"] as const)
      return {
        id: `lv_stf_${i}`,
        staffId: s.id,
        staffName: s.name,
        role: s.designation,
        leaveType: rng.item(leaveTypes),
        fromDate: toISODate(from),
        toDate: toISODate(addDays(from, days - 1)),
        daysCount: days,
        reason: rng.item(["Personal reasons", "Medical appointment", "Family emergency"]),
        status,
        appliedDate: toISODate(addDays(from, -rng.int(1, 5))),
        approvedBy: status !== "pending" ? "usr_principal" : undefined,
        approvedDate: status !== "pending" ? toISODate(addDays(from, -1)) : undefined,
      } satisfies LeaveRequest
    }),
  ]

  function payrollFor(staffId: string, staffName: string, basic: number, idx: number): PayrollRecord[] {
    const allowances = Math.round(basic * 0.25)
    const deductions = Math.round(basic * 0.07)
    return [0, 1].map((m) => ({
      id: `pay_${idx}_${m}`,
      staffId,
      staffName,
      period: m === 0 ? "June 2026" : "May 2026",
      basicSalary: basic,
      allowances,
      deductions,
      netPay: basic + allowances - deductions,
      status: m === 0 ? rng.item(["processed", "paid"] as const) : "paid",
      paymentDate: toISODate(addDays(SEED_TODAY, -(m * 30 + rng.int(1, 5)))),
      paymentMode: "bank_transfer",
    }))
  }
  const payrollRecords: PayrollRecord[] = [
    ...teachers
      .slice(0, 16)
      .flatMap((t, idx) => payrollFor(t.id, `${t.firstName} ${t.lastName}`, t.salary.basic, idx)),
    ...staffMembers
      .slice(0, 10)
      .flatMap((s, idx) => payrollFor(s.id, s.name, rng.int(20000, 45000), 100 + idx)),
  ]

  const jobOpenings: JobOpening[] = [
    { id: "job_1", title: "PGT Physics", department: "Science", openings: 1, status: "open", postedDate: toISODate(addDays(SEED_TODAY, -20)) },
    { id: "job_2", title: "Primary School Teacher", department: "Languages", openings: 2, status: "open", postedDate: toISODate(addDays(SEED_TODAY, -10)) },
    { id: "job_3", title: "Lab Assistant", department: "Science", openings: 1, status: "on_hold", postedDate: toISODate(addDays(SEED_TODAY, -35)) },
    { id: "job_4", title: "Sports Coach", department: "Arts & Sports", openings: 1, status: "closed", postedDate: toISODate(addDays(SEED_TODAY, -60)) },
  ]
  const candidates: Candidate[] = Array.from({ length: 14 }, (_, i) => {
    const { first, last } = fullName(rng)
    return {
      id: `cand_${i}`,
      name: `${first} ${last}`,
      jobId: rng.item(jobOpenings).id,
      stage: rng.item(["applied", "screening", "interview", "offer", "hired", "rejected"] as const),
      appliedDate: toISODate(addDays(SEED_TODAY, -rng.int(1, 40))),
      rating: rng.bool(0.6) ? rng.int(2, 5) : undefined,
    }
  })

  // --- Users & Roles ---------------------------------------------------
  const appUsers: AppUser[] = [
    ...MOCK_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: "active" as const,
      lastLogin: u.lastLogin,
      createdDate: u.joinedDate,
    })),
    ...teachers.slice(0, 6).map((t) => ({
      id: `au_${t.id}`,
      name: `${t.firstName} ${t.lastName}`,
      email: t.email,
      role: "teacher",
      status: "active" as const,
      lastLogin: toISODate(addDays(SEED_TODAY, -rng.int(0, 5))),
      createdDate: t.joinDate,
    })),
  ]

  // --- Settings -----------------------------------------------------------
  const schoolProfile: SchoolProfile = {
    name: "MyCampus360 Public School",
    address: "45, Lake View Road, Koramangala, Bengaluru, Karnataka 560034",
    phone: "+91 80 4567 8900",
    email: "info@mycampus360.edu",
    code: "MC360-BLR-01",
    establishedYear: 1998,
    principalName: "Ramesh Iyer",
  }

  const academicSession: AcademicSession = {
    year: ACADEMIC_YEAR,
    startDate: "2025-06-01",
    endDate: "2026-04-30",
    terms: [
      { id: "term_1", name: "Term 1", startDate: "2025-06-01", endDate: "2025-10-15" },
      { id: "term_2", name: "Term 2", startDate: "2025-10-16", endDate: "2026-04-30" },
    ],
  }

  return {
    classes,
    classSections,
    subjects,
    timetableSlots,
    assignments,
    lessonPlans,
    studyMaterials,
    students,
    teachers,
    attendanceRecords,
    exams,
    examSubjects,
    marks,
    gradeScale: GRADE_SCALE,
    feeCategories,
    feeInstallments,
    feeTransactions,
    notifications,
    calendarEvents,
    auditLog,
    admissionLeads,
    vehicles,
    routes,
    maintenanceLogs,
    books,
    bookIssues,
    schoolEvents,
    announcements,
    staffMembers,
    leaveRequests,
    payrollRecords,
    jobOpenings,
    candidates,
    appUsers,
    schoolProfile,
    academicSession,
  }
}

const LAST_NAMES_FOR_BOOKS = ["Rowling", "Verne", "Curie", "Sen", "Tagore", "Asimov", "Feynman", "Doyle", "Christie", "Roy"]

export { gradeFor }

/** Built once at module load — deterministic, so identical on server and client. */
export const SEED_DATA: SeedData = buildSeedData()
