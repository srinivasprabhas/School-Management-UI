export type Role =
  | "super_admin"
  | "principal"
  | "vice_principal"
  | "teacher"
  | "accountant"
  | "receptionist"
  | "librarian"
  | "transport_manager"
  | "hostel_manager"
  | "parent"
  | "student"

export const ROLES: Role[] = [
  "super_admin",
  "principal",
  "vice_principal",
  "teacher",
  "accountant",
  "receptionist",
  "librarian",
  "transport_manager",
  "hostel_manager",
  "parent",
  "student",
]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  principal: "Principal",
  vice_principal: "Vice Principal",
  teacher: "Teacher",
  accountant: "Accountant",
  receptionist: "Receptionist",
  librarian: "Librarian",
  transport_manager: "Transport Manager",
  hostel_manager: "Hostel Manager",
  parent: "Parent",
  student: "Student",
}

export type Permission =
  | "students:view"
  | "students:create"
  | "students:edit"
  | "students:delete"
  | "teachers:view"
  | "teachers:create"
  | "teachers:edit"
  | "teachers:delete"
  | "attendance:view"
  | "attendance:mark"
  | "academics:view"
  | "academics:manage"
  | "exams:view"
  | "exams:manage"
  | "results:publish"
  | "fees:view"
  | "fees:collect"
  | "fees:manage"
  | "reports:view"
  | "reports:export"
  | "settings:manage"
  | "users:manage"
  | "users:manage-roles"
  | "hrms:view"
  | "hrms:manage"
  | "hrms:approve-leave"
  | "transport:view"
  | "transport:manage"
  | "library:view"
  | "library:manage"
  | "admissions:view"
  | "admissions:manage"
  | "events:view"
  | "events:manage"
  | "announcements:view"
  | "announcements:manage"
  | "analytics:view"
  | "audit:view"
  | "calendar:manage"

export interface MockUser {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  designation: string
  lastLogin: string
  joinedDate: string
}
