import type { Metadata } from "next"

import { TimetableView } from "./_components/timetable-view"

export const metadata: Metadata = {
  title: "Timetable — MyCampus360",
}

export default function TimetablePage() {
  return <TimetableView />
}
