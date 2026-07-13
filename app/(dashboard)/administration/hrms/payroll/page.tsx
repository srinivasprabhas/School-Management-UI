import type { Metadata } from "next"

import { PayrollContent } from "./_components/payroll-content"

export const metadata: Metadata = {
  title: "Payroll — MyCampus360",
}

export default function Page() {
  return <PayrollContent />
}
