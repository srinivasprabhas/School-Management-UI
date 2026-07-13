import { gradeFor } from "@/lib/data/seed/generate"
import type { ClassSection, Exam, ExamSubject, Mark, Student, Subject } from "@/lib/data/types"

export interface ExamSubjectColumn {
  subjectId: string
  name: string
}

export interface StudentSubjectMark {
  subjectId: string
  subjectName: string
  marksObtained: number
  isAbsent: boolean
  maxMarks: number
  passMarks: number
  grade: string
}

export interface StudentExamResult {
  student: Student
  classSection: ClassSection
  subjectResults: StudentSubjectMark[]
  total: number
  totalMax: number
  percentage: number
  grade: string
  passed: boolean
  rank: number
}

interface ComputeExamResultsParams {
  examId: string
  exams: Exam[]
  examSubjects: ExamSubject[]
  marks: Mark[]
  students: Student[]
  classSections: ClassSection[]
  subjects: Subject[]
}

/**
 * Builds per-student exam results (subject-wise marks, totals, grade, pass/fail) and a
 * dense class-scoped rank (ranks reset within each class section, ties share a rank).
 * Shared by the Rank List and Report Cards pages so both agree on the same numbers.
 */
export function computeExamResults({
  examId,
  exams,
  examSubjects,
  marks,
  students,
  classSections,
  subjects,
}: ComputeExamResultsParams): { results: StudentExamResult[]; subjectColumns: ExamSubjectColumn[] } {
  const exam = exams.find((e) => e.id === examId)
  if (!exam) return { results: [], subjectColumns: [] }

  const examSubjectsForExam = examSubjects.filter((es) => es.examId === examId)
  const subjectIds = [...new Set(examSubjectsForExam.map((es) => es.subjectId))]
  const subjectColumns: ExamSubjectColumn[] = subjectIds
    .map((id) => ({ subjectId: id, name: subjects.find((s) => s.id === id)?.name ?? id }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const marksForExam = marks.filter((m) => m.examId === examId)
  const marksByStudentSubject = new Map<string, Mark>()
  marksForExam.forEach((m) => marksByStudentSubject.set(`${m.studentId}:${m.subjectId}`, m))

  const eligibleStudents = students.filter((s) => exam.classSectionIds.includes(s.classSectionId))

  const rows: StudentExamResult[] = []
  eligibleStudents.forEach((student) => {
    const classSection = classSections.find((cs) => cs.id === student.classSectionId)
    if (!classSection) return

    const applicableExamSubjects = examSubjectsForExam.filter((es) => es.classSectionId === student.classSectionId)
    if (applicableExamSubjects.length === 0) return

    const hasAnyMark = applicableExamSubjects.some((es) => marksByStudentSubject.has(`${student.id}:${es.subjectId}`))
    if (!hasAnyMark) return

    const subjectResults: StudentSubjectMark[] = applicableExamSubjects.map((es) => {
      const mark = marksByStudentSubject.get(`${student.id}:${es.subjectId}`)
      const isAbsent = mark?.isAbsent ?? false
      const marksObtained = mark && !isAbsent ? mark.marksObtained : 0
      const pct = es.maxMarks > 0 ? (marksObtained / es.maxMarks) * 100 : 0
      return {
        subjectId: es.subjectId,
        subjectName: subjects.find((s) => s.id === es.subjectId)?.name ?? es.subjectId,
        marksObtained,
        isAbsent,
        maxMarks: es.maxMarks,
        passMarks: es.passMarks,
        grade: isAbsent ? "AB" : gradeFor(pct),
      }
    })

    const total = subjectResults.reduce((sum, r) => sum + r.marksObtained, 0)
    const totalMax = subjectResults.reduce((sum, r) => sum + r.maxMarks, 0)
    const percentage = totalMax > 0 ? (total / totalMax) * 100 : 0
    const passed = subjectResults.every((r) => !r.isAbsent && r.marksObtained >= r.passMarks)

    rows.push({
      student,
      classSection,
      subjectResults,
      total,
      totalMax,
      percentage,
      grade: gradeFor(percentage),
      passed,
      rank: 0,
    })
  })

  const byClass = new Map<string, StudentExamResult[]>()
  rows.forEach((r) => {
    const list = byClass.get(r.classSection.id) ?? []
    list.push(r)
    byClass.set(r.classSection.id, list)
  })

  const flattened: StudentExamResult[] = []
  ;[...byClass.values()]
    .sort((a, b) => {
      const an = `${a[0].classSection.className} ${a[0].classSection.section}`
      const bn = `${b[0].classSection.className} ${b[0].classSection.section}`
      return an.localeCompare(bn)
    })
    .forEach((group) => {
      group.sort((a, b) => b.total - a.total)
      let rank = 0
      let prevTotal: number | null = null
      group.forEach((r) => {
        if (prevTotal === null || r.total !== prevTotal) rank += 1
        r.rank = rank
        prevTotal = r.total
        flattened.push(r)
      })
    })

  return { results: flattened, subjectColumns }
}
