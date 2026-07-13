import type { Metadata } from "next"

import { EventsTable } from "./_components/events-table"

export const metadata: Metadata = {
  title: "Events — MyCampus360",
}

export default function EventsPage() {
  return <EventsTable />
}
