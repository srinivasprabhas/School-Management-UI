import type { Metadata } from "next"

import { FeesDashboard } from "./_components/fees-dashboard"

export const metadata: Metadata = {
  title: "Fees — MyCampus360",
}

export default function FeesPage() {
  return <FeesDashboard />
}
