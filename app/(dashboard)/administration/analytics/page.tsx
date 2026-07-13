import type { Metadata } from "next"

import { AnalyticsContent } from "./_components/analytics-content"

export const metadata: Metadata = {
  title: "Analytics — MyCampus360",
}

export default function Page() {
  return <AnalyticsContent />
}
