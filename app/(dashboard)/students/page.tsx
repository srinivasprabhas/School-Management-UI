import { Suspense } from "react"
import type { Metadata } from "next"

import { StudentsTable } from "./_components/students-table"

export const metadata: Metadata = {
  title: "Students — MyCampus360",
}

export default function StudentsPage() {
  return (
    <Suspense>
      <StudentsTable />
    </Suspense>
  )
}
