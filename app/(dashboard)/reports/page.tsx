import type { Metadata } from "next"

import { ReportsView } from "./_components/reports-view"

export const metadata: Metadata = {
  title: "Reports — MyCampus360",
}

export default function ReportsPage() {
  return <ReportsView />
}
