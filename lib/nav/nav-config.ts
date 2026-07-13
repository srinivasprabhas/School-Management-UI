import {
  BarChart3Icon,
  BellIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingIcon,
  BusIcon,
  CalendarCheckIcon,
  CalendarIcon,
  FileTextIcon,
  GraduationCapIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MegaphoneIcon,
  PartyPopperIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import type { NavGroup } from "./types"

const STAFF_ROLES = [
  "super_admin",
  "principal",
  "vice_principal",
  "teacher",
  "accountant",
  "receptionist",
  "librarian",
  "transport_manager",
  "hostel_manager",
] as const

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: "general",
    label: "General",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      { id: "notifications", label: "Notifications", href: "/notifications", icon: BellIcon, badgeKey: "notifications" },
      { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarIcon },
    ],
  },
  {
    id: "student-mgmt",
    label: "Student Management",
    items: [
      {
        id: "students",
        label: "Students",
        href: "/students",
        icon: UsersIcon,
        roles: ["super_admin", "principal", "vice_principal", "teacher", "accountant", "receptionist", "librarian", "transport_manager", "hostel_manager"],
      },
      {
        id: "teachers",
        label: "Teachers",
        href: "/teachers",
        icon: GraduationCapIcon,
        roles: ["super_admin", "principal", "vice_principal", "librarian"],
      },
      {
        id: "attendance",
        label: "Attendance",
        href: "/attendance",
        icon: CalendarCheckIcon,
        roles: ["super_admin", "principal", "vice_principal", "teacher", "receptionist", "hostel_manager"],
      },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    items: [
      {
        id: "examinations",
        label: "Examinations",
        href: "/examinations",
        icon: FileTextIcon,
        roles: ["super_admin", "principal", "vice_principal", "teacher"],
      },
      {
        id: "academics",
        label: "Academics",
        href: "/academics",
        icon: BookOpenIcon,
        roles: ["super_admin", "principal", "vice_principal", "teacher"],
        items: [
          { id: "academics-classes", label: "Classes & Sections", href: "/academics/classes-sections", icon: BookOpenIcon },
          { id: "academics-subjects", label: "Subjects", href: "/academics/subjects", icon: BookOpenIcon },
          { id: "academics-timetable", label: "Timetable", href: "/academics/timetable", icon: BookOpenIcon },
          { id: "academics-assignments", label: "Assignments", href: "/academics/assignments", icon: BookOpenIcon },
          { id: "academics-materials", label: "Study Materials", href: "/academics/study-materials", icon: BookOpenIcon },
        ],
      },
    ],
  },
  {
    id: "campus-ops",
    label: "Campus Operations",
    items: [
      {
        id: "campus-operations",
        label: "Campus Operations",
        href: "/campus-operations",
        icon: BuildingIcon,
        items: [
          { id: "transport", label: "Transport", href: "/campus-operations/transport", icon: BusIcon, roles: ["super_admin", "principal", "transport_manager"] },
          { id: "library", label: "Library", href: "/campus-operations/library", icon: LibraryIcon, roles: ["super_admin", "principal", "librarian"] },
          { id: "admissions", label: "Admissions", href: "/campus-operations/admissions", icon: UserPlusIcon, roles: ["super_admin", "principal", "receptionist"] },
          { id: "events", label: "Events", href: "/campus-operations/events", icon: PartyPopperIcon, roles: ["super_admin", "principal", "vice_principal", "teacher", "receptionist"] },
          { id: "announcements", label: "Announcements", href: "/campus-operations/announcements", icon: MegaphoneIcon, roles: ["super_admin", "principal", "vice_principal", "teacher", "receptionist"] },
        ],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    roles: ["super_admin", "principal", "vice_principal", "accountant"],
    items: [
      {
        id: "fees",
        label: "Fees",
        href: "/fees",
        icon: WalletIcon,
        roles: ["super_admin", "principal", "accountant", "receptionist"],
      },
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
        icon: BarChart3Icon,
        roles: ["super_admin", "principal", "vice_principal", "accountant"],
      },
      {
        id: "administration",
        label: "HR & Analytics",
        href: "/administration",
        icon: BriefcaseIcon,
        roles: ["super_admin", "principal"],
        items: [
          { id: "hrms", label: "HRMS", href: "/administration/hrms/staff", icon: BriefcaseIcon },
          { id: "analytics", label: "Analytics", href: "/administration/analytics", icon: BarChart3Icon },
          { id: "users-roles", label: "Users & Roles", href: "/administration/users-roles", icon: ShieldCheckIcon },
          { id: "audit-logs", label: "Audit Logs", href: "/administration/audit-logs", icon: HistoryIcon },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: Settings2Icon,
        roles: ["super_admin", "principal", "vice_principal"],
      },
    ],
  },
]

export const PORTAL_NAV_GROUPS: NavGroup[] = [
  {
    id: "portal",
    label: "My School",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      { id: "attendance", label: "Attendance", href: "/attendance", icon: CalendarCheckIcon },
      { id: "fees", label: "Fees", href: "/fees", icon: WalletIcon },
      { id: "examinations", label: "Results", href: "/examinations", icon: FileTextIcon },
      { id: "academics", label: "Academics", href: "/academics", icon: BookOpenIcon },
      { id: "transport", label: "Transport", href: "/campus-operations/transport", icon: BusIcon },
      { id: "library", label: "Library", href: "/campus-operations/library", icon: LibraryIcon },
      { id: "events", label: "Events", href: "/campus-operations/events", icon: PartyPopperIcon },
      { id: "announcements", label: "Announcements", href: "/campus-operations/announcements", icon: MegaphoneIcon },
      { id: "calendar", label: "Calendar", href: "/calendar", icon: CalendarIcon },
      { id: "notifications", label: "Notifications", href: "/notifications", icon: BellIcon, badgeKey: "notifications" },
    ],
  },
]

export function isPortalRole(role: string) {
  return role === "parent" || role === "student"
}

export function getNavGroupsForRole(role: string): NavGroup[] {
  return isPortalRole(role) ? PORTAL_NAV_GROUPS : ADMIN_NAV_GROUPS
}

export { STAFF_ROLES }

export const QUICK_ACTION_IDS = [
  "add-student",
  "add-teacher",
  "take-attendance",
  "collect-fee",
  "create-notice",
  "schedule-exam",
  "generate-report",
] as const

export type QuickActionId = (typeof QUICK_ACTION_IDS)[number]
