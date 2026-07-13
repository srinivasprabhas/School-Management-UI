import { Suspense } from "react"
import type { Metadata } from "next"

import { AttendanceView } from "./_components/attendance-view"

export const metadata: Metadata = {
  title: "Attendance — MyCampus360",
}

export default function AttendancePage() {
  return (
    <Suspense>
      <AttendanceView />
    </Suspense>
  )
}
