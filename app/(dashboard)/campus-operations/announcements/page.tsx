import { Suspense } from "react"
import type { Metadata } from "next"

import { AnnouncementsTable } from "./_components/announcements-table"

export const metadata: Metadata = {
  title: "Announcements — MyCampus360",
}

export default function AnnouncementsPage() {
  return (
    <Suspense>
      <AnnouncementsTable />
    </Suspense>
  )
}
