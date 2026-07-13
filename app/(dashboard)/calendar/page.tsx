import { Suspense } from "react"
import type { Metadata } from "next"

import { CalendarView } from "./_components/calendar-view"

export const metadata: Metadata = {
  title: "Calendar — MyCampus360",
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarView />
    </Suspense>
  )
}
