import type { MockUser, Role } from "./types"

export const MOCK_USERS: MockUser[] = [
  {
    id: "usr_super_admin",
    name: "Aisha Verma",
    email: "aisha.verma@mycampus360.edu",
    role: "super_admin",
    designation: "Super Administrator",
    lastLogin: "2026-07-13T08:12:00.000Z",
    joinedDate: "2019-06-01",
  },
  {
    id: "usr_principal",
    name: "Ramesh Iyer",
    email: "ramesh.iyer@mycampus360.edu",
    role: "principal",
    designation: "Principal",
    lastLogin: "2026-07-13T07:45:00.000Z",
    joinedDate: "2015-04-12",
  },
  {
    id: "usr_vice_principal",
    name: "Sunita Rao",
    email: "sunita.rao@mycampus360.edu",
    role: "vice_principal",
    designation: "Vice Principal",
    lastLogin: "2026-07-12T18:20:00.000Z",
    joinedDate: "2017-06-20",
  },
  {
    id: "usr_teacher",
    name: "Karan Mehta",
    email: "karan.mehta@mycampus360.edu",
    role: "teacher",
    designation: "Senior Teacher, Mathematics",
    lastLogin: "2026-07-13T06:50:00.000Z",
    joinedDate: "2020-07-01",
  },
  {
    id: "usr_accountant",
    name: "Priya Nair",
    email: "priya.nair@mycampus360.edu",
    role: "accountant",
    designation: "Accountant",
    lastLogin: "2026-07-12T17:05:00.000Z",
    joinedDate: "2018-01-15",
  },
  {
    id: "usr_receptionist",
    name: "Farhan Sheikh",
    email: "farhan.sheikh@mycampus360.edu",
    role: "receptionist",
    designation: "Front Office Executive",
    lastLogin: "2026-07-13T08:02:00.000Z",
    joinedDate: "2021-03-08",
  },
  {
    id: "usr_librarian",
    name: "Meera Pillai",
    email: "meera.pillai@mycampus360.edu",
    role: "librarian",
    designation: "Chief Librarian",
    lastLogin: "2026-07-11T15:40:00.000Z",
    joinedDate: "2016-09-19",
  },
  {
    id: "usr_transport_manager",
    name: "Vikram Solanki",
    email: "vikram.solanki@mycampus360.edu",
    role: "transport_manager",
    designation: "Transport Manager",
    lastLogin: "2026-07-13T07:15:00.000Z",
    joinedDate: "2019-11-02",
  },
  {
    id: "usr_hostel_manager",
    name: "Lakshmi Menon",
    email: "lakshmi.menon@mycampus360.edu",
    role: "hostel_manager",
    designation: "Hostel Warden",
    lastLogin: "2026-07-12T21:30:00.000Z",
    joinedDate: "2020-02-14",
  },
  {
    id: "usr_parent",
    name: "Anjali Kapoor",
    email: "anjali.kapoor@gmail.com",
    role: "parent",
    designation: "Parent",
    lastLogin: "2026-07-13T09:00:00.000Z",
    joinedDate: "2022-06-01",
  },
  {
    id: "usr_student",
    name: "Rohan Kapoor",
    email: "rohan.kapoor@student.mycampus360.edu",
    role: "student",
    designation: "Student, Class 8-A",
    lastLogin: "2026-07-13T09:05:00.000Z",
    joinedDate: "2022-06-01",
  },
]

export function getMockUserByRole(role: Role): MockUser {
  const user = MOCK_USERS.find((u) => u.role === role)
  if (!user) throw new Error(`No mock user seeded for role "${role}"`)
  return user
}

export const DEFAULT_USER: MockUser = getMockUserByRole("super_admin")
