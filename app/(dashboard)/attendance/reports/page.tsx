import { Suspense } from "react"
import type { Metadata } from "next"

import { AttendanceReports } from "./_components/attendance-reports"

export const metadata: Metadata = {
  title: "Attendance Reports — MyCampus360",
}

export default function AttendanceReportsPage() {
  return (
    <Suspense>
      <AttendanceReports />
    </Suspense>
  )
}
