import type { Metadata } from "next"

import { AssignmentsView } from "./_components/assignments-view"

export const metadata: Metadata = {
  title: "Assignments — MyCampus360",
}

export default function AssignmentsPage() {
  return <AssignmentsView />
}
