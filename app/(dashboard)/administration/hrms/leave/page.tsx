import type { Metadata } from "next"

import { LeaveContent } from "./_components/leave-content"

export const metadata: Metadata = {
  title: "Leave Management — MyCampus360",
}

export default function Page() {
  return <LeaveContent />
}
