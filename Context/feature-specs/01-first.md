read @my-app/AGENTS.md 

@my-app/Context/MyCampus360 Documentations.pdf 
has all the features that we provide which is like too much 

soo  make a dashboard  for a school management system
our core modules are 
- Academics has academic structure, time tables, exams, results, assignments, LMS, 
- campus operations has transport, library, events, admissions, students list, alerts, newsletters.
- Student management has student records, attendance, admission numbers, documents, academic calendar.
- Administrations has fees management, HRMS, analytics.

few things we definitely need are dark theme light theme,(by default keep light theme) in sidebar: Dashboard, Notifications
other suggestions i would give are (strictly take these as example its not mandatory to use only this):
# Dashboard:
cards:
Total Students
Total Teachers
Today's Attendance
Active Buses

Charts:
Student growth
Attendance trends
Fee collection
Admission statistics
Exam performance

Recent Activity:
New admissions
Fee payments
Attendance updates
Teacher leave requests
Latest announcements

# Top Navigation Bar
School logo
Search bar
Notifications
Dark/Light mode
User profile

# Student Management
Features:

Add Student
Import Excel/CSV
Export
Advanced Search
Student Profile
Parent Details
Medical Information
Documents
Fee History
Attendance
Report Cards

Columns:

Admission No.
Photo
Name
Class
Section
Parent
Phone
Status
Actions

# Teacher Management
Teacher Profile:

Personal Details
Subjects
Assigned Classes
Timetable
Salary
Attendance
Leave History
Documents

# Attendance Module
Student Attendance:

Calendar View
Daily View
Monthly View

Statuses:

Present
Absent
Late
Leave
Half Day

Reports:

Monthly percentage
Class-wise attendance
Student history

# Examination Module
Features:

Create Exams
Add Subjects
Marks Entry
Grade Calculation
Rank List
Report Cards
Result Publishing

# Fees Module
Dashboard:

Total Collected
Pending
Due Today

Features:

Online Payments
Offline Payments
Fee Categories
Installments
Fine Management
Receipt Printing

# Reports
Generate reports for:

Attendance
Fees
Examination
Admissions
Student Performance
Transport
Library
Teacher Attendance

Filters:

Academic Year
Class
Section
Date Range

Export:

PDF
Excel
CSV


# Settings
School:

Name
Logo
Address
Contact

Academic:

Session
Terms
Grading

Users:

Roles
Permissions

# User Roles
Super Admin
Principal
Vice Principal
Teacher
Accountant
Receptionist
Librarian
Transport Manager
Hostel Manager
Parent (portal)
Student (portal)

Each role should have only the permissions needed for their responsibilities.

# Notifications Panel
Show:

Fee due reminders
Birthday reminders
Leave requests
New admissions
Exam reminders
Parent messages
System alerts

# Calendar
Display:

Holidays
Exams
Events
Parent meetings
Teacher meetings
Fee due dates
Birthdays

# Search
A global search should allow admins to quickly find:

Students
Teachers
Classes
Subjects
Fee receipts
Books
Vehicles

# Quick Actions
Provide one-click shortcuts for frequent tasks:

Add Student
Add Teacher
Take Attendance
Collect Fee
Create Notice
Schedule Exam
Generate Report

# Audit & Activity Logs
Track:

User logins
Record updates
Fee transactions
Permission changes
Data exports
Deleted records


# UI Design Suggestions

Responsive layout for desktop, tablet, and mobile
Clean sidebar with collapsible menus
Color-coded status badges (e.g., green for active, red for overdue)
Tables with sorting, filtering, and pagination
Breadcrumb navigation
Toast notifications for actions
Confirmation dialogs before destructive actions
Light and dark themes
Consistent icons and typography



I want full UI/UX of all the modules/components mentioned


with the information i gave you research and web search how different school management systems design dasboards
look these for reference and try to replicate these as much as possible
- https://shadcnuikit.com/dashboard/default
- https://shadcnuikit.com/dashboard/payment
- https://shadcnuikit.com/dashboard/payment/transactions
- https://shadcnuikit.com/dashboard/project-management
- https://shadcnuikit.com/dashboard/crm
- https://shadcnuikit.com/dashboard/finance
- https://shadcnuikit.com/dashboard/apps/calendar
- https://shadcnuikit.com/dashboard/pages/users
- https://shadcnuikit.com/dashboard/pages/profile
- https://shadcnuikit.com/dashboard/pages/settings
- https://shadcnuikit.com/dashboard/pages/settings/account
- https://shadcnuikit.com/dashboard/pages/settings/billing
- https://shadcnuikit.com/dashboard/pages/settings/appearance
- https://shadcnuikit.com/dashboard/pages/settings/notifications
- https://shadcnuikit.com/dashboard/pages/settings/display
- https://shadcnuikit.com/dashboard/login/v1
- https://shadcnuikit.com/dashboard/register/v1
- https://shadcnuikit.com/dashboard/pages/notifications


follow good UI/UX design principles if possible, 
for components use everything from shadcn only, shadcn skills are installed
I want the build to be full scale as in how it would replicate the real build like a real time working  font , styling and theming is from pnpm dlx shadcn@latest init --preset b1Z5bafVA --template next

