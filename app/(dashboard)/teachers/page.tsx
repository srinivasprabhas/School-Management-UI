import { Suspense } from "react"
import type { Metadata } from "next"

import { TeachersTable } from "./_components/teachers-table"

export const metadata: Metadata = {
  title: "Teachers — MyCampus360",
}

export default function TeachersPage() {
  return (
    <Suspense>
      <TeachersTable />
    </Suspense>
  )
}
